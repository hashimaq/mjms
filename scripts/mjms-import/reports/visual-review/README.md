# MJMS Visual Review Package

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
