import {
  WorkspaceMetricsSkeleton,
  WorkspacePageHeaderSkeleton,
  WorkspacePanelSkeleton,
} from "@/components/workspace/WorkspacePageSkeletons";

export default function EmployeeDashboardLoading() {
  return (
    <>
      <WorkspacePageHeaderSkeleton />
      <div className="mjms-skeleton mjms-skeleton-block" style={{ minHeight: "8rem" }} aria-hidden />
      <div className="mjms-dashboard-split">
        <WorkspacePanelSkeleton />
        <WorkspacePanelSkeleton tall />
      </div>
    </>
  );
}
