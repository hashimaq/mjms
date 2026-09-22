import { ActivityFeed } from "@/components/admin/ActivityFeed";
import { fetchMyActivityForUser } from "@/lib/employee/queries";
import { getStaffSupabase } from "@/lib/auth/session-cache";
import Link from "next/link";

export async function EmployeeDashboardRecentActivity() {
  const { user, supabase } = await getStaffSupabase();
  const activity = await fetchMyActivityForUser(supabase, user.id, 10);

  return (
    <section className="mjms-panel" aria-labelledby="employee-recent-activity">
      <div className="mjms-panel-head">
        <h2 id="employee-recent-activity" className="mjms-panel-title">
          Recent activity
        </h2>
        <Link href="/employee/activity" className="mjms-panel-link" prefetch>
          View all
        </Link>
      </div>
      <ActivityFeed rows={activity} compact />
    </section>
  );
}
