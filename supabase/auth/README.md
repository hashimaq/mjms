# Authentication Foundation

MJMS uses **Supabase Auth** only. No custom password tables.

## Supported (Phase 2)

| Feature | Configuration |
|---------|----------------|
| Email / password login | Supabase Auth → Providers → Email |
| Email verification | `enable_confirmations = true` in `supabase/config.toml` |
| Session persistence | Supabase client (`persistSession: true`) |
| Logout | `supabase.auth.signOut()` |
| Roles | `profiles.role`: `staff` \| `admin` |

## Dashboard Checklist

In Supabase **Authentication → Providers → Email**:

1. Enable Email provider.
2. Enable **Confirm email** (recommended for internal staff accounts).
3. Disable public signup if staff are invite-only (`enable_signup = false` in config.toml).

In **Authentication → URL Configuration**:

- Set **Site URL** to your future app URL (e.g. `http://localhost:3000` for development).
- Add redirect URLs for email confirmation links.

## Environment Variables (future frontend / import tooling)

```env
# Browser-safe
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Server-side import scripts ONLY — never in browser bundles
SUPABASE_SERVICE_ROLE_KEY=
```

## Profile Creation

On `auth.users` insert, trigger `handle_new_user` creates:

```text
profiles.id     = auth.users.id
profiles.role   = 'staff'   (default)
profiles.full_name = from metadata or email local-part
```

Promote admins manually via SQL (see main Supabase README).

## Role Enforcement

| Action | staff | admin |
|--------|-------|-------|
| Read articles / images | ✓ | ✓ |
| Read own profile | ✓ | ✓ |
| Insert/update/delete articles | ✗ | ✓ |
| Upload storage images | ✗ | ✓ |
| Manage all profiles | ✗ | ✓ |

Enforced via PostgreSQL RLS and Storage policies using `is_catalogue_user()` and `is_admin()`.

## Google OAuth

Not configured in Phase 2. Can be enabled later in Supabase dashboard without schema changes.

## Client Integration (future — not implemented yet)

When the catalogue UI is built:

1. Install `@supabase/supabase-js`.
2. Browser client uses **anon key only**.
3. Import pipeline uses **service role key** on the server only.

Example browser client:

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: true, autoRefreshToken: true } }
);
```

No authentication UI is built in Phase 2.
