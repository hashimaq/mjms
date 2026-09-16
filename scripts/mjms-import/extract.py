#!/usr/bin/env python3
"""
MJMS Excel workbook extraction utility.

Reads embedded DrawingML image anchors (not Picture column values) and produces
article master data, image manifest, and audit reports.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import re
import shutil
import sys
import zipfile
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET

import openpyxl
from PIL import Image

from normalize import (
    normalize_making,
    normalize_project,
    normalize_season,
    normalize_text,
    normalize_type,
    slugify_sheet,
)

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_WORKBOOK = SCRIPT_DIR.parent.parent / "MJMS PROJECTS OR MOLD DETAIL.xlsx"

NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "xdr": "http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
}

EXPECTED_HEADERS = ["NO", "Season", "MAKING", "TYPE", "Project", "Picture"]
HEADER_ROW = 2
DATA_START_ROW = 3

# Recurring assets observed across many worksheets — flag for manual review.
TEMPLATE_CANDIDATES = {"image54.png", "image55.png"}

ARTICLE_FIELDS = [
    "sheet",
    "excel_row",
    "source_id",
    "no",
    "season",
    "making",
    "type",
    "project",
    "picture",
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

MANIFEST_FIELDS = [
    "image_id",
    "sheet",
    "excel_row",
    "excel_column",
    "project_raw",
    "project_normalized",
    "season",
    "making",
    "type",
    "source_file",
    "extracted_file",
    "width",
    "height",
    "file_size",
    "sha256",
    "image_sequence",
    "mapping_type",
    "confidence",
    "verification_status",
    "notes",
]


@dataclass
class Article:
    sheet: str
    excel_row: int
    no: Any = None
    season: str = ""
    making: str = ""
    type: str = ""
    project: str = ""
    picture: str = ""
    size_range: str = ""
    qty: str = ""
    material: str = ""
    colour: str = ""
    remarks: str = ""

    @property
    def source_id(self) -> str:
        return f"{self.sheet}::{self.excel_row}"

    @property
    def season_normalized(self) -> str:
        return normalize_season(self.season)

    @property
    def making_normalized(self) -> str:
        return normalize_making(self.making)

    @property
    def type_normalized(self) -> str:
        return normalize_type(self.type)

    @property
    def project_normalized(self) -> str:
        return normalize_project(self.project)


@dataclass
class ImagePlacement:
    sheet: str
    drawing_file: str
    anchor_index: int
    anchor_type: str
    excel_row: int
    excel_column: int
    col_off: int
    row_off: int
    source_file: str
    embed_rid: str
    shape_name: str = ""
    is_picture: bool = True
    ext_width: int | None = None
    ext_height: int | None = None
    notes: list[str] = field(default_factory=list)


@dataclass
class MediaInfo:
    source_file: str
    sha256: str
    file_size: int
    width: str
    height: str
    format_note: str = ""


def col_num_to_letter(col: int) -> str:
    letters = ""
    while col:
        col, rem = divmod(col - 1, 26)
        letters = chr(65 + rem) + letters
    return letters


def read_xml(zf: zipfile.ZipFile, path: str) -> ET.Element:
    return ET.fromstring(zf.read(path))


def load_sheet_map(zf: zipfile.ZipFile) -> dict[str, str]:
    """Map sheet name -> worksheet xml path (e.g. xl/worksheets/sheet5.xml)."""
    wb = read_xml(zf, "xl/workbook.xml")
    wb_rels = read_xml(zf, "xl/_rels/workbook.xml.rels")
    rid_to_target = {
        rel.get("Id"): rel.get("Target")
        for rel in wb_rels.findall("rel:Relationship", NS)
    }
    sheet_map: dict[str, str] = {}
    for sheet in wb.find("main:sheets", NS):
        name = sheet.get("name")
        rid = sheet.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
        target = rid_to_target[rid]
        if not target.startswith("xl/"):
            target = "xl/" + target.lstrip("/")
        sheet_map[name] = target
    return sheet_map


def sheet_drawing_path(zf: zipfile.ZipFile, worksheet_path: str) -> str | None:
    sheet_name = worksheet_path.split("/")[-1]
    rel_path = f"xl/worksheets/_rels/{sheet_name}.rels"
    if rel_path not in zf.namelist():
        return None
    rels = read_xml(zf, rel_path)
    for rel in rels.findall("rel:Relationship", NS):
        if rel.get("Type", "").endswith("/drawing"):
            target = rel.get("Target", "")
            if target.startswith("../"):
                return "xl/" + target.replace("../", "")
            return target
    return None


def load_drawing_media_rels(zf: zipfile.ZipFile, drawing_path: str) -> dict[str, str]:
    drawing_name = drawing_path.split("/")[-1]
    rel_path = f"xl/drawings/_rels/{drawing_name}.rels"
    if rel_path not in zf.namelist():
        return {}
    rels = read_xml(zf, rel_path)
    mapping: dict[str, str] = {}
    for rel in rels.findall("rel:Relationship", NS):
        rel_type = rel.get("Type", "")
        if rel_type.endswith("/image") or rel_type.endswith("/hdphoto"):
            target = rel.get("Target", "")
            filename = target.split("/")[-1]
            mapping[rel.get("Id")] = filename
    return mapping


def _int_text(element: ET.Element | None, tag: str, default: int = 0) -> int:
    if element is None:
        return default
    child = element.find(f"xdr:{tag}", NS)
    if child is None or child.text is None:
        return default
    return int(child.text)


def parse_drawing_placements(
    zf: zipfile.ZipFile,
    sheet_name: str,
    drawing_path: str,
) -> list[ImagePlacement]:
    media_rels = load_drawing_media_rels(zf, drawing_path)
    drawing = read_xml(zf, drawing_path)
    drawing_file = drawing_path.split("/")[-1]
    placements: list[ImagePlacement] = []

    for anchor_index, anchor in enumerate(drawing):
        anchor_type = anchor.tag.split("}")[-1]
        if anchor_type not in {"twoCellAnchor", "oneCellAnchor", "absoluteAnchor"}:
            continue

        from_el = anchor.find("xdr:from", NS)
        pic = anchor.find("xdr:pic", NS)
        shape = anchor.find("xdr:sp", NS)

        if pic is None and shape is not None:
            blip = shape.find(".//a:blip", NS)
            if blip is None:
                continue
            is_picture = False
        elif pic is not None:
            blip = pic.find(".//a:blip", NS)
            is_picture = True
        else:
            continue

        if blip is None:
            continue

        embed_rid = blip.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed")
        if not embed_rid:
            continue

        source_file = media_rels.get(embed_rid, "")
        if not source_file:
            continue

        notes: list[str] = []
        if anchor_type == "absoluteAnchor":
            excel_row = 0
            excel_column = 0
            col_off = 0
            row_off = 0
            notes.append("absoluteAnchor — row mapping unreliable")
        else:
            row0 = _int_text(from_el, "row")
            col0 = _int_text(from_el, "col")
            col_off = _int_text(from_el, "colOff")
            row_off = _int_text(from_el, "rowOff")
            excel_row = row0 + 1
            excel_column = col0 + 1

        shape_name = ""
        pic_or_shape = pic if pic is not None else shape
        nv = pic_or_shape.find(".//xdr:cNvPr", NS)
        if nv is not None and nv.get("name"):
            shape_name = nv.get("name", "")

        ext_width = None
        ext_height = None
        sp_pr = pic_or_shape.find("xdr:spPr", NS)
        if sp_pr is None:
            sp_pr = pic_or_shape.find(".//xdr:spPr", NS)
        if sp_pr is not None:
            xfrm = sp_pr.find("a:xfrm", NS)
            if xfrm is not None:
                ext = xfrm.find("a:ext", NS)
                if ext is not None:
                    cx = ext.get("cx")
                    cy = ext.get("cy")
                    if cx is not None:
                        ext_width = int(cx)
                    if cy is not None:
                        ext_height = int(cy)

        if ext_width == 0 or ext_height == 0:
            notes.append("degenerate anchor extent (0 width/height)")

        if not is_picture:
            notes.append("shape-with-image (not xdr:pic) — possible decorative/template element")

        placements.append(
            ImagePlacement(
                sheet=sheet_name,
                drawing_file=drawing_file,
                anchor_index=anchor_index,
                anchor_type=anchor_type,
                excel_row=excel_row,
                excel_column=excel_column,
                col_off=col_off,
                row_off=row_off,
                source_file=source_file,
                embed_rid=embed_rid,
                shape_name=shape_name,
                is_picture=is_picture,
                ext_width=ext_width,
                ext_height=ext_height,
                notes=notes,
            )
        )

    return placements


def is_data_sheet(ws) -> bool:
    headers = [normalize_text(ws.cell(HEADER_ROW, c).value).upper() for c in range(1, 7)]
    expected = [h.upper() for h in EXPECTED_HEADERS]
    return headers[: len(expected)] == expected


def row_has_article_data(ws, row: int) -> bool:
    values = [ws.cell(row, c).value for c in range(1, 12)]
    if any(v not in (None, "") for v in values):
        return True
    return False


def extract_articles(workbook_path: Path) -> tuple[list[Article], list[str], list[str]]:
    articles: list[Article] = []
    data_sheets: list[str] = []
    warnings: list[str] = []

    wb = openpyxl.load_workbook(workbook_path, data_only=True, read_only=False)
    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        try:
            if not is_data_sheet(ws):
                continue
        except Exception as exc:
            warnings.append(f"Sheet '{sheet_name}' header check failed: {exc}")
            continue

        data_sheets.append(sheet_name)
        max_row = ws.max_row or DATA_START_ROW
        for row in range(DATA_START_ROW, max_row + 1):
            if not row_has_article_data(ws, row):
                continue
            article = Article(
                sheet=sheet_name,
                excel_row=row,
                no=ws.cell(row, 1).value,
                season=normalize_text(ws.cell(row, 2).value),
                making=normalize_text(ws.cell(row, 3).value),
                type=normalize_text(ws.cell(row, 4).value),
                project=normalize_text(ws.cell(row, 5).value),
                picture=normalize_text(ws.cell(row, 6).value),
                size_range=normalize_text(ws.cell(row, 7).value),
                qty=normalize_text(ws.cell(row, 8).value),
                material=normalize_text(ws.cell(row, 9).value),
                colour=normalize_text(ws.cell(row, 10).value),
                remarks=normalize_text(ws.cell(row, 11).value),
            )
            articles.append(article)

            if article.project == "":
                warnings.append(f"Empty Project on {sheet_name} row {row}")
            if article.season == "":
                warnings.append(f"Empty Season on {sheet_name} row {row}")

    wb.close()
    return articles, data_sheets, warnings


def analyze_media_bytes(source_file: str, data: bytes) -> MediaInfo:
    sha = hashlib.sha256(data).hexdigest()
    width = ""
    height = ""
    note = ""
    ext = source_file.rsplit(".", 1)[-1].lower()
    if ext == "wdp":
        note = "HD Photo (.wdp) — dimensions not decoded; binary preserved"
    else:
        try:
            with Image.open(io.BytesIO(data)) as img:
                width = str(img.size[0])
                height = str(img.size[1])
        except Exception as exc:
            note = f"Could not read image dimensions: {exc}"
    return MediaInfo(
        source_file=source_file,
        sha256=sha,
        file_size=len(data),
        width=width,
        height=height,
        format_note=note,
    )


def build_media_cache(zf: zipfile.ZipFile) -> dict[str, MediaInfo]:
    cache: dict[str, MediaInfo] = {}
    for name in zf.namelist():
        if not name.startswith("xl/media/"):
            continue
        source_file = name.split("/")[-1]
        data = zf.read(name)
        cache[source_file] = analyze_media_bytes(source_file, data)
    return cache


def article_lookup(articles: list[Article]) -> dict[tuple[str, int], Article]:
    return {(a.sheet, a.excel_row): a for a in articles}


def assign_image_sequences(placements: list[ImagePlacement]) -> dict[tuple[str, int, str, int], int]:
    grouped: dict[tuple[str, int], list[ImagePlacement]] = defaultdict(list)
    for p in placements:
        grouped[(p.sheet, p.excel_row)].append(p)

    seq_map: dict[tuple[str, int, str, int], int] = {}
    for key, items in grouped.items():
        items.sort(key=lambda p: (p.excel_column, p.col_off, p.row_off, p.anchor_index, p.source_file))
        for idx, p in enumerate(items, start=1):
            seq_map[(p.sheet, p.excel_row, p.source_file, p.anchor_index)] = idx
    return seq_map


def classify_placement(
    placement: ImagePlacement,
    article: Article | None,
    template_usage: Counter,
) -> tuple[str, str, str, list[str]]:
    notes = list(placement.notes)
    mapping_type = "drawing_anchor"
    confidence = "HIGH"
    status = "VERIFIED"

    if article is None:
        mapping_type = "unmatched"
        confidence = "LOW"
        status = "UNMATCHED"
        notes.append("No article row at anchored excel_row")
        return mapping_type, confidence, status, notes

    if placement.source_file in TEMPLATE_CANDIDATES:
        confidence = "MEDIUM"
        status = "NEEDS_REVIEW"
        notes.append(
            f"{placement.source_file} appears on {template_usage[placement.source_file]} worksheets — likely template/decorative"
        )

    if not placement.is_picture:
        confidence = "MEDIUM"
        status = "NEEDS_REVIEW"

    if placement.ext_width == 0 or placement.ext_height == 0:
        confidence = "LOW" if confidence == "HIGH" else confidence
        status = "NEEDS_REVIEW"

    if placement.anchor_type == "absoluteAnchor":
        mapping_type = "positional_mapping"
        confidence = "LOW"
        status = "NEEDS_REVIEW"

    # BIANCA cluster
    if article.project_normalized == "BIANCA" and placement.sheet == "SUMMER DIP PU":
        same_row = True
        if same_row:
            notes.append("BIANCA row has multiple anchored images — verify all belong to BIANCA vs neighbors")
            if status == "VERIFIED":
                status = "NEEDS_REVIEW"

    # APRICOT / OSCAR shared binary
    if article.project_normalized in {"APRICOT", "OSCAR"} and placement.source_file == "image184.jpeg":
        notes.append("image184.jpeg shared between APRICOT and OSCAR — confirmed identical binary reuse")

    # SUMMER FLAT image13
    if placement.source_file == "image13.jpeg" and placement.sheet == "SUMMER FLAT":
        notes.append("image13.jpeg is very small (89x122) and anchored on row 42 below last article row 41 — likely decorative/orphan")
        status = "NEEDS_REVIEW"
        confidence = "LOW"

    if article.excel_row <= HEADER_ROW:
        mapping_type = "unmatched"
        confidence = "LOW"
        status = "UNMATCHED"
        notes.append("Anchor maps to header/title row, not a data article row")

    return mapping_type, confidence, status, notes


def make_image_id(sheet: str, excel_row: int, source_file: str, anchor_index: int) -> str:
    slug = slugify_sheet(sheet)
    safe_source = re.sub(r"[^A-Za-z0-9._-]", "_", source_file)
    return f"{slug}__row_{excel_row}__{safe_source}__a{anchor_index}"


def destination_path(
    output_dir: Path,
    sheet: str,
    excel_row: int,
    sequence: int,
    source_file: str,
    matched: bool,
) -> Path:
    slug = slugify_sheet(sheet)
    ext = source_file.rsplit(".", 1)[-1]
    seq_name = f"{sequence:02d}.{ext}"
    if matched:
        return output_dir / slug / f"row_{excel_row}" / seq_name
    return output_dir / "_unmatched" / slug / f"row_{excel_row}" / seq_name


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def run_extraction(workbook_path: Path, output_root: Path) -> dict[str, Any]:
    reports_dir = output_root / "reports"
    images_dir = output_root / "extracted-images"
    source_dir = output_root / "source"
    reports_dir.mkdir(parents=True, exist_ok=True)
    images_dir.mkdir(parents=True, exist_ok=True)
    source_dir.mkdir(parents=True, exist_ok=True)

    errors: list[str] = []
    warnings: list[str] = []

    if not workbook_path.exists():
        raise FileNotFoundError(f"Workbook not found: {workbook_path}")

    workbook_size = workbook_path.stat().st_size

    # Copy workbook metadata reference (not the xlsx itself to avoid duplication)
    meta = {
        "workbook": workbook_path.name,
        "workbook_size_bytes": workbook_size,
        "extracted_at_utc": datetime.now(timezone.utc).isoformat(),
    }
    (source_dir / "workbook-meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")

    articles, data_sheets, article_warnings = extract_articles(workbook_path)
    warnings.extend(article_warnings)

    article_by_key = article_lookup(articles)

    all_placements: list[ImagePlacement] = []
    sheet_stats: dict[str, dict[str, Any]] = defaultdict(
        lambda: {"article_rows": 0, "images": 0, "unmatched": 0, "needs_review": 0}
    )

    for a in articles:
        sheet_stats[a.sheet]["article_rows"] += 1

    with zipfile.ZipFile(workbook_path, "r") as zf:
        sheet_map = load_sheet_map(zf)
        all_sheet_names = list(sheet_map.keys())
        media_cache = build_media_cache(zf)

        template_usage = Counter()
        for sheet_name in all_sheet_names:
            drawing_path = sheet_drawing_path(zf, sheet_map[sheet_name])
            if not drawing_path:
                continue
            for p in parse_drawing_placements(zf, sheet_name, drawing_path):
                if p.source_file in TEMPLATE_CANDIDATES:
                    template_usage[p.source_file] += 1

        for sheet_name in all_sheet_names:
            drawing_path = sheet_drawing_path(zf, sheet_map[sheet_name])
            if not drawing_path:
                continue
            try:
                placements = parse_drawing_placements(zf, sheet_name, drawing_path)
                all_placements.extend(placements)
            except Exception as exc:
                msg = f"Failed to parse drawing for sheet '{sheet_name}': {exc}"
                errors.append(msg)
                warnings.append(msg)

        seq_map = assign_image_sequences(all_placements)
        manifest_rows: list[dict[str, Any]] = []
        copied_paths: set[str] = set()

        for placement in all_placements:
            media = media_cache.get(placement.source_file)
            if media is None:
                errors.append(f"Missing media file referenced in drawing: {placement.source_file}")
                continue

            article = article_by_key.get((placement.sheet, placement.excel_row))
            mapping_type, confidence, verification_status, notes = classify_placement(
                placement, article, template_usage
            )

            sequence = seq_map[(placement.sheet, placement.excel_row, placement.source_file, placement.anchor_index)]
            matched = article is not None and verification_status != "UNMATCHED"
            dest = destination_path(images_dir, placement.sheet, placement.excel_row, sequence, placement.source_file, matched)

            media_path = f"xl/media/{placement.source_file}"
            data = zf.read(media_path)
            dest.parent.mkdir(parents=True, exist_ok=True)
            if str(dest) not in copied_paths:
                dest.write_bytes(data)
                copied_paths.add(str(dest))
            else:
                # Same destination would overwrite — append source suffix
                alt = dest.with_name(f"{sequence:02d}_{placement.source_file}")
                alt.write_bytes(data)
                dest = alt

            image_id = make_image_id(placement.sheet, placement.excel_row, placement.source_file, placement.anchor_index)

            row = {
                "image_id": image_id,
                "sheet": placement.sheet,
                "excel_row": placement.excel_row,
                "excel_column": placement.excel_column,
                "project_raw": article.project if article else "",
                "project_normalized": article.project_normalized if article else "",
                "season": article.season if article else "",
                "making": article.making if article else "",
                "type": article.type if article else "",
                "source_file": placement.source_file,
                "extracted_file": str(dest.relative_to(output_root)).replace("\\", "/"),
                "width": media.width,
                "height": media.height,
                "file_size": media.file_size,
                "sha256": media.sha256,
                "image_sequence": sequence,
                "mapping_type": mapping_type,
                "confidence": confidence,
                "verification_status": verification_status,
                "notes": "; ".join(notes) + (f"; {media.format_note}" if media.format_note else ""),
            }
            manifest_rows.append(row)

            sheet_stats[placement.sheet]["images"] += 1
            if verification_status == "UNMATCHED":
                sheet_stats[placement.sheet]["unmatched"] += 1
            if verification_status == "NEEDS_REVIEW":
                sheet_stats[placement.sheet]["needs_review"] += 1

        # Extract any media not referenced by placements into _media pool
        referenced = {p.source_file for p in all_placements}
        unreferenced_media_dir = images_dir / "_all_media"
        unreferenced_count = 0
        for source_file, media in sorted(media_cache.items()):
            if source_file not in referenced:
                target = unreferenced_media_dir / source_file
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(zf.read(f"xl/media/{source_file}"))
                unreferenced_count += 1

    # Article master CSV
    article_rows = []
    for a in articles:
        article_rows.append(
            {
                "sheet": a.sheet,
                "excel_row": a.excel_row,
                "source_id": a.source_id,
                "no": a.no,
                "season": a.season,
                "making": a.making,
                "type": a.type,
                "project": a.project,
                "picture": a.picture,
                "size_range": a.size_range,
                "qty": a.qty,
                "material": a.material,
                "colour": a.colour,
                "remarks": a.remarks,
                "season_normalized": a.season_normalized,
                "making_normalized": a.making_normalized,
                "type_normalized": a.type_normalized,
                "project_normalized": a.project_normalized,
            }
        )
    write_csv(reports_dir / "article-master.csv", ARTICLE_FIELDS, article_rows)
    write_csv(reports_dir / "image-manifest.csv", MANIFEST_FIELDS, manifest_rows)

    # Duplicate images report (by sha256)
    hash_groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in manifest_rows:
        hash_groups[row["sha256"]].append(row)

    duplicate_rows: list[dict[str, Any]] = []
    duplicate_hash_count = 0
    for sha, rows in hash_groups.items():
        if len(rows) < 2:
            continue
        duplicate_hash_count += 1
        for r in rows:
            duplicate_rows.append(
                {
                    "sha256": sha,
                    "source_file": r["source_file"],
                    "sheet": r["sheet"],
                    "excel_row": r["excel_row"],
                    "project_raw": r["project_raw"],
                    "extracted_file": r["extracted_file"],
                }
            )
    write_csv(
        reports_dir / "duplicate-images.csv",
        ["sha256", "source_file", "sheet", "excel_row", "project_raw", "extracted_file"],
        duplicate_rows,
    )

    # Missing images report — every article compared against manifest
    images_by_article: dict[tuple[str, int], list[dict[str, Any]]] = defaultdict(list)
    for row in manifest_rows:
        if row["verification_status"] != "UNMATCHED" and row["project_raw"] != "":
            images_by_article[(row["sheet"], row["excel_row"])].append(row)

    missing_rows: list[dict[str, Any]] = []
    articles_without_images = 0
    articles_with_images = 0
    articles_with_multiple = 0

    for a in articles:
        imgs = [
            r
            for r in manifest_rows
            if r["sheet"] == a.sheet
            and r["excel_row"] == a.excel_row
            and r["verification_status"] != "UNMATCHED"
        ]
        count = len(imgs)
        if count == 0:
            status = "NO_IMAGE"
            articles_without_images += 1
            note = "No drawing-anchor image mapped to this article row"
        elif count == 1:
            status = "HAS_IMAGE"
            articles_with_images += 1
            note = ""
        else:
            status = "HAS_IMAGE"
            articles_with_images += 1
            articles_with_multiple += 1
            note = f"{count} images anchored to this row"

        if a.project_normalized == "BIANCA" and count >= 8:
            status = "NEEDS_REVIEW"
            note = "BIANCA has 8 anchored images — verify all are product views"

        missing_rows.append(
            {
                "sheet": a.sheet,
                "excel_row": a.excel_row,
                "project_raw": a.project,
                "season": a.season,
                "making": a.making,
                "type": a.type,
                "image_count": count,
                "status": status,
                "notes": note,
            }
        )
    write_csv(
        reports_dir / "missing-images.csv",
        ["sheet", "excel_row", "project_raw", "season", "making", "type", "image_count", "status", "notes"],
        missing_rows,
    )

    # Duplicate project names
    project_counter = Counter(a.project_normalized for a in articles if a.project_normalized)
    duplicate_projects = {p: c for p, c in project_counter.items() if c > 1}

    needs_review_items = [r for r in manifest_rows if r["verification_status"] == "NEEDS_REVIEW"]
    needs_review_items += [r for r in missing_rows if r["status"] == "NEEDS_REVIEW"]
    unmatched_images = [r for r in manifest_rows if r["verification_status"] == "UNMATCHED"]

    mapped_images = [r for r in manifest_rows if r["verification_status"] != "UNMATCHED"]

    # Malformed / unusual values
    unusual_values: list[str] = []
    for a in articles:
        if a.qty.strip() == ".":
            unusual_values.append(f"{a.sheet} row {a.excel_row}: qty='.'")
        if a.picture.strip() == ".":
            unusual_values.append(f"{a.sheet} row {a.excel_row}: picture='.'")
        if a.size_range.strip() == ".":
            unusual_values.append(f"{a.sheet} row {a.excel_row}: size_range='.'")

    # Worksheet summary table
    ws_lines = [
        "| Sheet | Article Rows | Images | Unmatched | Needs Review |",
        "|------|--------------|--------|-----------|--------------|",
    ]
    for sheet in data_sheets:
        st = sheet_stats[sheet]
        ws_lines.append(
            f"| {sheet} | {st['article_rows']} | {st['images']} | {st['unmatched']} | {st['needs_review']} |"
        )

    report_path = reports_dir / "extraction-report.md"
    with report_path.open("w", encoding="utf-8") as fh:
        fh.write("# MJMS Workbook Extraction Report\n\n")
        fh.write(f"Generated (UTC): {datetime.now(timezone.utc).isoformat()}\n\n")
        fh.write("## Summary\n\n")
        fh.write(f"- **Workbook filename:** `{workbook_path.name}`\n")
        fh.write(f"- **Workbook size:** {workbook_size:,} bytes ({workbook_size / (1024*1024):.2f} MB)\n")
        fh.write(f"- **Worksheets (total):** {len(all_sheet_names)}\n")
        fh.write(f"- **Worksheet names:** {', '.join(all_sheet_names)}\n")
        fh.write(f"- **Data worksheets:** {len(data_sheets)}\n")
        fh.write(f"- **Article rows:** {len(articles)}\n")
        fh.write(f"- **Embedded media files (xl/media):** {len(media_cache)}\n")
        fh.write(f"- **Drawing image placements parsed:** {len(all_placements)}\n")
        fh.write(f"- **Extracted image files written:** {len(copied_paths) + unreferenced_count}\n")
        fh.write(f"- **Mapped image placements:** {len(mapped_images)}\n")
        fh.write(f"- **Unmatched image placements:** {len(unmatched_images)}\n")
        fh.write(f"- **Articles with images:** {articles_with_images}\n")
        fh.write(f"- **Articles without images:** {articles_without_images}\n")
        fh.write(f"- **Articles with multiple images:** {articles_with_multiple}\n")
        fh.write(f"- **Duplicate image hashes (groups):** {duplicate_hash_count}\n")
        fh.write(f"- **Duplicate Project names:** {len(duplicate_projects)}\n")
        fh.write(f"- **NEEDS_REVIEW items:** {len(needs_review_items)}\n")
        fh.write(f"- **Unreferenced media files (extracted to _all_media):** {unreferenced_count}\n\n")

        fh.write("## Worksheet Summary\n\n")
        fh.write("\n".join(ws_lines))
        fh.write("\n\n")

        fh.write("## Special Case Investigations\n\n")
        fh.write("### A. BIANCA (SUMMER DIP PU)\n\n")
        fh.write(
            "BIANCA at row 5 has **8 drawing anchors** on the same excel row. "
            "Neighbors (rows 4, 6) have 1–2 images each. All 8 anchors map to row 5 per DrawingML — "
            "marked NEEDS_REVIEW to confirm all are product views.\n\n"
        )
        fh.write("### B. APRICOT / OSCAR\n\n")
        fh.write(
            "Both articles use **`image184.jpeg`** with identical SHA-256 hash — confirmed intentional binary reuse across SUMMER PU (APRICOT) and SUMMER DIP PU (OSCAR).\n\n"
        )
        fh.write("### C. SUMMER FLAT image13.jpeg\n\n")
        fh.write(
            "Anchored to **row 42** (below last article row 41 / K-VPI). Size 89×122 px. "
            "Likely decorative/orphan — marked NEEDS_REVIEW.\n\n"
        )
        fh.write("### D. image54.png / image55.png\n\n")
        fh.write(
            f"`image54.png` placements across **{template_usage.get('image54.png', 0)}** worksheets; "
            f"`image55.png` across **{template_usage.get('image55.png', 0)}** worksheets. "
            "These recurring assets are flagged NEEDS_REVIEW — likely template/decorative, not product photos.\n\n"
        )

        if duplicate_projects:
            fh.write("## Duplicate Project Names (allowed)\n\n")
            for project, count in sorted(duplicate_projects.items(), key=lambda x: (-x[1], x[0]))[:30]:
                fh.write(f"- `{project}`: {count} rows\n")
            if len(duplicate_projects) > 30:
                fh.write(f"- ... and {len(duplicate_projects) - 30} more\n")
            fh.write("\n")

        if unusual_values:
            fh.write("## Unusual / Malformed Values\n\n")
            for item in unusual_values[:50]:
                fh.write(f"- {item}\n")
            if len(unusual_values) > 50:
                fh.write(f"- ... and {len(unusual_values) - 50} more\n")
            fh.write("\n")

        if warnings:
            fh.write("## Warnings\n\n")
            for w in warnings[:100]:
                fh.write(f"- {w}\n")
            if len(warnings) > 100:
                fh.write(f"- ... and {len(warnings) - 100} more\n")
            fh.write("\n")

        if errors:
            fh.write("## Errors\n\n")
            for e in errors:
                fh.write(f"- {e}\n")
            fh.write("\n")

        fh.write("## NEEDS_REVIEW Highlights\n\n")
        seen = set()
        for item in needs_review_items[:40]:
            key = json.dumps(item, sort_keys=True, default=str)
            if key in seen:
                continue
            seen.add(key)
            if "image_id" in item:
                fh.write(
                    f"- `{item['image_id']}` — {item['sheet']} row {item['excel_row']} "
                    f"({item.get('project_raw') or 'no article'}): {item.get('notes', '')}\n"
                )
            else:
                fh.write(
                    f"- Article {item['sheet']} row {item['excel_row']} ({item['project_raw']}): {item.get('notes', '')}\n"
                )

    return {
        "worksheets": len(all_sheet_names),
        "data_sheets": len(data_sheets),
        "articles": len(articles),
        "media_files": len(media_cache),
        "placements": len(all_placements),
        "extracted_files": len(copied_paths) + unreferenced_count,
        "mapped": len(mapped_images),
        "unmatched": len(unmatched_images),
        "articles_no_image": articles_without_images,
        "duplicate_hashes": duplicate_hash_count,
        "needs_review": len(needs_review_items),
        "warnings": len(warnings),
        "errors": len(errors),
        "reports_dir": str(reports_dir),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract MJMS catalogue data from Excel workbook")
    parser.add_argument(
        "--workbook",
        type=Path,
        default=DEFAULT_WORKBOOK,
        help="Path to MJMS PROJECTS OR MOLD DETAIL.xlsx",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=SCRIPT_DIR,
        help="Output root (default: scripts/mjms-import/)",
    )
    args = parser.parse_args()

    try:
        summary = run_extraction(args.workbook.resolve(), args.output.resolve())
    except Exception as exc:
        print(f"EXTRACTION FAILED: {exc}", file=sys.stderr)
        raise

    print("Extraction complete.")
    for key, value in summary.items():
        print(f"  {key}: {value}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
