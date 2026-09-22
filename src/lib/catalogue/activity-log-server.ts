import "server-only";

import { getDemoSession } from "@/lib/auth/demo-session";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Best-effort audit log — never blocks product/photo workflows. */
export async function appendActivityLogBestEffort(
  supabase: SupabaseClient,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, unknown>
): Promise<void> {
  const demo = await getDemoSession();
  if (demo) return;

  const { error } = await supabase.rpc("append_activity_log", {
    p_action: action,
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_metadata: metadata,
  });

  if (error) {
    console.error("[activity-log]", {
      action,
      entityType,
      entityId,
      code: error.code,
      message: error.message,
    });
  }
}
