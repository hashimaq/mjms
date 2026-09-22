import { ActivityFeed } from "@/components/admin/ActivityFeed";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { fetchEmployeeProfile } from "@/lib/admin/queries";
import { getAdminSupabase } from "@/lib/auth/session-cache";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEmployeeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { supabase } = await getAdminSupabase();
  const detail = await fetchEmployeeProfile(supabase, id);
  if (!detail) notFound();

  const { profile, stats, activity } = detail;

  return (
    <>
      <WorkspacePageHeader
        title={profile.full_name || "Employee profile"}
        lead={profile.email || undefined}
      />

      <div className="mjms-stat-grid">
        <div className="mjms-stat-card">
          <p className="mjms-stat-label">Products added</p>
          <p className="mjms-stat-value">{stats.productsAdded}</p>
        </div>
        <div className="mjms-stat-card">
          <p className="mjms-stat-label">Products updated</p>
          <p className="mjms-stat-value">{stats.productsUpdated}</p>
        </div>
        <div className="mjms-stat-card">
          <p className="mjms-stat-label">Photos uploaded</p>
          <p className="mjms-stat-value">{stats.photosUploaded}</p>
        </div>
      </div>

      <section className="mjms-panel" aria-labelledby="employee-activity-heading">
        <h2 id="employee-activity-heading" className="mjms-panel-title">
          Recent activity
        </h2>
        <ActivityFeed rows={activity} />
      </section>
    </>
  );
}
