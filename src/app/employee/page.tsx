import { employeeDashboardPath } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

export default function EmployeeIndexPage() {
  redirect(employeeDashboardPath());
}
