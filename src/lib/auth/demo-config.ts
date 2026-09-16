/**
 * DEMO AUTHENTICATION — development / UI preview only.
 *
 * This is NOT production authentication. Replace with Supabase Auth
 * before deploying to production.
 *
 * Configure via environment variables in `.env.local`:
 *   DEMO_AUTH_ENABLED=true
 *   DEMO_ADMIN_EMAIL=admin@mjms.com
 *   DEMO_ADMIN_PASSWORD=your-demo-password
 */

/** When false, only real Supabase Auth is accepted. */
export function isDemoAuthEnabled(): boolean {
  return process.env.DEMO_AUTH_ENABLED !== "false";
}

export function getDemoAdminEmail(): string {
  return process.env.DEMO_ADMIN_EMAIL?.trim() || "admin@mjms.com";
}

/**
 * Server-side only. Never import this from client components.
 * Development fallback is intentionally weak — set DEMO_ADMIN_PASSWORD in .env.local.
 */
export function getDemoAdminPassword(): string {
  return process.env.DEMO_ADMIN_PASSWORD?.trim() || "mjms-demo-admin";
}

export function isValidDemoEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
