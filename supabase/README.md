# MJMS Supabase Foundation (Phase 2)

Database, Storage, and Auth foundation for the internal MJMS product catalogue.

**This phase does not import articles or upload images.**

## Prerequisites

1. A Supabase project (already exists for MJMS).
2. [Supabase CLI](https://supabase.com/docs/guides/cli) (optional but recommended):

   ```bash
   npm install -g supabase
   supabase login
   supabase link --project-ref <your-project-ref>
   ```

3. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

   Fill in values from **Project Settings → API** in the Supabase dashboard.

## Apply Migrations

### Option A — Supabase CLI (recommended)

```bash
supabase db push
```

### Option B — SQL Editor

Run each file in `supabase/migrations/` in filename order in the Supabase SQL Editor.

## Validate Locally

```bash
python scripts/validate-schema.py
```

## Schema Overview

| Table | Purpose |
|-------|---------|
| `profiles` | App user profile linked to `auth.users` |
| `articles` | Catalogue articles (UUID PK; Project not unique) |
| `article_images` | Storage path + metadata per image |

## Storage

| Setting | Value |
|---------|--------|
| Bucket | `product-images` |
| Access | **Private** |
| Path pattern | `products/{article_id}/{image_order}.{ext}` |

Signed URLs are generated at read time — permanent public URLs are not stored.

## Auth

See [auth/README.md](./auth/README.md) for email/password setup, verification, and role assignment.

## First Admin User

After a user signs up (or is invited):

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = '<auth-user-uuid>';
```

Run as service role / SQL editor. Do not expose service role key in client apps.

## Next Phase

Controlled import from:

- `scripts/mjms-import/reports/article-master.csv`
- `scripts/mjms-import/reports/image-manifest.csv`
- `scripts/mjms-import/extracted-images/`
