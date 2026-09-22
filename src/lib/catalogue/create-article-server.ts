import "server-only";

import { getCategorySourceSheet, type CategorySlug, type SeasonSlug } from "@/lib/collections/config";
import type { UserProfile } from "@/lib/projects/types";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

function isMissingRpc(error: PostgrestError | null): boolean {
  return error?.code === "PGRST202" || error?.code === "42883";
}

/** Avoid a failing RPC round-trip on every create when migrations are not applied. */
let createArticleRpcAvailable: boolean | null = null;

export type CreateArticleInput = {
  projectName: string;
  articleReference?: string;
  season: SeasonSlug;
  category: CategorySlug;
  making?: string;
  type?: string;
  material?: string;
  colour?: string;
  sizeRange?: string;
  qty?: string;
  remarks?: string;
};

function buildArticleInsertRow(input: CreateArticleInput, sourceSheet: string, sourceRow: number) {
  const projectName = input.projectName.trim();
  const sourceKey = `${sourceSheet}::manual-${randomUUID()}`;

  return {
    project_raw: projectName,
    project_normalized: projectName.toUpperCase(),
    source_sheet: sourceSheet,
    source_row: sourceRow,
    source_key: sourceKey,
    source_no: input.articleReference?.trim() || null,
    season_raw: input.season.toUpperCase(),
    making_raw: input.making?.trim() || null,
    type_raw: input.type?.trim() || null,
    material_raw: input.material?.trim() || null,
    colour_raw: input.colour?.trim() || null,
    size_range_raw: input.sizeRange?.trim() || null,
    qty_raw: input.qty?.trim() || null,
    remarks_raw: input.remarks?.trim() || null,
    making_normalized: input.making?.trim() || null,
    type_normalized: input.type?.trim() || null,
  };
}

async function resolveNextSourceRow(
  supabase: SupabaseClient,
  sourceSheet: string
): Promise<number> {
  const { data, error } = await supabase
    .from("articles")
    .select("source_row")
    .eq("source_sheet", sourceSheet)
    .order("source_row", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    const { count } = await supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("source_sheet", sourceSheet);
    return (count ?? 0) + 1;
  }

  const maxRow = data?.source_row;
  return (typeof maxRow === "number" && maxRow > 0 ? maxRow : 0) + 1;
}

async function logCreateActivity(
  userClient: SupabaseClient,
  service: SupabaseClient | null,
  userId: string,
  articleId: string,
  metadata: Record<string, unknown>
): Promise<void> {
  const meta = {
    ...metadata,
    project_name: metadata.project_name ?? metadata.projectName,
  };

  const { error: rpcError } = await userClient.rpc("append_activity_log", {
    p_action: "CREATE_PRODUCT",
    p_entity_type: "article",
    p_entity_id: articleId,
    p_metadata: meta,
  });

  if (!rpcError) return;

  if (!isMissingRpc(rpcError) || !service) {
    console.error("[createCatalogueProduct] activity log (rpc)", {
      userId,
      articleId,
      code: rpcError.code,
      message: rpcError.message,
    });
    return;
  }

  const { error: insertError } = await service.from("activity_logs").insert({
    user_id: userId,
    action: "CREATE_PRODUCT",
    entity_type: "article",
    entity_id: articleId,
    metadata: meta,
  });

  if (insertError) {
    console.error("[createCatalogueProduct] activity log (fallback insert)", {
      userId,
      articleId,
      code: insertError.code,
      message: insertError.message,
    });
  }
}

function logCreateFailure(
  context: Record<string, unknown>,
  error: PostgrestError | null
): void {
  console.error("[createCatalogueProduct]", {
    ...context,
    code: error?.code,
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
  });
}

function userFacingCreateError(error: PostgrestError | null): string {
  if (!error) return "Unable to create product. Please try again.";
  if (error.code === "42501") {
    return "You do not have permission to create products. Contact an administrator.";
  }
  if (error.code === "23505") {
    return "A catalogue record with this reference already exists. Change the article reference or category.";
  }
  if (isMissingRpc(error)) {
    return "Catalogue database functions are not installed. Run Supabase migrations (see README).";
  }
  return "Unable to create product. Please try again.";
}

export async function createArticleOnServer(
  userClient: SupabaseClient,
  user: UserProfile,
  input: CreateArticleInput
): Promise<{ ok: true; articleId: string } | { ok: false; message: string }> {
  const sourceSheet = getCategorySourceSheet(input.season, input.category);
  const nextRow = await resolveNextSourceRow(userClient, sourceSheet);
  const metadata = {
    season: input.season,
    category: input.category,
    project_name: input.projectName.trim(),
  };

  if (createArticleRpcAvailable !== false) {
    const { data: rpcId, error: rpcError } = await userClient.rpc("create_article_with_activity", {
      p_project_raw: input.projectName.trim(),
      p_source_sheet: sourceSheet,
      p_source_row: nextRow,
      p_source_key: `${sourceSheet}::manual-${randomUUID()}`,
      p_source_no: input.articleReference?.trim() || null,
      p_season_raw: input.season.toUpperCase(),
      p_making_raw: input.making?.trim() || null,
      p_type_raw: input.type?.trim() || null,
      p_material_raw: input.material?.trim() || null,
      p_colour_raw: input.colour?.trim() || null,
      p_size_range_raw: input.sizeRange?.trim() || null,
      p_qty_raw: input.qty?.trim() || null,
      p_remarks_raw: input.remarks?.trim() || null,
      p_metadata: metadata,
    });

    if (!rpcError && rpcId) {
      createArticleRpcAvailable = true;
      return { ok: true, articleId: rpcId as string };
    }

    if (rpcError && isMissingRpc(rpcError)) {
      createArticleRpcAvailable = false;
    } else if (rpcError) {
      logCreateFailure({ userId: user.id, role: user.role, path: "rpc" }, rpcError);
      return { ok: false, message: userFacingCreateError(rpcError) };
    }
  }

  const row = buildArticleInsertRow(input, sourceSheet, nextRow);
  let service: SupabaseClient | null = null;

  const tryInsert = async (client: SupabaseClient) =>
    client.from("articles").insert(row).select("id").single();

  let { data: inserted, error: insertError } = await tryInsert(userClient);

  if (insertError?.code === "42501") {
    try {
      service = createServiceRoleClient();
      ({ data: inserted, error: insertError } = await tryInsert(service));
    } catch (e) {
      logCreateFailure({ userId: user.id, role: user.role, path: "service-role" }, insertError);
      return {
        ok: false,
        message:
          "Employee product creation requires catalogue migrations on Supabase. Ask an admin to apply migrations, or sign in as admin.",
      };
    }
  }

  if (insertError || !inserted?.id) {
    logCreateFailure({ userId: user.id, role: user.role, path: "insert" }, insertError);
    return { ok: false, message: userFacingCreateError(insertError) };
  }

  const articleId = inserted.id as string;

  if (!service) {
    try {
      service = createServiceRoleClient();
    } catch {
      service = null;
    }
  }

  void logCreateActivity(userClient, service, user.id, articleId, metadata);

  return { ok: true, articleId };
}
