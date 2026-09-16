# MJMS Article Import Report

**Generated (UTC):** 2026-09-10T06:58:22.590750+00:00
**Mode:** import
**Source file:** `scripts/mjms-import/reports/article-master.csv`

## Summary

- CSV rows read: **252**
- Valid rows: **252**
- Invalid rows: **0**
- Duplicate source_key in CSV: **0**
- Already in database: **0**
- New rows to insert: **252**

## Import Result

- Inserted: **252**
- Skipped (existing source_key): **0**
- Failed: **0**
- Final articles count: **252**

## NEEDS_REVIEW (from missing-images.csv)

- `SUMMER DIP PU::5` (BIANCA): BIANCA has 8 anchored images — verify all are product views

## Import Policy

- Idempotent on `source_key` (format `<sheet>::<row>`).
- Existing rows are **not overwritten** (`ON CONFLICT DO NOTHING`).
- Raw values preserved; qty remains text.
- No image data imported in this phase.
