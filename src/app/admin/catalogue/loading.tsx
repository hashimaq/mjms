import {
  WorkspaceCatalogueSkeleton,
  WorkspacePageHeaderSkeleton,
} from "@/components/workspace/WorkspacePageSkeletons";

export default function AdminCatalogueLoading() {
  return (
    <div className="mjms-workspace-page mjms-workspace-page--catalogue" aria-hidden>
      <WorkspacePageHeaderSkeleton />
      <WorkspaceCatalogueSkeleton />
      <WorkspaceCatalogueSkeleton />
    </div>
  );
}
