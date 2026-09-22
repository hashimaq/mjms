import {
  WorkspaceMetricsSkeleton,
  WorkspacePageHeaderSkeleton,
  WorkspacePanelSkeleton,
} from "@/components/workspace/WorkspacePageSkeletons";

export default function AdminDashboardLoading() {
  return (
    <>
      <WorkspacePageHeaderSkeleton />
      <WorkspaceMetricsSkeleton />
      <div className="mjms-dashboard-split">
        <WorkspacePanelSkeleton />
        <WorkspacePanelSkeleton tall />
      </div>
    </>
  );
}
