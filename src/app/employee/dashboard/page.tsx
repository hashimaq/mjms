import { EmployeeDashboardQuickLinks } from "@/components/employee/dashboard/EmployeeDashboardQuickLinks";
import { EmployeeDashboardRecentActivity } from "@/components/employee/dashboard/EmployeeDashboardRecentActivity";
import { EmployeeDashboardRecentProducts } from "@/components/employee/dashboard/EmployeeDashboardRecentProducts";
import { EmployeeDashboardHeader } from "@/components/workspace/EmployeeDashboardHeader";
import {
  WorkspacePanelSkeleton,
} from "@/components/workspace/WorkspacePageSkeletons";
import { requireStaffOnly } from "@/lib/auth/session-cache";
import { Suspense } from "react";

export default async function EmployeeDashboardPage() {
  const user = await requireStaffOnly();

  return (
    <>
      <EmployeeDashboardHeader fullName={user.fullName} />

      <EmployeeDashboardQuickLinks />

      <div className="mjms-dashboard-split">
        <Suspense fallback={<WorkspacePanelSkeleton />}>
          <EmployeeDashboardRecentActivity />
        </Suspense>
        <Suspense fallback={<WorkspacePanelSkeleton tall />}>
          <EmployeeDashboardRecentProducts />
        </Suspense>
      </div>
    </>
  );
}
