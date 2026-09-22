import { AdminShell } from "@/components/admin/AdminShell";
import { AuthError } from "@/lib/auth/auth-error";
import { requireAdmin } from "@/lib/auth/session-cache";
import { employeeDashboardPath } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  try {
    const user = await requireAdmin();
    return <AdminShell user={user}>{children}</AdminShell>;
  } catch (err) {
    if (err instanceof AuthError && err.code === "forbidden") {
      redirect(employeeDashboardPath());
    }
    redirect("/login?redirect=/admin/dashboard");
  }
}
