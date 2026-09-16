#!/usr/bin/env python3
"""
MJMS Phase 3A — Import article rows from article-master.csv into Supabase.

Server-side only. Uses SUPABASE_SERVICE_ROLE_KEY (never expose to clients).

Usage:
  python scripts/mjms-import/import-articles.py --dry-run
  python scripts/mjms-import/import-articles.py --import
"""

from __future__ import annotations

import argparse
import csv
import os
import sys
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
DEFAULT_CSV = SCRIPT_DIR / "reports" / "article-master.csv"
DEFAULT_MISSING_CSV = SCRIPT_DIR / "reports" / "missing-images.csv"
REPORT_PATH = SCRIPT_DIR / "reports" / "article-import-report.md"

EXPECTED_ROW_COUNT = 252

REQUIRED_CSV_COLUMNS = [
    "sheet",
    "excel_row",
    "source_id",
    "no",
    "season",
    "making",
    "type",
    "project",
    "size_range",
    "qty",
    "material",
    "colour",
    "remarks",
    "season_normalized",
    "making_normalized",
    "type_normalized",
    "project_normalized",
]

DB_COLUMNS = [
    "project_raw",
    "season_raw",
    "making_raw",
    "type_raw",
    "size_range_raw",
    "qty_raw",
    "material_raw",
    "colour_raw",
    "remarks_raw",
    "project_normalized",
    "season_normalized",
    "making_normalized",
    "type_normalized",
    "source_sheet",
    "source_row",
    "source_no",
    "source_key",
]


@dataclass
class ValidationResult:
    rows: list[dict[str, Any]] = field(default_factory=list)
    invalid: list[dict[str, str]] = field(default_factory=list)
    duplicate_keys: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


@dataclass
class ImportPlan:
    csv_total: int = 0
    valid: int = 0
    invalid: int = 0
    duplicate_in_csv: int = 0
    existing_in_db: int = 0
    new_rows: int = 0
    to_insert: list[dict[str, Any]] = field(default_factory=list)
    skipped_keys: list[str] = field(default_factory=list)
    needs_review: list[dict[str, str]] = field(default_factory=list)


def load_env() -> tuple[str, str]:
    load_dotenv(PROJECT_ROOT / ".env")
    load_dotenv(PROJECT_ROOT / ".env.local")

    url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not url:
        raise RuntimeError(
            "Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL). Set in .env at project root."
        )
    if not key:
        raise RuntimeError(
            "Missing SUPABASE_SERVICE_ROLE_KEY. Set in .env at project root (server-side only)."
        )
    return url.rstrip("/"), key


def raw_text(value: Any) -> str | None:
    """Preserve source text; empty CSV cells become None for nullable DB columns."""
    if value is None:
        return None
    text = str(value)
    if text == "":
        return None
    return text


def raw_text_required(value: Any, field_name: str, source_key: str) -> str:
    text = raw_text(value)
    if text is None:
        raise ValueError(f"{field_name} is required for {source_key}")
    return text


def csv_row_to_db(row: dict[str, str]) -> dict[str, Any]:
    sheet = raw_text_required(row["sheet"], "sheet", row.get("source_id", "?"))
    excel_row = int(row["excel_row"])
    source_key = raw_text_required(row["source_id"], "source_id", row.get("source_id", "?"))

    expected_key = f"{sheet}::{excel_row}"
    if source_key != expected_key:
        raise ValueError(f"source_id mismatch: got {source_key!r}, expected {expected_key!r}")

    source_no = raw_text(row["no"])

    return {
        "project_raw": raw_text_required(row["project"], "project", source_key),
        "season_raw": raw_text(row["season"]),
        "making_raw": raw_text(row["making"]),
        "type_raw": raw_text(row["type"]),
        "size_range_raw": raw_text(row["size_range"]),
        "qty_raw": raw_text(row["qty"]),
        "material_raw": raw_text(row["material"]),
        "colour_raw": raw_text(row["colour"]),
        "remarks_raw": raw_text(row["remarks"]),
        "project_normalized": raw_text(row["project_normalized"]),
        "season_normalized": raw_text(row["season_normalized"]),
        "making_normalized": raw_text(row["making_normalized"]),
        "type_normalized": raw_text(row["type_normalized"]),
        "source_sheet": sheet,
        "source_row": excel_row,
        "source_no": source_no,
        "source_key": source_key,
    }


def load_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        raise FileNotFoundError(f"Article master CSV not found: {path}")
    with path.open(encoding="utf-8", newline="") as fh:
        reader = csv.DictReader(fh)
        if not reader.fieldnames:
            raise ValueError("CSV has no header row")
        missing = [c for c in REQUIRED_CSV_COLUMNS if c not in reader.fieldnames]
        if missing:
            raise ValueError(f"CSV missing required columns: {', '.join(missing)}")
        return list(reader)


def validate_csv(rows: list[dict[str, str]]) -> ValidationResult:
    result = ValidationResult()

    if len(rows) != EXPECTED_ROW_COUNT:
        result.errors.append(
            f"Expected {EXPECTED_ROW_COUNT} article rows in CSV, found {len(rows)}"
        )

    key_counts = Counter(r.get("source_id", "") for r in rows)
    result.duplicate_keys = [k for k, c in key_counts.items() if k and c > 1]

    for idx, row in enumerate(rows, start=2):
        line_ref = f"CSV line ~{idx} source_id={row.get('source_id', '?')!r}"
        try:
            db_row = csv_row_to_db(row)
            result.rows.append(db_row)
        except (ValueError, TypeError) as exc:
            result.invalid.append({"line": line_ref, "reason": str(exc)})

    if result.duplicate_keys:
        result.errors.append(
            f"Duplicate source_id in CSV: {', '.join(result.duplicate_keys)}"
        )

    return result


def load_needs_review(csv_path: Path) -> list[dict[str, str]]:
    if not csv_path.exists():
        return []
    items = []
    with csv_path.open(encoding="utf-8", newline="") as fh:
        for row in csv.DictReader(fh):
            if row.get("status") == "NEEDS_REVIEW":
                items.append(
                    {
                        "source_key": f"{row['sheet']}::{row['excel_row']}",
                        "project": row.get("project_raw", ""),
                        "notes": row.get("notes", ""),
                    }
                )
    return items


def fetch_existing_source_keys(client) -> set[str]:
    existing: set[str] = set()
    page_size = 1000
    offset = 0
    while True:
        response = (
            client.table("articles")
            .select("source_key")
            .range(offset, offset + page_size - 1)
            .execute()
        )
        batch = response.data or []
        if not batch:
            break
        for row in batch:
            if row.get("source_key"):
                existing.add(row["source_key"])
        if len(batch) < page_size:
            break
        offset += page_size
    return existing


def fetch_article_count(client) -> int:
    response = client.table("articles").select("id", count="exact").limit(0).execute()
    return response.count or 0


def build_plan(
    validation: ValidationResult,
    existing_keys: set[str],
    needs_review: list[dict[str, str]],
    csv_total: int,
) -> ImportPlan:
    plan = ImportPlan(
        csv_total=csv_total,
        valid=len(validation.rows),
        invalid=len(validation.invalid),
        duplicate_in_csv=len(validation.duplicate_keys),
        needs_review=needs_review,
    )

    for row in validation.rows:
        key = row["source_key"]
        if key in existing_keys:
            plan.existing_in_db += 1
            plan.skipped_keys.append(key)
        else:
            plan.new_rows += 1
            plan.to_insert.append(row)

    return plan


def write_report(
    *,
    mode: str,
    csv_path: Path,
    plan: ImportPlan,
    validation: ValidationResult,
    import_result: dict[str, Any] | None = None,
    final_count: int | None = None,
) -> None:
    ts = datetime.now(timezone.utc).isoformat()
    lines = [
        "# MJMS Article Import Report",
        "",
        f"**Generated (UTC):** {ts}",
        f"**Mode:** {mode}",
        f"**Source file:** `{csv_path.relative_to(PROJECT_ROOT).as_posix()}`",
        "",
        "## Summary",
        "",
        f"- CSV rows read: **{plan.csv_total}**",
        f"- Valid rows: **{plan.valid}**",
        f"- Invalid rows: **{plan.invalid}**",
        f"- Duplicate source_key in CSV: **{plan.duplicate_in_csv}**",
        f"- Already in database: **{plan.existing_in_db}**",
        f"- New rows to insert: **{plan.new_rows}**",
        "",
    ]

    if import_result:
        lines.extend(
            [
                "## Import Result",
                "",
                f"- Inserted: **{import_result.get('inserted', 0)}**",
                f"- Skipped (existing source_key): **{import_result.get('skipped', 0)}**",
                f"- Failed: **{import_result.get('failed', 0)}**",
                f"- Final articles count: **{final_count}**",
                "",
            ]
        )
    elif final_count is not None:
        lines.append(f"- Current database articles count: **{final_count}**")
        lines.append("")

    if validation.invalid:
        lines.extend(["## Invalid Rows", ""])
        for item in validation.invalid:
            lines.append(f"- {item['line']}: {item['reason']}")
        lines.append("")

    if plan.skipped_keys and mode == "dry-run":
        lines.extend(["## Existing source_key (would skip on import)", ""])
        for key in sorted(plan.skipped_keys)[:50]:
            lines.append(f"- `{key}`")
        if len(plan.skipped_keys) > 50:
            lines.append(f"- ... and {len(plan.skipped_keys) - 50} more")
        lines.append("")

    if validation.errors:
        lines.extend(["## Errors", ""])
        for err in validation.errors:
            lines.append(f"- {err}")
        lines.append("")

    if validation.warnings:
        lines.extend(["## Warnings", ""])
        for warn in validation.warnings:
            lines.append(f"- {warn}")
        lines.append("")

    if plan.needs_review:
        lines.extend(["## NEEDS_REVIEW (from missing-images.csv)", ""])
        for item in plan.needs_review:
            lines.append(
                f"- `{item['source_key']}` ({item['project']}): {item['notes']}"
            )
        lines.append("")

    lines.extend(
        [
            "## Import Policy",
            "",
            "- Idempotent on `source_key` (format `<sheet>::<row>`).",
            "- Existing rows are **not overwritten** (`ON CONFLICT DO NOTHING`).",
            "- Raw values preserved; qty remains text.",
            "- No image data imported in this phase.",
            "",
        ]
    )

    REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")


def run_import(client, rows: list[dict[str, Any]], batch_size: int = 50) -> dict[str, int]:
    inserted = 0
    failed = 0

    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        try:
            response = (
                client.table("articles")
                .upsert(batch, on_conflict="source_key", ignore_duplicates=True)
                .execute()
            )
            inserted += len(response.data or batch)
        except Exception:
            for row in batch:
                try:
                    client.table("articles").upsert(
                        row, on_conflict="source_key", ignore_duplicates=True
                    ).execute()
                    inserted += 1
                except Exception:
                    failed += 1

    return {"inserted": inserted, "failed": failed}


def print_summary(title: str, plan: ImportPlan, validation: ValidationResult, extra: dict | None = None) -> None:
    print(title)
    print("=" * 50)
    print(f"  CSV rows:              {plan.csv_total}")
    print(f"  Valid rows:            {plan.valid}")
    print(f"  Invalid rows:          {plan.invalid}")
    print(f"  Duplicate source_keys: {plan.duplicate_in_csv}")
    print(f"  Already in database:   {plan.existing_in_db}")
    print(f"  New rows to insert:    {plan.new_rows}")
    if extra:
        for k, v in extra.items():
            print(f"  {k}: {v}")
    if validation.errors:
        print("\n  ERRORS:")
        for e in validation.errors:
            print(f"    - {e}")
    if plan.needs_review:
        print(f"\n  NEEDS_REVIEW articles: {len(plan.needs_review)}")
    print(f"\n  Report: {REPORT_PATH}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Import MJMS articles from article-master.csv")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--dry-run", action="store_true", help="Validate and report; no database writes")
    group.add_argument("--import", dest="do_import", action="store_true", help="Insert new articles only")
    parser.add_argument(
        "--csv",
        type=Path,
        default=DEFAULT_CSV,
        help="Path to article-master.csv",
    )
    args = parser.parse_args()

    try:
        url, key = load_env()
    except RuntimeError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    try:
        csv_rows = load_csv(args.csv.resolve())
    except (FileNotFoundError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    validation = validate_csv(csv_rows)
    needs_review = load_needs_review(DEFAULT_MISSING_CSV)

    from supabase import create_client

    client = create_client(url, key)
    existing_keys = fetch_existing_source_keys(client)
    db_count_before = fetch_article_count(client)

    plan = build_plan(validation, existing_keys, needs_review, csv_total=len(csv_rows))

    blocked = bool(validation.errors or validation.invalid)
    if blocked:
        write_report(
            mode="dry-run-blocked" if args.dry_run else "import-blocked",
            csv_path=args.csv,
            plan=plan,
            validation=validation,
            final_count=db_count_before,
        )
        print_summary(
            "VALIDATION FAILED — import blocked",
            plan,
            validation,
            {"DB count (current)": db_count_before},
        )
        return 1

    if args.dry_run:
        write_report(
            mode="dry-run",
            csv_path=args.csv,
            plan=plan,
            validation=validation,
            final_count=db_count_before,
        )
        print_summary(
            "DRY RUN - no database writes performed",
            plan,
            validation,
            {"DB count (current)": db_count_before},
        )
        if plan.new_rows == 0 and plan.valid > 0:
            print("\n  All valid rows already exist in database.")
        elif plan.new_rows > 0:
            print(f"\n  Ready to import {plan.new_rows} new article(s) with --import")
        return 0

    # --import
    import_result = {"inserted": 0, "skipped": plan.existing_in_db, "failed": 0}
    if plan.to_insert:
        result = run_import(client, plan.to_insert)
        import_result["failed"] = result["failed"]
        db_count_mid = fetch_article_count(client)
        import_result["inserted"] = max(0, db_count_mid - db_count_before)

    db_count_after = fetch_article_count(client)
    write_report(
        mode="import",
        csv_path=args.csv,
        plan=plan,
        validation=validation,
        import_result=import_result,
        final_count=db_count_after,
    )
    print_summary(
        "IMPORT COMPLETE",
        plan,
        validation,
        {
            "Inserted": import_result["inserted"],
            "Skipped": import_result["skipped"],
            "Failed": import_result["failed"],
            "DB count (after)": db_count_after,
        },
    )
    return 0 if import_result["failed"] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
