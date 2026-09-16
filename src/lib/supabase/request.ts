import { getDemoSession } from "@/lib/auth/demo-session";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns the appropriate Supabase client for the current request.
 * Demo sessions use the service role on the server so catalogue data
 * remains readable without a real Supabase Auth account.
 */
export async function createRequestClient(): Promise<SupabaseClient> {
  const demo = await getDemoSession();
  if (demo) {
    return createServiceRoleClient();
  }
  return createClient();
}
