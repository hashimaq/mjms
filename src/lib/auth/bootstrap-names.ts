/**
 * Server-only display names for bootstrap/demo alignment with env config.
 * Not used in welcome UI directly — profiles remain source of truth after bootstrap.
 */

export function bootstrapAdminFullName(): string {
  return process.env.MJMS_INITIAL_ADMIN_FULL_NAME?.trim() || "Saad Manzoor";
}

export function bootstrapEmployeeFullName(): string {
  return process.env.MJMS_INITIAL_EMPLOYEE_FULL_NAME?.trim() || "Taimoor";
}

export function demoFullNameForEmail(email: string, role: "admin" | "staff"): string | null {
  const normalized = email.trim().toLowerCase();
  const adminEmail = process.env.MJMS_INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const employeeEmail = process.env.MJMS_INITIAL_EMPLOYEE_EMAIL?.trim().toLowerCase();

  if (adminEmail && normalized === adminEmail) {
    return bootstrapAdminFullName();
  }
  if (employeeEmail && normalized === employeeEmail) {
    return bootstrapEmployeeFullName();
  }

  return null;
}
