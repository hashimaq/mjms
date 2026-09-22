import { fetchAdminDashboardStats } from "@/lib/admin/queries";
import { getAdminSupabase } from "@/lib/auth/session-cache";
import Link from "next/link";

export async function AdminDashboardMetrics() {
  const { supabase } = await getAdminSupabase();
  const stats = await fetchAdminDashboardStats(supabase);

  return (
    <section className="mjms-dashboard-section" aria-labelledby="admin-metrics-heading">
      <h2 id="admin-metrics-heading" className="mjms-section-title">
        Overview
      </h2>
      <div className="mjms-stat-grid">
        <StatCard label="Total products" value={stats.totalProducts} href="/admin/catalogue" />
        <StatCard label="Employees" value={stats.totalEmployees} href="/admin/employees" />
        <StatCard label="Added this week" value={stats.productsAddedThisWeek} />
        <StatCard label="Updated today" value={stats.productsUpdatedToday} />
        <StatCard label="Photos this week" value={stats.photosUploadedThisWeek} />
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href?: string;
}) {
  const inner = (
    <>
      <p className="mjms-stat-label">{label}</p>
      <p className="mjms-stat-value">{value.toLocaleString()}</p>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="mjms-stat-card mjms-stat-card--link" prefetch>
        {inner}
      </Link>
    );
  }
  return <div className="mjms-stat-card">{inner}</div>;
}
