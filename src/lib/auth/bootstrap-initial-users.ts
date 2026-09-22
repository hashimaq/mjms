/**
 * One-time bootstrap of initial admin/employee Supabase Auth users (server-only).
 * Never logs or returns passwords.
 */

import { bootstrapAdminFullName, bootstrapEmployeeFullName } from "@/lib/auth/bootstrap-names";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type BootstrapUser = {
  email: string;
  password: string;
  role: "admin" | "staff" | "employee";
  fullName: string;
};

function readBootstrapUsers(): BootstrapUser[] {
  const users: BootstrapUser[] = [];

  const adminEmail = process.env.MJMS_INITIAL_ADMIN_EMAIL?.trim();
  const adminPassword = process.env.MJMS_INITIAL_ADMIN_PASSWORD?.trim();
  if (adminEmail && adminPassword) {
    users.push({
      email: adminEmail,
      password: adminPassword,
      role: "admin",
      fullName: bootstrapAdminFullName(),
    });
  }

  const employeeEmail = process.env.MJMS_INITIAL_EMPLOYEE_EMAIL?.trim();
  const employeePassword = process.env.MJMS_INITIAL_EMPLOYEE_PASSWORD?.trim();
  if (employeeEmail && employeePassword) {
    users.push({
      email: employeeEmail,
      password: employeePassword,
      role: "employee",
      fullName: bootstrapEmployeeFullName(),
    });
  }

  return users;
}

export async function bootstrapInitialUsers(): Promise<{
  created: string[];
  skipped: string[];
  errors: { email: string; message: string }[];
}> {
  const configured = readBootstrapUsers();
  const created: string[] = [];
  const skipped: string[] = [];
  const errors: { email: string; message: string }[] = [];

  if (configured.length === 0) {
    return { created, skipped, errors };
  }

  const supabase = createServiceRoleClient();

  for (const entry of configured) {
    const email = entry.email.toLowerCase();

    const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listError) {
      errors.push({ email, message: "Unable to inspect existing users." });
      continue;
    }

    const existing = listData.users.find((u) => u.email?.toLowerCase() === email);
    if (existing) {
      await supabase
        .from("profiles")
        .update({ role: entry.role, full_name: entry.fullName })
        .eq("id", existing.id);
      skipped.push(email);
      continue;
    }

    const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: entry.password,
      email_confirm: true,
      user_metadata: { full_name: entry.fullName },
    });

    if (createError || !createdUser.user) {
      errors.push({ email, message: createError?.message ?? "Create failed." });
      continue;
    }

    await supabase
      .from("profiles")
      .update({ role: entry.role, full_name: entry.fullName })
      .eq("id", createdUser.user.id);

    created.push(email);
  }

  return { created, skipped, errors };
}
