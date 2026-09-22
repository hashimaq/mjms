import { EmployeeShell } from "@/components/employee/EmployeeShell";
import { AuthError } from "@/lib/auth/auth-error";
import { requireStaffOnly } from "@/lib/auth/session-cache";
import { adminDashboardPath } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function EmployeeLayout({ children }: { children: ReactNode }) {
  try {
    const user = await requireStaffOnly();
    return <EmployeeShell user={user}>{children}</EmployeeShell>;
  } catch (err) {
    if (err instanceof AuthError && err.code === "forbidden") {
      redirect(adminDashboardPath());
    }
    redirect("/login?redirect=/employee/dashboard");
  }
}
