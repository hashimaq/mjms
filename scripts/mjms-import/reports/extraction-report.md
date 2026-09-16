# MJMS Workbook Extraction Report

Generated (UTC): 2026-09-10T06:27:01.870237+00:00

## Summary

- **Workbook filename:** `MJMS PROJECTS OR MOLD DETAIL.xlsx`
- **Workbook size:** 63,290,791 bytes (60.36 MB)
- **Worksheets (total):** 16
- **Worksheet names:** SUMMARY, WINTER & SUMMER, WINTER, WINTER DIP (PU & PVC), WINTER HEEL, WINTER FLAT, WINTER PU, WINTER DIP PU, WINTER DIP PVC, SUMMER, SUMMER DIP (PU & PVC), SUMMER HEEL, SUMMER FLAT, SUMMER PU, SUMMER DIP PU, SUMMER DIP PVC
- **Data worksheets:** 10
- **Article rows:** 252
- **Embedded media files (xl/media):** 305
- **Drawing image placements parsed:** 289
- **Extracted image files written:** 341
- **Mapped image placements:** 268
- **Unmatched image placements:** 21
- **Articles with images:** 236
- **Articles without images:** 16
- **Articles with multiple images:** 25
- **Duplicate image hashes (groups):** 22
- **Duplicate Project names:** 20
- **NEEDS_REVIEW items:** 12
- **Unreferenced media files (extracted to _all_media):** 52

## Worksheet Summary

| Sheet | Article Rows | Images | Unmatched | Needs Review |
|------|--------------|--------|-----------|--------------|
| WINTER HEEL | 28 | 30 | 0 | 2 |
| WINTER FLAT | 26 | 28 | 2 | 0 |
| WINTER PU | 4 | 6 | 2 | 0 |
| WINTER DIP PU | 7 | 9 | 2 | 0 |
| WINTER DIP PVC | 26 | 30 | 2 | 0 |
| SUMMER HEEL | 36 | 37 | 2 | 1 |
| SUMMER FLAT | 39 | 39 | 2 | 0 |
| SUMMER PU | 61 | 66 | 2 | 0 |
| SUMMER DIP PU | 18 | 30 | 2 | 8 |
| SUMMER DIP PVC | 7 | 11 | 2 | 0 |

## Special Case Investigations

### A. BIANCA (SUMMER DIP PU)

BIANCA at row 5 has **8 drawing anchors** on the same excel row. Neighbors (rows 4, 6) have 1–2 images each. All 8 anchors map to row 5 per DrawingML — marked NEEDS_REVIEW to confirm all are product views.

### B. APRICOT / OSCAR

Both articles use **`image184.jpeg`** with identical SHA-256 hash — confirmed intentional binary reuse across SUMMER PU (APRICOT) and SUMMER DIP PU (OSCAR).

### C. SUMMER FLAT image13.jpeg

Anchored to **row 42** (below last article row 41 / K-VPI). Size 89×122 px. Likely decorative/orphan — marked NEEDS_REVIEW.

### D. image54.png / image55.png

`image54.png` placements across **9** worksheets; `image55.png` across **8** worksheets. These recurring assets are flagged NEEDS_REVIEW — likely template/decorative, not product photos.

## Duplicate Project Names (allowed)

- `RIVER`: 3 rows
- `7026`: 2 rows
- `7029`: 2 rows
- `BREEZE`: 2 rows
- `BRIGHT`: 2 rows
- `BUFFY`: 2 rows
- `C-HEIGHT`: 2 rows
- `CARA`: 2 rows
- `COSMO`: 2 rows
- `KELLY`: 2 rows
- `KIZA`: 2 rows
- `LIA-WEDGE`: 2 rows
- `MM2`: 2 rows
- `NOVA`: 2 rows
- `ORION`: 2 rows
- `RAVI`: 2 rows
- `REEF`: 2 rows
- `ROZY`: 2 rows
- `SLIP (40179)`: 2 rows
- `ZEETA PAINT`: 2 rows

## Unusual / Malformed Values

- WINTER HEEL row 3: qty='.'
- WINTER HEEL row 3: picture='.'
- WINTER HEEL row 4: qty='.'
- WINTER HEEL row 4: picture='.'
- WINTER HEEL row 5: qty='.'
- WINTER HEEL row 5: picture='.'
- WINTER HEEL row 6: qty='.'
- WINTER HEEL row 6: picture='.'
- WINTER HEEL row 7: qty='.'
- WINTER HEEL row 7: picture='.'
- WINTER HEEL row 8: qty='.'
- WINTER HEEL row 8: picture='.'
- WINTER HEEL row 9: qty='.'
- WINTER HEEL row 9: picture='.'
- WINTER HEEL row 10: qty='.'
- WINTER HEEL row 10: picture='.'
- WINTER HEEL row 11: qty='.'
- WINTER HEEL row 11: picture='.'
- WINTER HEEL row 12: qty='.'
- WINTER HEEL row 12: picture='.'
- WINTER HEEL row 13: qty='.'
- WINTER HEEL row 13: picture='.'
- WINTER HEEL row 14: qty='.'
- WINTER HEEL row 14: picture='.'
- WINTER HEEL row 15: qty='.'
- WINTER HEEL row 15: picture='.'
- WINTER HEEL row 16: qty='.'
- WINTER HEEL row 17: qty='.'
- WINTER HEEL row 17: picture='.'
- WINTER HEEL row 18: qty='.'
- WINTER HEEL row 18: picture='.'
- WINTER HEEL row 19: qty='.'
- WINTER HEEL row 19: picture='.'
- WINTER HEEL row 20: qty='.'
- WINTER HEEL row 20: picture='.'
- WINTER HEEL row 23: qty='.'
- WINTER HEEL row 23: picture='.'
- WINTER HEEL row 24: qty='.'
- WINTER HEEL row 24: picture='.'
- WINTER HEEL row 25: qty='.'
- WINTER HEEL row 25: picture='.'
- WINTER HEEL row 26: qty='.'
- WINTER HEEL row 26: picture='.'
- WINTER HEEL row 27: qty='.'
- WINTER HEEL row 27: picture='.'
- WINTER HEEL row 28: qty='.'
- WINTER HEEL row 28: picture='.'
- WINTER HEEL row 29: qty='.'
- WINTER HEEL row 29: picture='.'
- WINTER HEEL row 30: qty='.'
- ... and 189 more

## NEEDS_REVIEW Highlights

- `WINTER_HEEL__row_29__image13.jpeg__a9` — WINTER HEEL row 29 (Selene): degenerate anchor extent (0 width/height)
- `WINTER_HEEL__row_28__image14.jpeg__a10` — WINTER HEEL row 28 (Luna): degenerate anchor extent (0 width/height)
- `SUMMER_HEEL__row_19__image101.png__a0` — SUMMER HEEL row 19 (Star): degenerate anchor extent (0 width/height)
- `SUMMER_DIP_PU__row_5__image241.jpeg__a15` — SUMMER DIP PU row 5 (BIANCA): BIANCA row has multiple anchored images — verify all belong to BIANCA vs neighbors
- `SUMMER_DIP_PU__row_5__image242.jpeg__a16` — SUMMER DIP PU row 5 (BIANCA): BIANCA row has multiple anchored images — verify all belong to BIANCA vs neighbors
- `SUMMER_DIP_PU__row_5__image187.jpeg__a17` — SUMMER DIP PU row 5 (BIANCA): BIANCA row has multiple anchored images — verify all belong to BIANCA vs neighbors
- `SUMMER_DIP_PU__row_5__image188.jpeg__a18` — SUMMER DIP PU row 5 (BIANCA): BIANCA row has multiple anchored images — verify all belong to BIANCA vs neighbors
- `SUMMER_DIP_PU__row_5__image189.jpeg__a19` — SUMMER DIP PU row 5 (BIANCA): BIANCA row has multiple anchored images — verify all belong to BIANCA vs neighbors
- `SUMMER_DIP_PU__row_5__image243.jpeg__a20` — SUMMER DIP PU row 5 (BIANCA): BIANCA row has multiple anchored images — verify all belong to BIANCA vs neighbors
- `SUMMER_DIP_PU__row_5__image191.jpeg__a21` — SUMMER DIP PU row 5 (BIANCA): BIANCA row has multiple anchored images — verify all belong to BIANCA vs neighbors
- `SUMMER_DIP_PU__row_5__image244.jpeg__a22` — SUMMER DIP PU row 5 (BIANCA): BIANCA row has multiple anchored images — verify all belong to BIANCA vs neighbors
- Article SUMMER DIP PU row 5 (BIANCA): BIANCA has 8 anchored images — verify all are product views
