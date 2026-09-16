#!/usr/bin/env python3
"""
MJMS Phase 3B — Import product images from extraction manifest into Supabase.

Matches articles by source_sheet + source_row (source_key = "<sheet>::<row>").
NEVER matches by Project name alone.

Usage:
  python scripts/mjms-import/import-images.py --dry-run
  python scripts/mjms-import/import-images.py --import
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import mimetypes
import os
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
MANIFEST_CSV = SCRIPT_DIR / "reports" / "image-manifest.csv"
ARTICLE_CSV = SCRIPT_DIR / "reports" / "article-master.csv"
EXTRACTED_DIR = SCRIPT_DIR / "extracted-images"
ALL_MEDIA_DIR = EXTRACTED_DIR / "_all_media"
REPORT_PATH = SCRIPT_DIR / "reports" / "image-import-report.md"

TEMPLATE_ASSETS = {"image54.png", "image55.png"}

MIME_BY_EXT = {
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".wdp": "image/vnd.ms-photo",
}


@dataclass
class PlannedImage:
    manifest_row: dict[str, str]
    article_id: str
    source_key: str
    storage_path: str
    image_order: int
    is_primary: bool
    sha256: str
    mime_type: str
    local_path: Path
    skip_reason: str | None = None


@dataclass
class DryRunResult:
    total_placements: int = 0
    ready: list[PlannedImage] = field(default_factory=list)
    skipped: list[PlannedImage] = field(default_factory=list)
    missing_files: list[dict[str, str]] = field(default_factory=list)
    no_article: list[dict[str, str]] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    wdp_unreferenced: int = 0


@dataclass
class ImportStats:
    uploads_success: int = 0
    inserts_success: int = 0
    skipped_existing: int = 0
    upload_failures: list[dict[str, str]] = field(default_factory=list)
    insert_failures: list[dict[str, str]] = field(default_factory=list)
    orphan_uploads: list[dict[str, str]] = field(default_factory=list)


def load_env() -> tuple[str, str]:
    load_dotenv(PROJECT_ROOT / ".env")
    load_dotenv(PROJECT_ROOT / ".env.local")
    url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url:
        raise RuntimeError("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL")
    if not key:
        raise RuntimeError("Missing SUPABASE_SERVICE_ROLE_KEY")
    return url.rstrip("/"), key


def source_key(sheet: str, excel_row: str | int) -> str:
    return f"{sheet}::{excel_row}"


def load_manifest(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        raise FileNotFoundError(f"Manifest not found: {path}")
    with path.open(encoding="utf-8", newline="") as fh:
        reader = csv.DictReader(fh)
        required = {
            "image_id", "sheet", "excel_row", "source_file", "extracted_file",
            "sha256", "image_sequence", "confidence", "verification_status",
        }
        if not reader.fieldnames or not required.issubset(set(reader.fieldnames)):
            missing = required - set(reader.fieldnames or [])
            raise ValueError(f"Manifest missing columns: {', '.join(sorted(missing))}")
        return list(reader)


def fetch_articles(client) -> dict[str, dict[str, Any]]:
    """Map source_key -> {id, source_sheet, source_row, project_raw}."""
    mapping: dict[str, dict[str, Any]] = {}
    offset = 0
    page_size = 1000
    while True:
        response = (
            client.table("articles")
            .select("id, source_key, source_sheet, source_row, project_raw")
            .range(offset, offset + page_size - 1)
            .execute()
        )
        batch = response.data or []
        if not batch:
            break
        for row in batch:
            mapping[row["source_key"]] = row
        if len(batch) < page_size:
            break
        offset += page_size
    return mapping


def resolve_local_path(extracted_file: str) -> Path:
    rel = extracted_file.replace("extracted-images/", "").replace("extracted-images\\", "")
    return EXTRACTED_DIR / rel.replace("/", os.sep)


def mime_for_path(path: Path) -> str | None:
    ext = path.suffix.lower()
    if ext in MIME_BY_EXT:
        return MIME_BY_EXT[ext]
    guessed, _ = mimetypes.guess_type(path.name)
    return guessed


def compute_sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def classify_skip(row: dict[str, str]) -> str | None:
    status = row.get("verification_status", "").strip()
    confidence = row.get("confidence", "").strip()
    source_file = row.get("source_file", "").strip()
    extracted = row.get("extracted_file", "")

    if source_file.lower().endswith(".wdp"):
        return "unsupported_wdp"
    if source_file in TEMPLATE_ASSETS:
        return "template_asset"
    if status == "UNMATCHED":
        return "unmatched"
    if status == "NEEDS_REVIEW":
        return "needs_review"
    if confidence != "HIGH":
        return "low_confidence"
    if status != "VERIFIED":
        return f"status_{status.lower() or 'unknown'}"
    if "_unmatched/" in extracted.replace("\\", "/"):
        return "orphan_unmatched_path"
    return None


def plan_images(
    manifest: list[dict[str, str]],
    articles: dict[str, dict[str, Any]],
) -> DryRunResult:
    result = DryRunResult(total_placements=len(manifest))

    # First pass: classify each placement
    candidates: list[tuple[dict[str, str], str, dict[str, Any] | None, Path | None, str | None]] = []

    for row in manifest:
        key = source_key(row["sheet"], row["excel_row"])
        article = articles.get(key)
        local_path = resolve_local_path(row["extracted_file"])
        skip = classify_skip(row)

        if skip is None and not local_path.is_file():
            skip = "missing_file"
            result.missing_files.append(
                {
                    "image_id": row["image_id"],
                    "source_key": key,
                    "extracted_file": row["extracted_file"],
                    "path": str(local_path),
                }
            )

        if skip is None and article is None:
            skip = "no_article"
            result.no_article.append(
                {"image_id": row["image_id"], "source_key": key, "sheet": row["sheet"], "excel_row": row["excel_row"]}
            )

        candidates.append((row, key, article, local_path if local_path.is_file() else None, skip))

    # Group ready rows by article for deterministic ordering
    ready_by_article: dict[str, list[tuple[dict[str, str], dict[str, Any], Path]]] = defaultdict(list)

    for row, key, article, local_path, skip in candidates:
        planned = PlannedImage(
            manifest_row=row,
            article_id=article["id"] if article else "",
            source_key=key,
            storage_path="",
            image_order=0,
            is_primary=False,
            sha256=row.get("sha256", ""),
            mime_type="",
            local_path=local_path or resolve_local_path(row["extracted_file"]),
            skip_reason=skip,
        )

        if skip:
            result.skipped.append(planned)
            continue

        assert article is not None and local_path is not None
        ready_by_article[article["id"]].append((row, article, local_path))

    for article_id, items in ready_by_article.items():
        items.sort(key=lambda t: (int(t[0].get("image_sequence") or 0), t[0]["image_id"]))
        for order, (row, article, local_path) in enumerate(items, start=1):
            ext = local_path.suffix.lower() or ".jpeg"
            if ext == ".jpg":
                ext = ".jpeg"
            storage_path = f"products/{article_id}/{order:02d}{ext}"
            mime = mime_for_path(local_path)
            if not mime:
                result.errors.append(f"No MIME type for {local_path}")

            file_sha = compute_sha256(local_path)
            manifest_sha = row.get("sha256", "")
            if manifest_sha and file_sha != manifest_sha:
                result.errors.append(
                    f"SHA mismatch {row['image_id']}: manifest={manifest_sha[:16]} file={file_sha[:16]}"
                )

            result.ready.append(
                PlannedImage(
                    manifest_row=row,
                    article_id=article_id,
                    source_key=source_key(row["sheet"], row["excel_row"]),
                    storage_path=storage_path,
                    image_order=order,
                    is_primary=(order == 1),
                    sha256=file_sha,
                    mime_type=mime or "application/octet-stream",
                    local_path=local_path,
                )
            )

    if ALL_MEDIA_DIR.is_dir():
        result.wdp_unreferenced = sum(
            1 for f in ALL_MEDIA_DIR.iterdir() if f.is_file() and f.suffix.lower() == ".wdp"
        )

    return result


def count_skip_reasons(skipped: list[PlannedImage]) -> Counter:
    return Counter(p.skip_reason or "unknown" for p in skipped)


def duplicate_sha_groups(placements: list[PlannedImage]) -> dict[str, list[PlannedImage]]:
    groups: dict[str, list[PlannedImage]] = defaultdict(list)
    for p in placements:
        if p.sha256:
            groups[p.sha256].append(p)
    return {sha: items for sha, items in groups.items() if len(items) > 1}


def special_cases(manifest: list[dict[str, str]], result: DryRunResult) -> list[dict[str, str]]:
    cases = []
    for row in manifest:
        sheet, row_num = row["sheet"], row["excel_row"]
        sf = row.get("source_file", "")
        project = row.get("project_raw", "")

        tags = []
        if sheet == "SUMMER DIP PU" and row_num == "5" and project.upper() == "BIANCA":
            tags.append("BIANCA")
        if sf == "image184.jpeg" and project.upper() in ("APRICOT", "OSCAR"):
            tags.append("APRICOT_OSCAR_shared_binary")
        if sf == "image13.jpeg" and sheet == "SUMMER FLAT":
            tags.append("SUMMER_FLAT_image13_orphan")
        if sf == "image54.png":
            tags.append("recurring_image54")
        if sf == "image55.png":
            tags.append("recurring_image55")
        if row.get("verification_status") == "NEEDS_REVIEW":
            tags.append("NEEDS_REVIEW")

        if tags:
            skip = classify_skip(row)
            cases.append(
                {
                    "tags": ", ".join(tags),
                    "image_id": row["image_id"],
                    "sheet": sheet,
                    "excel_row": row_num,
                    "project": project,
                    "source_file": sf,
                    "verification_status": row.get("verification_status", ""),
                    "confidence": row.get("confidence", ""),
                    "action": "skip" if skip else "ready",
                    "reason": skip or "ready_for_import",
                }
            )
    return cases


def fetch_existing_images(client) -> tuple[set[str], set[str]]:
    paths: set[str] = set()
    refs: set[str] = set()
    offset = 0
    page_size = 1000
    while True:
        response = (
            client.table("article_images")
            .select("storage_path, import_ref")
            .range(offset, offset + page_size - 1)
            .execute()
        )
        batch = response.data or []
        if not batch:
            break
        for row in batch:
            if row.get("storage_path"):
                paths.add(row["storage_path"])
            if row.get("import_ref"):
                refs.add(row["import_ref"])
        if len(batch) < page_size:
            break
        offset += page_size
    return paths, refs


def build_db_row(planned: PlannedImage) -> dict[str, Any]:
    row = planned.manifest_row
    width = row.get("width", "").strip()
    height = row.get("height", "").strip()
    file_size = row.get("file_size", "").strip()
    return {
        "article_id": planned.article_id,
        "storage_path": planned.storage_path,
        "original_filename": row.get("source_file"),
        "mime_type": planned.mime_type,
        "file_size": int(file_size) if file_size else planned.local_path.stat().st_size,
        "width": int(width) if width else None,
        "height": int(height) if height else None,
        "sha256": planned.sha256,
        "image_order": planned.image_order,
        "is_primary": planned.is_primary,
        "import_ref": row.get("image_id"),
        "source_sheet": row.get("sheet"),
        "source_row": int(row.get("excel_row") or 0),
        "manifest_confidence": row.get("confidence"),
        "verification_status": row.get("verification_status"),
        "notes": row.get("notes") or None,
    }


def storage_object_exists(client, storage_path: str) -> bool:
    folder, name = storage_path.rsplit("/", 1)
    try:
        items = client.storage.from_("product-images").list(folder) or []
        return any(item.get("name") == name for item in items)
    except Exception:
        return False


def run_import(client, ready: list[PlannedImage]) -> ImportStats:
    stats = ImportStats()
    existing_paths, existing_refs = fetch_existing_images(client)

    for planned in ready:
        row = planned.manifest_row
        import_ref = row.get("image_id", "")
        ref_label = import_ref or planned.storage_path

        if planned.storage_path in existing_paths or import_ref in existing_refs:
            stats.skipped_existing += 1
            continue

        if storage_object_exists(client, planned.storage_path):
            stats.skipped_existing += 1
            existing_paths.add(planned.storage_path)
            continue

        file_bytes = planned.local_path.read_bytes()
        uploaded = False
        try:
            client.storage.from_("product-images").upload(
                planned.storage_path,
                file_bytes,
                file_options={"content-type": planned.mime_type, "upsert": "false"},
            )
            uploaded = True
            stats.uploads_success += 1
        except Exception as exc:
            msg = str(exc)
            if "Duplicate" in msg or "already exists" in msg.lower():
                stats.skipped_existing += 1
                existing_paths.add(planned.storage_path)
                continue
            stats.upload_failures.append(
                {
                    "import_ref": ref_label,
                    "article_id": planned.article_id,
                    "source_key": planned.source_key,
                    "storage_path": planned.storage_path,
                    "error": msg,
                }
            )
            continue

        db_row = build_db_row(planned)
        try:
            client.table("article_images").insert(db_row).execute()
            stats.inserts_success += 1
            existing_paths.add(planned.storage_path)
            existing_refs.add(import_ref)
        except Exception as exc:
            stats.insert_failures.append(
                {
                    "import_ref": ref_label,
                    "article_id": planned.article_id,
                    "source_key": planned.source_key,
                    "storage_path": planned.storage_path,
                    "error": str(exc),
                }
            )
            if uploaded:
                stats.orphan_uploads.append(
                    {
                        "import_ref": ref_label,
                        "article_id": planned.article_id,
                        "storage_path": planned.storage_path,
                        "note": "Storage upload succeeded but DB insert failed — manual reconciliation required",
                    }
                )

    return stats


def count_storage_objects(client) -> int:
    """Count files under products/{article_id}/ in the product-images bucket."""
    try:
        folders = client.storage.from_("product-images").list("products", {"limit": 1000}) or []
        total = 0
        for folder in folders:
            name = folder.get("name")
            if not name:
                continue
            files = client.storage.from_("product-images").list(f"products/{name}") or []
            total += len(files)
        return total
    except Exception:
        return 0


def write_report(
    *,
    mode: str,
    result: DryRunResult,
    manifest_path: Path,
    special: list[dict[str, str]],
    import_stats: ImportStats | None = None,
    verification: dict[str, Any] | None = None,
) -> None:
    skip_counts = count_skip_reasons(result.skipped)
    ready_by_article = len({p.article_id for p in result.ready})
    all_articles = 252
    articles_zero_ready = all_articles - ready_by_article

    dup_ready = duplicate_sha_groups(result.ready)
    dup_all = duplicate_sha_groups(result.ready + [p for p in result.skipped if p.sha256])

    ts = datetime.now(timezone.utc).isoformat()
    lines = [
        "# MJMS Image Import Report",
        "",
        f"**Generated (UTC):** {ts}",
        f"**Mode:** {mode}",
        "",
        "## Source Files",
        "",
        f"- Manifest: `{manifest_path.relative_to(PROJECT_ROOT).as_posix()}`",
        f"- Extracted images: `scripts/mjms-import/extracted-images/`",
        f"- Article matching: `source_sheet` + `source_row` → `source_key` (`<sheet>::<row>`)",
        "",
        "## Mapping Methodology",
        "",
        "1. Read each row from `image-manifest.csv`.",
        "2. Build `source_key` from `sheet` + `excel_row` (never Project name alone).",
        "3. Look up `articles.id` in Supabase by `source_key`.",
        "4. Skip UNMATCHED, NEEDS_REVIEW, template assets (image54/55), `.wdp`, low confidence.",
        "5. Require VERIFIED + HIGH confidence + existing extracted file.",
        "6. Order ready images per article by manifest `image_sequence`.",
        "7. Assign `image_order` 1..N; first image `is_primary=true`.",
        "8. Planned storage path: `products/{article_id}/{order:02d}.{ext}`",
        "",
        "## Totals",
        "",
        f"- Total manifest placements: **{result.total_placements}**",
        f"- Confidently mapped (ready): **{len(result.ready)}**",
        f"- Needs review (skipped): **{skip_counts.get('needs_review', 0)}**",
        f"- Unmatched (skipped): **{skip_counts.get('unmatched', 0)}**",
        f"- Orphan/unmatched path (skipped): **{skip_counts.get('orphan_unmatched_path', 0)}**",
        f"- Template image54/55 (skipped): **{skip_counts.get('template_asset', 0)}**",
        f"- Unsupported WDP in manifest: **{skip_counts.get('unsupported_wdp', 0)}**",
        f"- Unreferenced WDP in `_all_media/`: **{result.wdp_unreferenced}**",
        f"- Missing extracted files: **{len(result.missing_files)}**",
        f"- No article match: **{len(result.no_article)}**",
        f"- Low confidence (skipped): **{skip_counts.get('low_confidence', 0)}**",
        f"- Duplicate SHA groups (ready only): **{len(dup_ready)}**",
        f"- Duplicate SHA groups (all placements): **{len(dup_all)}**",
        f"- Articles with ≥1 ready image: **{ready_by_article}**",
        f"- Articles with zero ready images: **{articles_zero_ready}**",
        f"- Total images ready for import: **{len(result.ready)}**",
        "",
        "## Skip Breakdown",
        "",
    ]
    for reason, count in skip_counts.most_common():
        lines.append(f"- `{reason}`: **{count}**")

    lines.extend(["", "## Special Cases", ""])
    for case in special:
        lines.append(
            f"- **{case['tags']}** — `{case['image_id']}` "
            f"({case['sheet']} row {case['excel_row']}, {case['project'] or 'no project'}) "
            f"[{case['source_file']}] → **{case['action']}** ({case['reason']})"
        )

    if result.missing_files:
        lines.extend(["", "## Missing Files", ""])
        for mf in result.missing_files:
            lines.append(f"- `{mf['image_id']}`: {mf['extracted_file']}")

    if result.errors:
        lines.extend(["", "## Errors", ""])
        for err in result.errors:
            lines.append(f"- {err}")

    if dup_ready and mode == "dry-run":
        lines.extend(["", "## Duplicate SHA (ready for import)", ""])
        for sha, items in sorted(dup_ready.items(), key=lambda x: -len(x[1]))[:15]:
            refs = ", ".join(f"{p.source_key}/{p.manifest_row['source_file']}" for p in items[:4])
            lines.append(f"- `{sha[:16]}…` × {len(items)}: {refs}")

    if import_stats:
        lines.extend(
            [
                "",
                "## Import Result",
                "",
                f"- Storage uploads successful: **{import_stats.uploads_success}**",
                f"- DB inserts successful: **{import_stats.inserts_success}**",
                f"- Skipped (already existing): **{import_stats.skipped_existing}**",
                f"- Upload failures: **{len(import_stats.upload_failures)}**",
                f"- DB insert failures: **{len(import_stats.insert_failures)}**",
                f"- Orphan uploads (storage ok, DB failed): **{len(import_stats.orphan_uploads)}**",
                "",
            ]
        )
        if import_stats.upload_failures:
            lines.extend(["### Upload Failures", ""])
            for f in import_stats.upload_failures:
                lines.append(
                    f"- `{f['import_ref']}` article={f['article_id']} path={f['storage_path']}: {f['error']}"
                )
            lines.append("")
        if import_stats.insert_failures:
            lines.extend(["### DB Insert Failures", ""])
            for f in import_stats.insert_failures:
                lines.append(
                    f"- `{f['import_ref']}` article={f['article_id']} path={f['storage_path']}: {f['error']}"
                )
            lines.append("")
        if import_stats.orphan_uploads:
            lines.extend(["### Orphan Uploads (reconciliation required)", ""])
            for f in import_stats.orphan_uploads:
                lines.append(f"- `{f['import_ref']}` path={f['storage_path']}: {f['note']}")

    if verification:
        lines.extend(["", "## Post-Import Verification", ""])
        for k, v in verification.items():
            lines.append(f"- {k}: **{v}**")
        lines.append("")

    if mode == "dry-run":
        lines.extend(
            [
                "",
                "## Import Policy",
                "",
                "- Upload to private bucket `product-images`.",
                "- Insert `article_images` with planned `storage_path`.",
                "- Do not overwrite existing storage paths.",
                "- Do not import skipped categories without manual approval.",
                "",
            ]
        )

    REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")


def print_summary(
    mode: str,
    result: DryRunResult,
    import_stats: ImportStats | None = None,
    verification: dict[str, Any] | None = None,
) -> None:
    skip_counts = count_skip_reasons(result.skipped)
    ready_articles = len({p.article_id for p in result.ready})

    print(f"{mode.upper()} - no uploads or DB writes" if mode == "dry-run" else "IMPORT COMPLETE")
    print("=" * 55)
    print(f"  Total manifest placements:     {result.total_placements}")
    print(f"  Ready for import:              {len(result.ready)}")
    if import_stats:
        print(f"  Uploads successful:            {import_stats.uploads_success}")
        print(f"  DB inserts successful:         {import_stats.inserts_success}")
        print(f"  Skipped (already existing):    {import_stats.skipped_existing}")
        print(f"  Upload failures:               {len(import_stats.upload_failures)}")
        print(f"  DB insert failures:            {len(import_stats.insert_failures)}")
        print(f"  Orphan uploads:                {len(import_stats.orphan_uploads)}")
    print(f"  Skipped (classification):      {len(result.skipped)}")
    print(f"    needs_review:                {skip_counts.get('needs_review', 0)}")
    print(f"    unmatched:                   {skip_counts.get('unmatched', 0)}")
    print(f"    template (image54/55):       {skip_counts.get('template_asset', 0)}")
    if verification:
        print(f"  Final article_images count:    {verification.get('article_images_count')}")
        print(f"  Final storage objects:         {verification.get('storage_objects')}")
        print(f"  Articles with images:          {verification.get('articles_with_images')}")
        print(f"  Articles without images:       {verification.get('articles_without_images')}")
    if result.errors:
        print(f"  Planning errors:               {len(result.errors)}")
    print(f"\n  Report: {REPORT_PATH}")


def verify_import(client) -> dict[str, Any]:
    articles_resp = client.table("articles").select("id", count="exact").limit(0).execute()
    articles_count = articles_resp.count or 0

    images = client.table("article_images").select(
        "id, article_id, storage_path, is_primary, import_ref, "
        "verification_status, original_filename, manifest_confidence"
    ).limit(1000).execute()
    image_rows = images.data or []

    article_ids = {r["id"] for r in client.table("articles").select("id").limit(1000).execute().data or []}
    articles_with_images = len({r["article_id"] for r in image_rows})

    storage_paths = [r["storage_path"] for r in image_rows if r.get("storage_path")]
    dup_paths = [p for p, c in Counter(storage_paths).items() if c > 1]

    primary_by_article = Counter(r["article_id"] for r in image_rows if r.get("is_primary"))
    multi_primary = [aid for aid, c in primary_by_article.items() if c > 1]

    invalid_article_refs = [r["id"] for r in image_rows if r["article_id"] not in article_ids]

    needs_review_imported = sum(1 for r in image_rows if r.get("verification_status") == "NEEDS_REVIEW")
    unmatched_imported = sum(1 for r in image_rows if r.get("verification_status") == "UNMATCHED")
    template_imported = sum(
        1 for r in image_rows if r.get("original_filename") in TEMPLATE_ASSETS
    )
    wdp_imported = sum(
        1 for r in image_rows if str(r.get("original_filename", "")).lower().endswith(".wdp")
    )

    storage_count = count_storage_objects(client)

    return {
        "articles_count": articles_count,
        "article_images_count": len(image_rows),
        "articles_with_images": articles_with_images,
        "articles_without_images": articles_count - articles_with_images,
        "storage_objects": storage_count,
        "duplicate_storage_paths": len(dup_paths),
        "multi_primary_articles": len(multi_primary),
        "invalid_article_refs": len(invalid_article_refs),
        "needs_review_imported": needs_review_imported,
        "unmatched_imported": unmatched_imported,
        "template_imported": template_imported,
        "wdp_imported": wdp_imported,
        "dup_paths": dup_paths,
        "multi_primary": multi_primary,
        "orphan_details": invalid_article_refs,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="MJMS product image import")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--dry-run", action="store_true")
    group.add_argument("--import", dest="do_import", action="store_true")
    args = parser.parse_args()

    try:
        url, key = load_env()
        manifest = load_manifest(MANIFEST_CSV)
    except (RuntimeError, FileNotFoundError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    from supabase import create_client

    client = create_client(url, key)
    articles = fetch_articles(client)

    if len(articles) != 252:
        print(f"WARNING: Expected 252 articles in database, found {len(articles)}", file=sys.stderr)

    result = plan_images(manifest, articles)
    special = special_cases(manifest, result)

    if args.dry_run:
        write_report(mode="dry-run", result=result, manifest_path=MANIFEST_CSV, special=special)
        print_summary("dry-run", result)
        return 0 if not result.errors else 1

    if result.errors:
        print("ERROR: Cannot import — planning errors detected:", file=sys.stderr)
        for err in result.errors:
            print(f"  - {err}", file=sys.stderr)
        return 1

    if len(result.ready) != 257:
        print(
            f"WARNING: Expected 257 ready images, planning produced {len(result.ready)}",
            file=sys.stderr,
        )

    import_stats = run_import(client, result.ready)
    verification = verify_import(client)

    write_report(
        mode="import",
        result=result,
        manifest_path=MANIFEST_CSV,
        special=special,
        import_stats=import_stats,
        verification=verification,
    )
    print_summary("import", result, import_stats, verification)

    failed = bool(import_stats.upload_failures or import_stats.insert_failures or import_stats.orphan_uploads)
    checks_ok = (
        verification["articles_count"] == 252
        and verification["article_images_count"] == 257
        and verification["articles_with_images"] == 235
        and verification["articles_without_images"] == 17
        and verification["storage_objects"] == 257
        and verification["needs_review_imported"] == 0
        and verification["unmatched_imported"] == 0
        and verification["template_imported"] == 0
        and verification["wdp_imported"] == 0
        and verification["invalid_article_refs"] == 0
        and verification["duplicate_storage_paths"] == 0
        and verification["multi_primary_articles"] == 0
    )

    print("\nVERIFICATION CHECKS")
    print("=" * 55)
    for label, ok in [
        ("Articles total = 252", verification["articles_count"] == 252),
        ("article_images = 257", verification["article_images_count"] == 257),
        ("Articles with images = 235", verification["articles_with_images"] == 235),
        ("Articles without images = 17", verification["articles_without_images"] == 17),
        ("Storage objects = 257", verification["storage_objects"] == 257),
        ("No NEEDS_REVIEW imported", verification["needs_review_imported"] == 0),
        ("No UNMATCHED imported", verification["unmatched_imported"] == 0),
        ("No template image54/55", verification["template_imported"] == 0),
        ("No WDP imported", verification["wdp_imported"] == 0),
        ("All article_ids valid", verification["invalid_article_refs"] == 0),
        ("No duplicate storage paths", verification["duplicate_storage_paths"] == 0),
        ("No multi-primary articles", verification["multi_primary_articles"] == 0),
    ]:
        print(f"  [{'PASS' if ok else 'FAIL'}] {label}")

    if failed or not checks_ok:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
