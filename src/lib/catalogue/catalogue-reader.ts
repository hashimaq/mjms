import "server-only";

import { getDemoSession } from "@/lib/auth/demo-session";
import { getAuthenticatedUser } from "@/lib/auth/session-cache";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";

/**
 * One Supabase reader per request for catalogue/search/detail.
 * - Staff/admin: user-scoped client (RLS).
 * - Signed-out public catalogue: server-only service role (key never sent to browser).
 * - Demo session: service role for preview parity.
 */
export const getCatalogueReaderClient = cache(async (): Promise<SupabaseClient | null> => {
  if (await getDemoSession()) {
    return createServiceRoleClient();
  }

  const user = await getAuthenticatedUser();
  if (user && !user.id.startsWith("demo-")) {
    return createClient();
  }

  if (user?.id.startsWith("demo-")) {
    return createServiceRoleClient();
  }

  try {
    return createServiceRoleClient();
  } catch {
    return null;
  }
});
