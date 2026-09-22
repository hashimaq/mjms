import { ActivityFeed } from "@/components/admin/ActivityFeed";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { WorkspacePanelSkeleton } from "@/components/workspace/WorkspacePageSkeletons";
import { fetchMyActivityForUser } from "@/lib/employee/queries";
import { getStaffSupabase } from "@/lib/auth/session-cache";
import { Suspense } from "react";

async function EmployeeActivityList() {
  const { user, supabase } = await getStaffSupabase();
  const activity = await fetchMyActivityForUser(supabase, user.id, 30);

  return (
    <section className="mjms-panel mjms-panel--flush" aria-labelledby="employee-activity-heading">
      <ActivityFeed rows={activity} />
    </section>
  );
}

export default function EmployeeActivityPage() {
  return (
    <div className="mjms-workspace-page">
      <WorkspacePageHeader
        variant="hero"
        eyebrow="Product development"
        title="My activity"
        lead="Your recent catalogue contributions, uploads, and product updates."
      />

      <Suspense fallback={<WorkspacePanelSkeleton tall />}>
        <EmployeeActivityList />
      </Suspense>
    </div>
  );
}
