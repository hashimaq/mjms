import { WorkspaceFormSkeleton } from "@/components/workspace/WorkspacePageSkeletons";

export default function EmployeeNewProductLoading() {
  return (
    <>
      <div className="mjms-page-header mjms-skeleton-block mjms-skeleton-header-compact" aria-hidden />
      <WorkspaceFormSkeleton />
    </>
  );
}
