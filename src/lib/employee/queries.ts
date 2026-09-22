import { getDemoSession } from "@/lib/auth/demo-session";
import type { ActivityLogRow } from "@/lib/admin/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const ACTIVITY_SELECT =
  "id, action, entity_type, entity_id, metadata, created_at, user_id, profiles(full_name)";

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

export async function fetchMyActivityForUser(
  supabase: SupabaseClient,
  userId: string,
  limit = 25
): Promise<ActivityLogRow[]> {
  if (await getDemoSession()) return [];

  const { data, error } = await supabase
    .from("activity_logs")
    .select(ACTIVITY_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return normalizeActivityRows(data);
}
