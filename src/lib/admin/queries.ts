import { getAdminSupabase } from "@/lib/auth/session-cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mapArticleRowToProduct, type ArticleCatalogueRow } from "@/lib/catalogue/article-map";
import { attachCollageToProducts } from "@/lib/catalogue/attach-product-collage";
import type { CatalogueProduct } from "@/lib/catalogue/types";
import type {
  ActivityLogRow,
  AdminDashboardStats,
  EmployeeDetailStats,
  EmployeeListRow,
} from "./types";

const RECENT_PRODUCT_SELECT =
  "id, project_raw, source_no, source_sheet, making_raw, making_normalized, type_raw, type_normalized, material_raw, colour_raw, size_range_raw, qty_raw, remarks_raw";

const ACTIVITY_SELECT =
  "id, action, entity_type, entity_id, metadata, created_at, user_id, profiles(full_name)";

function weekStartIso(): string {
  const d = new Date();
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function todayStartIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function fetchAdminDashboardStats(
  supabase: SupabaseClient
): Promise<AdminDashboardStats> {
  const weekStart = weekStartIso();
  const todayStart = todayStartIso();

  const [totalProducts, totalEmployees, addedWeek, updatedToday, photosWeek] = await Promise.all([
    supabase.from("articles").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .in("role", ["staff", "employee"]),
    supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekStart),
    supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .gte("updated_at", todayStart),
    supabase
      .from("activity_logs")
      .select("id", { count: "exact", head: true })
      .eq("action", "UPLOAD_PHOTO")
      .gte("created_at", weekStart),
  ]);

  return {
    totalProducts: totalProducts.count ?? 0,
    totalEmployees: totalEmployees.count ?? 0,
    productsAddedThisWeek: addedWeek.count ?? 0,
    productsUpdatedToday: updatedToday.count ?? 0,
    photosUploadedThisWeek: photosWeek.count ?? 0,
  };
}

export async function fetchRecentDashboardProducts(
  supabase: SupabaseClient,
  limit = 8
): Promise<CatalogueProduct[]> {

  const { data, error } = await supabase
    .from("articles")
    .select(RECENT_PRODUCT_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data?.length) return [];

  const products: CatalogueProduct[] = [];
  (data as ArticleCatalogueRow[]).forEach((row, index) => {
    const product = mapArticleRowToProduct(row, index + 1);
    if (product) products.push(product);
  });

  await attachCollageToProducts(supabase, products);

  return products;
}

export async function fetchRecentActivity(
  supabase: SupabaseClient,
  limit = 20
): Promise<ActivityLogRow[]> {

  const { data, error } = await supabase
    .from("activity_logs")
    .select(ACTIVITY_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return normalizeActivityRows(data);
}

export type ActivityListFilters = {
  action?: string;
  userId?: string;
};

export async function fetchActivityPage(
  supabase: SupabaseClient,
  page: number,
  pageSize = 20,
  filters?: ActivityListFilters
): Promise<{ rows: ActivityLogRow[]; total: number }> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("activity_logs")
    .select(ACTIVITY_SELECT, { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters?.action) {
    query = query.eq("action", filters.action);
  }
  if (filters?.userId) {
    query = query.eq("user_id", filters.userId);
  }

  const { data, error, count } = await query.range(from, to);

  if (error || !data) return { rows: [], total: 0 };
  return { rows: normalizeActivityRows(data), total: count ?? 0 };
}

function normalizeActivityRows(data: unknown[]): ActivityLogRow[] {
  return data.map((row) => {
    const r = row as Record<string, unknown>;
    const profilesRaw = r.profiles;
    const profile =
      Array.isArray(profilesRaw) && profilesRaw[0]
        ? (profilesRaw[0] as { full_name: string | null })
        : profilesRaw && typeof profilesRaw === "object" && !Array.isArray(profilesRaw)
          ? (profilesRaw as { full_name: string | null })
          : null;

    return {
      id: String(r.id),
      action: String(r.action),
      entity_type: String(r.entity_type),
      entity_id: r.entity_id ? String(r.entity_id) : null,
      metadata: (r.metadata as Record<string, unknown>) ?? {},
      created_at: String(r.created_at),
      user_id: String(r.user_id),
      profiles: profile,
    };
  });
}

export async function fetchEmployeesList(supabase: SupabaseClient): Promise<EmployeeListRow[]> {

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .in("role", ["staff", "employee"])
    .order("created_at", { ascending: true });

  if (error || !profiles?.length) return [];

  const ids = profiles.map((p) => p.id);

  const { data: statsRows } = await supabase
    .from("activity_logs")
    .select("user_id, action, created_at")
    .in("user_id", ids);

  const addedByUser = new Map<string, number>();
  const updatedByUser = new Map<string, number>();
  const photosByUser = new Map<string, number>();
  const lastByUser = new Map<string, string>();

  for (const row of statsRows ?? []) {
    if (row.action === "CREATE_PRODUCT") {
      addedByUser.set(row.user_id, (addedByUser.get(row.user_id) ?? 0) + 1);
    }
    if (row.action === "UPDATE_PRODUCT" || row.action === "UPDATE_PROJECT") {
      updatedByUser.set(row.user_id, (updatedByUser.get(row.user_id) ?? 0) + 1);
    }
    if (row.action === "UPLOAD_PHOTO") {
      photosByUser.set(row.user_id, (photosByUser.get(row.user_id) ?? 0) + 1);
    }
    const prev = lastByUser.get(row.user_id);
    if (!prev || row.created_at > prev) {
      lastByUser.set(row.user_id, row.created_at);
    }
  }

  const emailById = new Map<string, string | null>();
  try {
    const { createServiceRoleClient } = await import("@/lib/supabase/admin");
    const service = createServiceRoleClient();
    await Promise.all(
      ids.map(async (id) => {
        const { data: authUser } = await service.auth.admin.getUserById(id);
        emailById.set(id, authUser.user?.email ?? null);
      })
    );
  } catch {
    /* email optional when service role unavailable */
  }

  return profiles.map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: emailById.get(p.id) ?? null,
    role: p.role,
    created_at: p.created_at,
    productsAdded: addedByUser.get(p.id) ?? 0,
    productsUpdated: updatedByUser.get(p.id) ?? 0,
    photosUploaded: photosByUser.get(p.id) ?? 0,
    lastActivityAt: lastByUser.get(p.id) ?? null,
  }));
}

export async function fetchEmployeeProfile(
  supabase: SupabaseClient,
  employeeId: string
): Promise<{
  profile: { id: string; full_name: string | null; role: string; created_at: string; email: string | null };
  stats: EmployeeDetailStats;
  activity: ActivityLogRow[];
} | null> {

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .eq("id", employeeId)
    .maybeSingle();

  if (!profile) return null;

  let email: string | null = null;
  try {
    const { createServiceRoleClient } = await import("@/lib/supabase/admin");
    const service = createServiceRoleClient();
    const { data: authUser } = await service.auth.admin.getUserById(employeeId);
    email = authUser.user?.email ?? null;
  } catch {
    email = null;
  }

  const { data: logs } = await supabase
    .from("activity_logs")
    .select("action")
    .eq("user_id", employeeId);

  let productsAdded = 0;
  let productsUpdated = 0;
  let photosUploaded = 0;
  for (const row of logs ?? []) {
    if (row.action === "CREATE_PRODUCT") productsAdded += 1;
    if (row.action === "UPDATE_PRODUCT" || row.action === "UPDATE_PROJECT") productsUpdated += 1;
    if (row.action === "UPLOAD_PHOTO") photosUploaded += 1;
  }

  const activity = await supabase
    .from("activity_logs")
    .select(ACTIVITY_SELECT)
    .eq("user_id", employeeId)
    .order("created_at", { ascending: false })
    .limit(25);

  return {
    profile: { ...profile, email },
    stats: { productsAdded, productsUpdated, photosUploaded },
    activity: normalizeActivityRows(activity.data ?? []),
  };
}
