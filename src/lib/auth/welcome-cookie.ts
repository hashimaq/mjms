/** Short-lived flag: show post-login welcome once, then clear. */
export const WELCOME_PENDING_COOKIE = "mjms_welcome_pending";

export const WELCOME_COOKIE_MAX_AGE = 120;

export function welcomePendingCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: WELCOME_COOKIE_MAX_AGE,
  };
}
