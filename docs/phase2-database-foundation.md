# Phase 2 — Database Foundation Decisions

## Repository state at Phase 2 start

- No web application framework installed.
- Extraction utility only under `scripts/mjms-import/`.
- Supabase foundation added under `supabase/`.

## Season modeling

**Decision: single `season_raw` / `season_normalized` columns on `articles`.**

Rationale:

- Each Excel row already has one Season cell, including composite values like `WINTER / SUMMER`.
- Import maps 1:1 from `article-master.csv` without splitting business meaning.
- A separate `article_seasons` junction table would require inferring how to split composite strings — that would invent business data.

If dual-season articles need structured filtering later, a migration can add a junction table populated by an explicit business rule — not during initial import.

## Project uniqueness

**Decision: no UNIQUE constraint on `project_raw` or `project_normalized`.**

- 20 duplicate Project names exist in the source (e.g. RIVER × 3, NOVA × 2).
- Stable identity: `source_key` = `"<sheet>::<row>"` (matches extraction `source_id`).
- Additional unique index on `(source_sheet, source_row)`.

## Image storage paths

**Decision: `products/{article_id}/{image_order}.{ext}`**

- Never `products/{project_name}/...` (Project duplicates).
- Never raw Excel media filenames as permanent paths.
- `article_images.storage_path` stores the bucket-relative path.
- URLs generated via signed URLs or authenticated Storage API at display time.

## Duplicate binaries (sha256)

**Decision: sha256 indexed, not unique.**

Same binary may intentionally appear on multiple articles (e.g. APRICOT / OSCAR sharing `image184.jpeg`).

## Qty and raw fields

All potentially inconsistent source columns remain **text** (`qty_raw`, etc.) to preserve values like `Proto`, `1pair PROTO`, `.`, `-`.

## Search strategy

252 articles — PostgreSQL only:

| Need | Implementation |
|------|----------------|
| Exact / filter match | B-tree indexes on normalized columns |
| Partial project name | GIN `pg_trgm` on `project_raw` and `project_normalized` |
| Case-insensitive | Normalized uppercase columns from import |

No Elasticsearch.

## Items requiring confirmation before import

1. **NEEDS_REVIEW images** — Import pipeline should respect `verification_status` from manifest (exclude or flag UNMATCHED / template assets).
2. **Admin user list** — Who receives `profiles.role = 'admin'`?
3. **Signup policy** — Invite-only vs open signup for staff emails.
4. **WDP / HD Photo files** — Convert to JPEG at import or skip until converted?
