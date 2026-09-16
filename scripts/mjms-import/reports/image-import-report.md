# MJMS Image Import Report

**Initial import (UTC):** 2026-09-10T07:54:00+00:00  
**Final verification (UTC):** 2026-09-10T11:59:00+00:00  
**Mode:** import

## Source Files

- Manifest: `scripts/mjms-import/reports/image-manifest.csv`
- Extracted images: `scripts/mjms-import/extracted-images/`
- Article matching: `source_sheet` + `source_row` → `source_key` (`<sheet>::<row>`)

## Mapping Methodology

1. Read each row from `image-manifest.csv`.
2. Build `source_key` from `sheet` + `excel_row` (never Project name alone).
3. Look up `articles.id` in Supabase by `source_key`.
4. Skip UNMATCHED, NEEDS_REVIEW, template assets (image54/55), `.wdp`, low confidence.
5. Require VERIFIED + HIGH confidence + existing extracted file.
6. Order ready images per article by manifest `image_sequence`.
7. Assign `image_order` 1..N; first image `is_primary=true`.
8. Planned storage path: `products/{article_id}/{order:02d}.{ext}`

## Totals

- Total manifest placements: **289**
- Confidently mapped (ready): **257**
- Needs review (skipped): **11**
- Unmatched (skipped): **4**
- Orphan/unmatched path (skipped): **0**
- Template image54/55 (skipped): **17**
- Unsupported WDP in manifest: **0**
- Unreferenced WDP in `_all_media/`: **48**
- Missing extracted files: **0**
- No article match: **0**
- Low confidence (skipped): **0**
- Duplicate SHA groups (ready only): **15**
- Duplicate SHA groups (all placements): **22**
- Articles with ≥1 ready image: **235**
- Articles with zero ready images: **17**
- Total images ready for import: **257**

## Skip Breakdown

- `template_asset`: **17**
- `needs_review`: **11**
- `unmatched`: **4**

## Special Cases

- **NEEDS_REVIEW** — `WINTER_HEEL__row_29__image13.jpeg__a9` (WINTER HEEL row 29, Selene) [image13.jpeg] → **skip** (needs_review)
- **NEEDS_REVIEW** — `WINTER_HEEL__row_28__image14.jpeg__a10` (WINTER HEEL row 28, Luna) [image14.jpeg] → **skip** (needs_review)
- **recurring_image54** — `WINTER_FLAT__row_39__image54.png__a20` (WINTER FLAT row 39, no project) [image54.png] → **skip** (template_asset)
- **recurring_image55** — `WINTER_FLAT__row_39__image55.png__a21` (WINTER FLAT row 39, no project) [image55.png] → **skip** (template_asset)
- **recurring_image54** — `WINTER_PU__row_16__image54.png__a2` (WINTER PU row 16, no project) [image54.png] → **skip** (template_asset)
- **recurring_image55** — `WINTER_PU__row_16__image55.png__a3` (WINTER PU row 16, no project) [image55.png] → **skip** (template_asset)
- **recurring_image54** — `WINTER_DIP_PU__row_19__image54.png__a7` (WINTER DIP PU row 19, no project) [image54.png] → **skip** (template_asset)
- **recurring_image55** — `WINTER_DIP_PU__row_19__image55.png__a8` (WINTER DIP PU row 19, no project) [image55.png] → **skip** (template_asset)
- **recurring_image54** — `WINTER_DIP_PVC__row_38__image54.png__a27` (WINTER DIP PVC row 38, no project) [image54.png] → **skip** (template_asset)
- **recurring_image55** — `WINTER_DIP_PVC__row_38__image55.png__a28` (WINTER DIP PVC row 38, no project) [image55.png] → **skip** (template_asset)
- **NEEDS_REVIEW** — `SUMMER_HEEL__row_19__image101.png__a0` (SUMMER HEEL row 19, Star) [image101.png] → **skip** (needs_review)
- **recurring_image54** — `SUMMER_HEEL__row_48__image54.png__a1` (SUMMER HEEL row 48, no project) [image54.png] → **skip** (template_asset)
- **recurring_image55** — `SUMMER_HEEL__row_48__image55.png__a2` (SUMMER HEEL row 48, no project) [image55.png] → **skip** (template_asset)
- **recurring_image54** — `SUMMER_FLAT__row_47__image54.png__a16` (SUMMER FLAT row 47, no project) [image54.png] → **skip** (template_asset)
- **SUMMER_FLAT_image13_orphan** — `SUMMER_FLAT__row_42__image13.jpeg__a37` (SUMMER FLAT row 42, no project) [image13.jpeg] → **skip** (unmatched)
- **APRICOT_OSCAR_shared_binary** — `SUMMER_PU__row_25__image184.jpeg__a22` (SUMMER PU row 25, APRICOT) [image184.jpeg] → **ready** (ready_for_import)
- **APRICOT_OSCAR_shared_binary** — `SUMMER_PU__row_25__image184.jpeg__a23` (SUMMER PU row 25, APRICOT) [image184.jpeg] → **ready** (ready_for_import)
- **recurring_image54** — `SUMMER_PU__row_73__image54.png__a46` (SUMMER PU row 73, no project) [image54.png] → **skip** (template_asset)
- **recurring_image55** — `SUMMER_PU__row_73__image55.png__a47` (SUMMER PU row 73, no project) [image55.png] → **skip** (template_asset)
- **BIANCA, NEEDS_REVIEW** — `SUMMER_DIP_PU__row_5__image241.jpeg__a15` (SUMMER DIP PU row 5, BIANCA) [image241.jpeg] → **skip** (needs_review)
- **BIANCA, NEEDS_REVIEW** — `SUMMER_DIP_PU__row_5__image242.jpeg__a16` (SUMMER DIP PU row 5, BIANCA) [image242.jpeg] → **skip** (needs_review)
- **BIANCA, NEEDS_REVIEW** — `SUMMER_DIP_PU__row_5__image187.jpeg__a17` (SUMMER DIP PU row 5, BIANCA) [image187.jpeg] → **skip** (needs_review)
- **BIANCA, NEEDS_REVIEW** — `SUMMER_DIP_PU__row_5__image188.jpeg__a18` (SUMMER DIP PU row 5, BIANCA) [image188.jpeg] → **skip** (needs_review)
- **BIANCA, NEEDS_REVIEW** — `SUMMER_DIP_PU__row_5__image189.jpeg__a19` (SUMMER DIP PU row 5, BIANCA) [image189.jpeg] → **skip** (needs_review)
- **BIANCA, NEEDS_REVIEW** — `SUMMER_DIP_PU__row_5__image243.jpeg__a20` (SUMMER DIP PU row 5, BIANCA) [image243.jpeg] → **skip** (needs_review)
- **BIANCA, NEEDS_REVIEW** — `SUMMER_DIP_PU__row_5__image191.jpeg__a21` (SUMMER DIP PU row 5, BIANCA) [image191.jpeg] → **skip** (needs_review)
- **BIANCA, NEEDS_REVIEW** — `SUMMER_DIP_PU__row_5__image244.jpeg__a22` (SUMMER DIP PU row 5, BIANCA) [image244.jpeg] → **skip** (needs_review)
- **APRICOT_OSCAR_shared_binary** — `SUMMER_DIP_PU__row_19__image184.jpeg__a24` (SUMMER DIP PU row 19, OSCAR) [image184.jpeg] → **ready** (ready_for_import)
- **recurring_image54** — `SUMMER_DIP_PU__row_30__image54.png__a27` (SUMMER DIP PU row 30, no project) [image54.png] → **skip** (template_asset)
- **recurring_image55** — `SUMMER_DIP_PU__row_30__image55.png__a28` (SUMMER DIP PU row 30, no project) [image55.png] → **skip** (template_asset)
- **recurring_image54** — `SUMMER_DIP_PVC__row_18__image54.png__a8` (SUMMER DIP PVC row 18, no project) [image54.png] → **skip** (template_asset)
- **recurring_image55** — `SUMMER_DIP_PVC__row_18__image55.png__a9` (SUMMER DIP PVC row 18, no project) [image55.png] → **skip** (template_asset)

## Import Result

### Initial import run

- Storage uploads successful: **257**
- DB inserts successful: **257**
- Skipped (already existing): **0**
- Upload failures: **0**
- DB insert failures: **0**
- Orphan uploads (storage ok, DB failed): **0**

### Final idempotency re-run

- Storage uploads successful: **0**
- DB inserts successful: **0**
- Skipped (already existing): **257**
- Upload failures: **0**
- DB insert failures: **0**
- Orphan uploads (storage ok, DB failed): **0**

**Inconsistencies:** none

## Post-Import Verification

- articles_count: **252**
- article_images_count: **257**
- articles_with_images: **235**
- articles_without_images: **17**
- storage_objects: **257**
- duplicate_storage_paths: **0**
- multi_primary_articles: **0**
- invalid_article_refs: **0**
- needs_review_imported: **0**
- unmatched_imported: **0**
- template_imported: **0**
- wdp_imported: **0**
- dup_paths: **[]**
- multi_primary: **[]**
- orphan_details: **[]**
