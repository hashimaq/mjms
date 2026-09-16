#!/usr/bin/env python3
"""Generate static visual-review HTML from existing extraction outputs (read-only)."""

from __future__ import annotations

import csv
import html
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
REPORTS_DIR = SCRIPT_DIR / "reports"
MANIFEST_PATH = REPORTS_DIR / "image-manifest.csv"
ARTICLE_PATH = REPORTS_DIR / "article-master.csv"
OUTPUT_DIR = REPORTS_DIR / "visual-review"
IMG_PREFIX = "../../extracted-images"

TEMPLATE_ASSETS = {"image54.png", "image55.png"}


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as fh:
        return list(csv.DictReader(fh))


def short_sha(value: str) -> str:
    return value[:16] + "…" if value else ""


def img_src(extracted_file: str) -> str:
    rel = extracted_file.replace("extracted-images/", "")
    return f"{IMG_PREFIX}/{rel}"


def css() -> str:
    return """
    :root {
      --bg: #f4f6f8;
      --card: #ffffff;
      --border: #d8dee6;
      --text: #1f2937;
      --muted: #6b7280;
      --accent: #1d4ed8;
      --warn: #b45309;
      --bad: #b91c1c;
      --ok: #047857;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", Tahoma, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.45;
    }
    header.page-header {
      background: #111827;
      color: #fff;
      padding: 1.5rem 2rem;
    }
    header.page-header h1 { margin: 0 0 .5rem; font-size: 1.6rem; }
    header.page-header p { margin: .2rem 0; color: #d1d5db; }
    nav.top-nav {
      background: #1f2937;
      padding: .65rem 2rem;
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    nav.top-nav a { color: #93c5fd; text-decoration: none; font-size: .92rem; }
    nav.top-nav a:hover { text-decoration: underline; }
    main { padding: 1.5rem 2rem 3rem; max-width: 1400px; margin: 0 auto; }
    section { margin-bottom: 2.5rem; }
    section > h2 {
      font-size: 1.25rem;
      border-bottom: 2px solid var(--border);
      padding-bottom: .35rem;
      margin: 0 0 1rem;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: .75rem;
      margin-bottom: 1.25rem;
    }
    .meta-item {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: .75rem 1rem;
    }
    .meta-item .label { font-size: .75rem; text-transform: uppercase; color: var(--muted); }
    .meta-item .value { font-weight: 600; margin-top: .15rem; word-break: break-word; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
    }
    .compare-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1rem;
    }
    .article-block {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1rem;
    }
    .article-block.highlight { border-color: var(--accent); box-shadow: 0 0 0 2px #bfdbfe; }
    .article-block h3 { margin: 0 0 .75rem; font-size: 1.05rem; }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .card.flagged { border-color: #f59e0b; }
    .card.unmatched { border-color: #fca5a5; }
    .card.template { border-color: #c4b5fd; }
    .card-image {
      background: #eef2f7;
      min-height: 220px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: .75rem;
    }
    .card-image img {
      max-width: 100%;
      max-height: 320px;
      object-fit: contain;
      border: 1px solid #cbd5e1;
      background: #fff;
    }
    .card-body { padding: .85rem 1rem 1rem; font-size: .88rem; }
    .card-body h3 { margin: 0 0 .5rem; font-size: .98rem; }
    .section-label {
      font-size: .72rem;
      letter-spacing: .04em;
      text-transform: uppercase;
      color: var(--muted);
      margin: .65rem 0 .2rem;
      font-weight: 700;
    }
    .section-label:first-child { margin-top: 0; }
    .kv { margin: .1rem 0; word-break: break-word; }
    .badge {
      display: inline-block;
      padding: .12rem .45rem;
      border-radius: 999px;
      font-size: .72rem;
      font-weight: 700;
      margin-right: .35rem;
    }
    .badge.review { background: #fef3c7; color: var(--warn); }
    .badge.unmatched { background: #fee2e2; color: var(--bad); }
    .badge.verified { background: #d1fae5; color: var(--ok); }
    .badge.template { background: #ede9fe; color: #5b21b6; }
    table.simple {
      width: 100%;
      border-collapse: collapse;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      font-size: .86rem;
    }
    table.simple th, table.simple td {
      border-bottom: 1px solid var(--border);
      padding: .55rem .65rem;
      text-align: left;
      vertical-align: top;
    }
    table.simple th { background: #f8fafc; }
    .note { color: var(--muted); font-size: .9rem; }
    .thumb-row { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .5rem; }
    .thumb-row img {
      width: 96px;
      height: 96px;
      object-fit: contain;
      border: 1px solid var(--border);
      background: #fff;
      padding: 2px;
    }
    """


def nav_html(active: str) -> str:
    links = [
        ("index", "README.md", "Overview"),
        ("bianca", "bianca-review.html", "BIANCA"),
        ("degenerate", "degenerate-anchor-review.html", "Degenerate Anchors"),
        ("unmatched", "unmatched-review.html", "Unmatched"),
        ("template", "template-assets-review.html", "Template Assets"),
    ]
    parts = []
    for key, href, label in links:
        if key == active:
            parts.append(f"<strong>{html.escape(label)}</strong>")
        else:
            parts.append(f'<a href="{href}">{html.escape(label)}</a>')
    return f'<nav class="top-nav">{" | ".join(parts)}</nav>'


def page_shell(title: str, subtitle: str, active: str, body: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{html.escape(title)}</title>
  <style>{css()}</style>
</head>
<body>
  <header class="page-header">
    <h1>{html.escape(title)}</h1>
    <p>{html.escape(subtitle)}</p>
  </header>
  {nav_html(active)}
  <main>
    {body}
  </main>
</body>
</html>
"""


def card(row: dict[str, str], *, flagged: bool = False, unmatched: bool = False, template: bool = False, title: str | None = None) -> str:
    classes = ["card"]
    if flagged:
        classes.append("flagged")
    if unmatched:
        classes.append("unmatched")
    if template:
        classes.append("template")

    status = row.get("verification_status") or row.get("status") or ""
    badge_class = "review" if status == "NEEDS_REVIEW" else "unmatched" if status == "UNMATCHED" else "verified"
    if template:
        badge_class = "template"

    src = img_src(row["extracted_file"])
    heading = title or row.get("source_file", "Image")
    notes = row.get("notes", "")

    return f"""
    <article class="{' '.join(classes)}">
      <div class="card-image">
        <img src="{html.escape(src)}" alt="{html.escape(row.get('source_file', ''))}" loading="lazy">
      </div>
      <div class="card-body">
        <h3>{html.escape(heading)}</h3>
        <span class="badge {badge_class}">{html.escape(status or 'INFO')}</span>
        <div class="section-label">Article</div>
        <div class="kv"><strong>Project:</strong> {html.escape(row.get('project_raw') or '—')}</div>
        <div class="kv"><strong>Sheet:</strong> {html.escape(row.get('sheet') or '—')}</div>
        <div class="kv"><strong>Excel row:</strong> {html.escape(str(row.get('excel_row') or '—'))}</div>
        <div class="section-label">Image</div>
        <div class="kv"><strong>Sequence:</strong> {html.escape(str(row.get('image_sequence') or '—'))}</div>
        <div class="kv"><strong>Dimensions:</strong> {html.escape(row.get('width') or '?')} × {html.escape(row.get('height') or '?')} px</div>
        <div class="section-label">Source</div>
        <div class="kv"><strong>Filename:</strong> {html.escape(row.get('source_file') or '—')}</div>
        <div class="kv"><strong>Image ID:</strong> {html.escape(row.get('image_id') or '—')}</div>
        <div class="kv"><strong>Extracted:</strong> {html.escape(row.get('extracted_file') or '—')}</div>
        <div class="kv"><strong>SHA-256:</strong> <code>{html.escape(short_sha(row.get('sha256', '')))}</code></div>
        <div class="section-label">Mapping</div>
        <div class="kv"><strong>Type:</strong> {html.escape(row.get('mapping_type') or '—')}</div>
        <div class="kv"><strong>Confidence:</strong> {html.escape(row.get('confidence') or '—')}</div>
        <div class="section-label">Notes</div>
        <div class="kv">{html.escape(notes) if notes else '—'}</div>
      </div>
    </article>
    """


def article_block(sheet: str, excel_row: int, project: str, images: list[dict[str, str]], highlight: bool = False) -> str:
    cls = "article-block highlight" if highlight else "article-block"
    if not images:
        imgs_html = '<p class="note">No mapped images on this row.</p>'
    else:
        imgs_html = '<div class="grid">' + "".join(card(r) for r in images) + "</div>"
    return f"""
    <div class="{cls}">
      <h3>Row {excel_row} — {html.escape(project)}</h3>
      <p class="note">Sheet: {html.escape(sheet)} · {len(images)} image(s)</p>
      {imgs_html}
    </div>
    """


def filter_manifest(manifest: list[dict[str, str]], **criteria) -> list[dict[str, str]]:
    result = manifest
    for key, value in criteria.items():
        if isinstance(value, tuple):
            result = [r for r in result if r.get(key) in value]
        else:
            result = [r for r in result if r.get(key) == str(value)]
    return result


def sort_by_sequence(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    return sorted(rows, key=lambda r: int(r.get("image_sequence") or 0))


def build_bianca(manifest: list[dict[str, str]]) -> str:
    bianca = sort_by_sequence(filter_manifest(manifest, sheet="SUMMER DIP PU", excel_row="5"))
    buffy = sort_by_sequence(filter_manifest(manifest, sheet="SUMMER DIP PU", excel_row="4"))
    belta = sort_by_sequence(filter_manifest(manifest, sheet="SUMMER DIP PU", excel_row="6"))

    body = f"""
    <section>
      <div class="meta-grid">
        <div class="meta-item"><div class="label">Sheet</div><div class="value">SUMMER DIP PU</div></div>
        <div class="meta-item"><div class="label">Excel Row</div><div class="value">5</div></div>
        <div class="meta-item"><div class="label">Project</div><div class="value">BIANCA</div></div>
        <div class="meta-item"><div class="label">Image Count</div><div class="value">{len(bianca)}</div></div>
      </div>
      <p class="note">All 8 images are anchored to Excel row 5 via DrawingML. Compare visually with neighboring rows 4 (BUFFY) and 6 (BELTA) before confirming ownership.</p>
    </section>
    <section>
      <h2>BIANCA — 8 Flagged Placements (Row 5)</h2>
      <div class="grid">{''.join(card(r, flagged=True, title=f"#{r['image_sequence']} {r['source_file']}") for r in bianca)}</div>
    </section>
    <section>
      <h2>Neighboring Articles — Visual Comparison</h2>
      <div class="compare-row">
        {article_block('SUMMER DIP PU', 4, 'BUFFY (previous row)', buffy)}
        {article_block('SUMMER DIP PU', 5, 'BIANCA (flagged row)', bianca, highlight=True)}
        {article_block('SUMMER DIP PU', 6, 'BELTA (next row)', belta)}
      </div>
    </section>
    """
    return page_shell(
        "BIANCA Image Mapping Review",
        "Visual inspection of 8 anchored images on SUMMER DIP PU row 5",
        "bianca",
        body,
    )


def build_degenerate(manifest: list[dict[str, str]]) -> str:
    cases = [
        ("LUNA", "WINTER HEEL", "28", "image14.jpeg"),
        ("SELENE", "WINTER HEEL", "29", "image13.jpeg"),
        ("STAR", "SUMMER HEEL", "19", "image101.png"),
    ]
    sections = []
    for name, sheet, row, source in cases:
        flagged = [r for r in manifest if r["sheet"] == sheet and r["excel_row"] == row and r["source_file"] == source][0]
        neighbors = sort_by_sequence([r for r in manifest if r["sheet"] == sheet and r["excel_row"] == row and r["source_file"] != source])
        nearby_rows = []
        for nr in (str(int(row) - 1), str(int(row) + 1)):
            nearby = sort_by_sequence([r for r in manifest if r["sheet"] == sheet and r["excel_row"] == nr and r["verification_status"] == "VERIFIED"])
            if nearby:
                nearby_rows.append((nr, nearby))
        nearby_html = ""
        for nr, imgs in nearby_rows:
            nearby_html += f"<h3>Nearby row {nr}</h3><div class='grid'>{''.join(card(r) for r in imgs)}</div>"

        sections.append(f"""
        <section>
          <h2>{html.escape(name)} — {html.escape(sheet)} row {html.escape(row)}</h2>
          <div class="grid">{card(flagged, flagged=True, title=f"Flagged: {source}")}</div>
          <h3>Other images on same row</h3>
          <div class="grid">{''.join(card(r) for r in neighbors) if neighbors else '<p class="note">No other mapped images on this row.</p>'}</div>
          {nearby_html}
        </section>
        """)

    body = "<p class='note'>Degenerate anchors have DrawingML extent width or height of 0. Mapping unchanged — visual review only.</p>" + "".join(sections)
    return page_shell(
        "Degenerate Anchor Review",
        "Luna, Selene, and Star flagged image placements",
        "degenerate",
        body,
    )


def build_unmatched(manifest: list[dict[str, str]]) -> str:
    unmatched = [r for r in manifest if r["verification_status"] == "UNMATCHED"]
    meaningful = [r for r in unmatched if r["source_file"] not in TEMPLATE_ASSETS]
    template = [r for r in unmatched if r["source_file"] in TEMPLATE_ASSETS]

    primary = [r for r in meaningful if r["source_file"] == "image13.jpeg" and r["sheet"] == "SUMMER FLAT"]
    other = [r for r in meaningful if r not in primary]

    body = f"""
    <section>
      <h2>Primary Focus — SUMMER FLAT image13.jpeg (Row 42)</h2>
      <p class="note">Anchored below the last article row (41 / K-VPI). Very small ({primary[0]['width']}×{primary[0]['height']} px). Same binary hash as Selene's flagged image13 on WINTER HEEL row 29.</p>
      <div class="grid">{''.join(card(r, unmatched=True) for r in primary)}</div>
    </section>
    <section>
      <h2>Other Meaningful Unmatched Placements</h2>
      <p class="note">Navigation / summary sheet decorative shapes — not product catalogue rows.</p>
      <div class="grid">{''.join(card(r, unmatched=True) for r in other)}</div>
    </section>
    <section>
      <h2>Recurring Template Candidates (image54 / image55)</h2>
      <p class="note">{len(template)} unmatched placements use image54.png or image55.png. See <a href="template-assets-review.html">template-assets-review.html</a> for full analysis. Do not treat as product images.</p>
      <table class="simple">
        <thead><tr><th>Source</th><th>Sheet</th><th>Row</th><th>Notes</th></tr></thead>
        <tbody>
          {''.join(f"<tr><td>{html.escape(r['source_file'])}</td><td>{html.escape(r['sheet'])}</td><td>{html.escape(r['excel_row'])}</td><td>{html.escape(r['notes'])}</td></tr>" for r in template[:12])}
        </tbody>
      </table>
      {f'<p class="note">Showing 12 of {len(template)} template-candidate placements.</p>' if len(template) > 12 else ''}
    </section>
    """
    return page_shell(
        "Unmatched Image Review",
        "Orphan and non-article image placements",
        "unmatched",
        body,
    )


def build_template(manifest: list[dict[str, str]]) -> str:
    rows54 = [r for r in manifest if r["source_file"] == "image54.png"]
    rows55 = [r for r in manifest if r["source_file"] == "image55.png"]

    def sample(rows: list[dict[str, str]], n: int = 3) -> list[dict[str, str]]:
        seen_sheets = set()
        picked = []
        for r in rows:
            if r["sheet"] in seen_sheets:
                continue
            seen_sheets.add(r["sheet"])
            picked.append(r)
            if len(picked) >= n:
                break
        return picked

    sample54 = sample(rows54)
    sample55 = sample(rows55)
    rep = sample54[0] if sample54 else rows54[0]

    body = f"""
    <section>
      <h2>Why These May Be Template / Decorative Assets</h2>
      <ul>
        <li>Identical binary reused across <strong>{len({r['sheet'] for r in rows54})}</strong> worksheets (image54.png) and <strong>{len({r['sheet'] for r in rows55})}</strong> worksheets (image55.png).</li>
        <li>Usually anchored on rows <em>beyond</em> the last article row — no matching article in article-master.csv.</li>
        <li>Often appear as a pair (image54 + image55) on the same sheet near sheet footer.</li>
        <li>Marked UNMATCHED in extraction — not imported as product images.</li>
      </ul>
    </section>
    <section>
      <h2>image54.png — Representative Examples</h2>
      <p class="note">Occurrences: {len(rows54)} · Dimensions: {rep['width']}×{rep['height']} px · SHA-256: <code>{html.escape(short_sha(rep['sha256']))}</code></p>
      <div class="grid">{''.join(card(r, template=True, title=f"{r['sheet']} row {r['excel_row']}") for r in sample54)}</div>
      <table class="simple">
        <thead><tr><th>Sheet</th><th>Excel Row</th><th>Extracted Path</th></tr></thead>
        <tbody>{''.join(f"<tr><td>{html.escape(r['sheet'])}</td><td>{html.escape(r['excel_row'])}</td><td>{html.escape(r['extracted_file'])}</td></tr>" for r in rows54)}</tbody>
      </table>
    </section>
    <section>
      <h2>image55.png — Representative Examples</h2>
      <p class="note">Occurrences: {len(rows55)} · Dimensions: {sample55[0]['width']}×{sample55[0]['height']} px</p>
      <div class="grid">{''.join(card(r, template=True, title=f"{r['sheet']} row {r['excel_row']}") for r in sample55)}</div>
      <table class="simple">
        <thead><tr><th>Sheet</th><th>Excel Row</th><th>Extracted Path</th></tr></thead>
        <tbody>{''.join(f"<tr><td>{html.escape(r['sheet'])}</td><td>{html.escape(r['excel_row'])}</td><td>{html.escape(r['extracted_file'])}</td></tr>" for r in rows55)}</tbody>
      </table>
    </section>
    """
    return page_shell(
        "Template Asset Review",
        "Recurring image54.png and image55.png placements",
        "template",
        body,
    )


def build_readme(manifest: list[dict[str, str]]) -> str:
    return """# MJMS Visual Review Package

Static HTML contact sheets for manual inspection of flagged image mappings from the Excel extraction audit.

**No mappings were changed during this phase.**

## Open in Browser

Open any HTML file directly (no web server required):

| File | Purpose |
|------|---------|
| [bianca-review.html](bianca-review.html) | 8 BIANCA images + neighbors BUFFY / BELTA |
| [degenerate-anchor-review.html](degenerate-anchor-review.html) | Luna, Selene, Star degenerate anchors |
| [unmatched-review.html](unmatched-review.html) | SUMMER FLAT image13 + other unmatched |
| [template-assets-review.html](template-assets-review.html) | image54.png / image55.png recurrence |

Image paths are relative: `../../extracted-images/...`

---

## BIANCA

**8 images require manual confirmation.**

Sheet: SUMMER DIP PU · Row: 5 · Project: BIANCA

Images: image241.jpeg, image242.jpeg, image187.jpeg, image188.jpeg, image189.jpeg, image243.jpeg, image191.jpeg, image244.jpeg

All 8 anchors map to row 5 per DrawingML. Neighbors row 4 (BUFFY) has 1 image; row 6 (BELTA) has 2 images. Visually compare sole types before accepting all 8 as BIANCA product views.

---

## Degenerate Anchors

| Article | Sheet | Row | Source File |
|---------|-------|-----|-------------|
| Luna | WINTER HEEL | 28 | image14.jpeg |
| Selene | WINTER HEEL | 29 | image13.jpeg |
| Star | SUMMER HEEL | 19 | image101.png |

DrawingML reports 0 width or height on anchor extent. Luna/Selene also have verified images on the same row. Star has image101.png (large) flagged alongside verified image105.jpeg.

---

## Unmatched

- **SUMMER FLAT image13.jpeg** — row 42, below last article (K-VPI row 41). 89×122 px orphan.
- **SUMMARY / WINTER & SUMMER** — 128×128 navigation button textures (shape-with-image).
- **image54 / image55** — 18 recurring template placements (see template page).

---

## Template Assets

- **image54.png** — 9 worksheet occurrences, identical SHA-256, usually past last article row.
- **image55.png** — 8 worksheet occurrences, paired with image54 on many sheets.

Do not import as product images unless manually confirmed otherwise.

---

## Important Rule

**No mapping has been changed during this phase.**

---

## Issues for Manual Decision

### 1. BIANCA — 8 images on one row

- **Issue:** Unusually high image count on single row
- **Affected article:** SUMMER DIP PU row 5 / BIANCA
- **Current mapping:** All 8 anchored to row 5 (NEEDS_REVIEW)
- **Reason for concern:** Neighbors have 1–2 images; some sole views may belong to adjacent rows visually
- **Recommended decision:** Compare all 8 against BUFFY/BELTA images; confirm or reassign per view

### 2. Star — degenerate anchor on large image

- **Issue:** image101.png (560×353 px) flagged degenerate but mapped to Star
- **Affected article:** SUMMER HEEL row 19 / Star
- **Current mapping:** NEEDS_REVIEW on image101; image105.jpeg VERIFIED on same row
- **Reason for concern:** Large PNG may be primary product photo despite anchor metadata; verify which image represents Star
- **Recommended decision:** Confirm whether image101 or image105 is the intended catalogue photo

### 3. Selene / SUMMER FLAT — shared image13 binary

- **Issue:** Same SHA-256 for image13.jpeg on WINTER HEEL row 29 (Selene) and SUMMER FLAT row 42 (unmatched)
- **Affected articles:** Selene + orphan SUMMER FLAT placement
- **Current mapping:** Selene NEEDS_REVIEW; SUMMER FLAT UNMATCHED
- **Reason for concern:** Tiny 89×122 asset may be decorative icon, not product photo
- **Recommended decision:** Exclude from product catalogue unless confirmed as intentional product thumbnail

### 4. image54 / image55 — recurring footer assets

- **Issue:** Same binaries on 9+ sheets below data rows
- **Affected article:** None (UNMATCHED)
- **Current mapping:** Not mapped to products
- **Reason for concern:** Could be misread as product if imported blindly
- **Recommended decision:** Exclude from product import; treat as workbook template/decorative

### 5. APRICOT / OSCAR — shared image184 (informational)

- **Issue:** Same binary used across two products (not in visual-review scope but noted in extraction)
- **Recommended decision:** Confirm intentional cross-reference reuse is acceptable for catalogue
"""


def verify_paths(manifest_rows: list[dict[str, str]], used_files: set[str]) -> tuple[list[str], list[str]]:
    missing = []
    broken = []
    base = SCRIPT_DIR
    for row in manifest_rows:
        extracted = row.get("extracted_file", "")
        if extracted not in used_files:
            continue
        path = base / extracted.replace("/", "\\")
        if not path.exists():
            missing.append(extracted)
            broken.append(extracted)
    return missing, broken


def main() -> None:
    manifest = load_csv(MANIFEST_PATH)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    pages = {
        "bianca-review.html": build_bianca(manifest),
        "degenerate-anchor-review.html": build_degenerate(manifest),
        "unmatched-review.html": build_unmatched(manifest),
        "template-assets-review.html": build_template(manifest),
        "README.md": build_readme(manifest),
    }

    used_extracted: set[str] = set()
    for content in pages.values():
        if isinstance(content, str):
            for row in manifest:
                ef = row["extracted_file"]
                if ef in content:
                    used_extracted.add(ef)

    for name, content in pages.items():
        (OUTPUT_DIR / name).write_text(content, encoding="utf-8")

    # Explicit verification of all referenced images in HTML
    missing = []
    displayed = 0
    for name in ["bianca-review.html", "degenerate-anchor-review.html", "unmatched-review.html", "template-assets-review.html"]:
        text = (OUTPUT_DIR / name).read_text(encoding="utf-8")
        displayed += text.count("<img ")
        for row in manifest:
            src = img_src(row["extracted_file"])
            if src in text:
                path = SCRIPT_DIR / row["extracted_file"].replace("/", "\\")
                if not path.exists():
                    missing.append(row["extracted_file"])

    print("Visual review package generated.")
    print(f"  Output: {OUTPUT_DIR}")
    print(f"  Files: {', '.join(pages.keys())}")
    print(f"  Images displayed (img tags): {displayed}")
    print(f"  Missing extracted files: {len(missing)}")
    if missing:
        for m in missing:
            print(f"    - {m}")
    else:
        print("  All referenced extracted files exist.")


if __name__ == "__main__":
    main()
