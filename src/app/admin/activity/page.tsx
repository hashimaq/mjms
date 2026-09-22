import { ActivityFilters } from "@/components/admin/ActivityFilters";
import { ActivityFeed } from "@/components/admin/ActivityFeed";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { profileDisplayName } from "@/lib/auth/display-name";
import { fetchActivityPage, fetchEmployeesList } from "@/lib/admin/queries";
import { getAdminSupabase } from "@/lib/auth/session-cache";
import Link from "next/link";

type PageProps = {
  searchParams: Promise<{ page?: string; action?: string; user?: string }>;
};

function activityQueryString(raw: { page?: string; action?: string; user?: string }, page: number) {
  const sp = new URLSearchParams();
  if (raw.action) sp.set("action", raw.action);
  if (raw.user) sp.set("user", raw.user);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export default async function AdminActivityPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const page = Math.max(1, Number(raw.page) || 1);
  const { supabase } = await getAdminSupabase();

  const [{ rows, total }, employees] = await Promise.all([
    fetchActivityPage(supabase, page, 20, {
      action: raw.action,
      userId: raw.user,
    }),
    fetchEmployeesList(supabase),
  ]);

  const filterEmployees = employees.map((e) => ({
    id: e.id,
    name: profileDisplayName(e.full_name) ?? e.email ?? "Employee",
  }));
  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <>
      <WorkspacePageHeader
        variant="hero"
        eyebrow="Management"
        title="Activity"
        lead="Who did what, on which product, and when."
      />
      <ActivityFilters employees={filterEmployees} />
      <section className="mjms-panel">
        <ActivityFeed rows={rows} />
      </section>
      {totalPages > 1 && (
        <nav className="mjms-pagination" aria-label="Activity pages">
          {page > 1 && (
            <Link
              href={`/admin/activity${activityQueryString(raw, page - 1)}`}
              className="mjms-pagination-link"
            >
              ← Newer
            </Link>
          )}
          <span>
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/activity${activityQueryString(raw, page + 1)}`}
              className="mjms-pagination-link"
            >
              Older →
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
