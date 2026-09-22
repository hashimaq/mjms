import { ActivityFeed } from "@/components/admin/ActivityFeed";
import { fetchRecentActivity } from "@/lib/admin/queries";
import { getAdminSupabase } from "@/lib/auth/session-cache";
import Link from "next/link";

export async function AdminDashboardRecentActivity() {
  const { supabase } = await getAdminSupabase();
  const activity = await fetchRecentActivity(supabase, 10);

  return (
    <section className="mjms-panel" aria-labelledby="admin-recent-activity">
      <div className="mjms-panel-head">
        <h2 id="admin-recent-activity" className="mjms-panel-title">
          Recent activity
        </h2>
        <Link href="/admin/activity" className="mjms-panel-link" prefetch>
          View all
        </Link>
      </div>
      <ActivityFeed rows={activity} compact />
    </section>
  );
}
