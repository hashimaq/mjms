/**
 * Server-only: align profiles with MJMS_INITIAL_* env bootstrap (role + full name).
 * Does not log credentials. Safe to call after every successful Supabase sign-in.
 */

import { bootstrapAdminFullName, bootstrapEmployeeFullName } from "@/lib/auth/bootstrap-names";
import { createServiceRoleClient } from "@/lib/supabase/admin";

function configuredRoleForEmail(email: string | undefined): {
  role: "admin" | "employee";
  fullName: string;
} | null {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return null;

  const adminEmail = process.env.MJMS_INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const employeeEmail = process.env.MJMS_INITIAL_EMPLOYEE_EMAIL?.trim().toLowerCase();

  if (adminEmail && normalized === adminEmail) {
    return { role: "admin", fullName: bootstrapAdminFullName() };
  }
  if (employeeEmail && normalized === employeeEmail) {
    return { role: "employee", fullName: bootstrapEmployeeFullName() };
  }
  return null;
}

export async function syncBootstrapProfileForUser(
  userId: string,
  email: string | undefined
): Promise<void> {
  const target = configuredRoleForEmail(email);
  if (!target) return;

  try {
    const supabase = createServiceRoleClient();
    await supabase
      .from("profiles")
      .update({ role: target.role, full_name: target.fullName })
      .eq("id", userId);
  } catch {
    /* service role unavailable in some environments */
  }
}
