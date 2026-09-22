import { adminDashboardPath } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

export default function AdminIndexPage() {
  redirect(adminDashboardPath());
}
