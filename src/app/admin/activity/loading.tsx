import { WorkspacePanelSkeleton } from "@/components/workspace/WorkspacePageSkeletons";

export default function AdminActivityLoading() {
  return (
    <>
      <div className="mjms-skeleton mjms-skeleton-title-lg" aria-hidden />
      <WorkspacePanelSkeleton tall />
    </>
  );
}
