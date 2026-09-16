# MJMS Product Development

Internal product development hub — browse projects and photo galleries.

## Frontend (Next.js)

### Prerequisites

- Node.js 20+
- Next.js **16.3.4** (App Router + Turbopack in dev/build)
- Supabase project with migrations applied
- `.env` configured (see `.env.example`)

Required for the frontend:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo login (UI preview)

Demo authentication is enabled by default. This is **not** production auth.

| Role | Email | Password |
|------|-------|----------|
| Staff (any valid email) | e.g. `user@example.com` | any non-empty password |
| Admin | `admin@mjms.com` | value of `DEMO_ADMIN_PASSWORD` in `.env` (default: `mjms-demo-admin`) |

Set `DEMO_AUTH_ENABLED=false` before production to require real Supabase Auth.

### Branding

Place the official logo at:

```
public/brand/mjms-logo.jpg
```

Supported: PNG, JPG, SVG (update `src/components/brand/MjmsLogo.tsx` if using a different filename).

## Data import (Python)

See `scripts/mjms-import/README.md` for Excel extraction and Supabase import utilities.
