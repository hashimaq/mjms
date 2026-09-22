/** Trusted profile full_name only — never derive from email local-part. */
export function profileDisplayName(fullName: string | null | undefined): string | null {
  const trimmed = fullName?.trim();
  return trimmed ? trimmed : null;
}

export function welcomeHeading(fullName: string | null | undefined): string {
  const name = profileDisplayName(fullName);
  return name ? `Welcome back, ${name}` : "Welcome back";
}
