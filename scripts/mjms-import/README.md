# MJMS Excel Import / Extraction Utility

Isolated, non-destructive extraction of article data and embedded product images from `MJMS PROJECTS OR MOLD DETAIL.xlsx`.

**This utility does not connect to Supabase, modify the web application, or alter the source workbook.**

## Requirements

- Python 3.10+
- Dependencies in `requirements.txt`

```bash
pip install -r requirements.txt
```

## Usage

From the repository root:

```bash
python scripts/mjms-import/extract.py
```

Optional arguments:

```bash
python scripts/mjms-import/extract.py \
  --workbook "MJMS PROJECTS OR MOLD DETAIL.xlsx" \
  --output scripts/mjms-import
```

## Methodology

### Article extraction

- Reads worksheets whose row 2 headers match: `NO`, `Season`, `MAKING`, `TYPE`, `Project`, `Picture`, ...
- Data rows start at Excel row 3.
- Stable identity: `sheet + excel_row` (`source_id` column).
- Raw cell values preserved; normalized columns added separately.

### Image mapping (primary method)

Images are **not** mapped via the Picture column. Instead:

1. Open XLSX as ZIP
2. Resolve worksheet → drawing relationships (`xl/worksheets/_rels/`)
3. Parse drawing XML anchors (`twoCellAnchor`, `oneCellAnchor`)
4. Map `from.row` (0-based) → Excel row (`row + 1`)
5. Match to article master by `(sheet, excel_row)`

### Output layout

```
scripts/mjms-import/
├── extract.py
├── normalize.py
├── requirements.txt
├── README.md
├── extracted-images/
│   ├── {SHEET_SLUG}/row_{N}/01.jpeg
│   ├── _unmatched/...
│   └── _all_media/          # media not referenced by any drawing
├── reports/
│   ├── article-master.csv
│   ├── image-manifest.csv
│   ├── duplicate-images.csv
│   ├── missing-images.csv
│   └── extraction-report.md
└── source/
    └── workbook-meta.json
```

## Reports

| File | Purpose |
|------|---------|
| `article-master.csv` | All product/article rows with raw + normalized fields |
| `image-manifest.csv` | Every drawing anchor placement with mapping metadata |
| `duplicate-images.csv` | SHA-256 duplicate binary analysis (no deletions) |
| `missing-images.csv` | Every article compared against mapped images |
| `extraction-report.md` | Summary statistics, warnings, special-case notes |

## Re-running

The extraction is deterministic: repeated runs produce the same folder structure, IDs, and mappings (assuming the workbook is unchanged).
