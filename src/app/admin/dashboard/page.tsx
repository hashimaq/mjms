import { AdminDashboardMetrics } from "@/components/admin/dashboard/AdminDashboardMetrics";
import { AdminDashboardRecentActivity } from "@/components/admin/dashboard/AdminDashboardRecentActivity";
import { AdminDashboardRecentProducts } from "@/components/admin/dashboard/AdminDashboardRecentProducts";
import { AdminDashboardHeader } from "@/components/workspace/AdminDashboardHeader";
import {
  WorkspaceMetricsSkeleton,
  WorkspacePanelSkeleton,
} from "@/components/workspace/WorkspacePageSkeletons";
import { requireAdmin } from "@/lib/auth/session-cache";
import { Suspense } from "react";

export default async function AdminDashboardPage() {
  const user = await requireAdmin();

  return (
    <>
      <AdminDashboardHeader fullName={user.fullName} />

      <Suspense fallback={<WorkspaceMetricsSkeleton />}>
        <AdminDashboardMetrics />
      </Suspense>

      <div className="mjms-dashboard-split">
        <Suspense fallback={<WorkspacePanelSkeleton />}>
          <AdminDashboardRecentActivity />
        </Suspense>
        <Suspense fallback={<WorkspacePanelSkeleton tall />}>
          <AdminDashboardRecentProducts />
        </Suspense>
      </div>
    </>
  );
}
