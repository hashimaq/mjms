import "server-only";

import { appendActivityLogBestEffort } from "@/lib/catalogue/activity-log-server";
import { inferCategoryFromSheet, inferSeasonFromSheet } from "@/lib/catalogue/article-map";
import type { CategorySlug, SeasonSlug } from "@/lib/collections/config";
import type { SupabaseClient } from "@supabase/supabase-js";

const STORAGE_REMOVE_CHUNK = 100;

export type DeleteArticleResult =
  | {
      ok: true;
      projectName: string | null;
      season: SeasonSlug | null;
      category: CategorySlug | null;
    }
  | { ok: false; message: string };

export async function deleteArticleOnServer(
  supabase: SupabaseClient,
  articleId: string,
  deletedByUserId: string
): Promise<DeleteArticleResult> {
  const { data: article, error: articleError } = await supabase
    .from("articles")
    .select("id, project_raw, source_sheet")
    .eq("id", articleId)
    .maybeSingle();

  if (articleError || !article) {
    return { ok: false, message: "Product not found or already deleted." };
  }

  const season = inferSeasonFromSheet(article.source_sheet as string);
  const category = inferCategoryFromSheet(article.source_sheet as string);
  const projectName = (article.project_raw as string | null)?.trim() || null;

  const { data: imageRows, error: imagesError } = await supabase
    .from("article_images")
    .select("storage_path")
    .eq("article_id", articleId);

  if (imagesError) {
    console.error("[deleteArticle] load images", imagesError);
    return { ok: false, message: "Unable to prepare deletion." };
  }

  const storagePaths = [
    ...new Set(
      (imageRows ?? [])
        .map((r) => r.storage_path as string)
        .filter(Boolean)
    ),
  ];

  void appendActivityLogBestEffort(supabase, "DELETE_PRODUCT", "article", articleId, {
    project_name: projectName,
    deleted_by: deletedByUserId,
    photo_count: storagePaths.length,
  });

  const { error: deleteError } = await supabase.from("articles").delete().eq("id", articleId);

  if (deleteError) {
    console.error("[deleteArticle] delete row", deleteError);
    return { ok: false, message: "Unable to delete product." };
  }

  if (storagePaths.length > 0) {
    for (let i = 0; i < storagePaths.length; i += STORAGE_REMOVE_CHUNK) {
      const chunk = storagePaths.slice(i, i + STORAGE_REMOVE_CHUNK);
      const { error: storageError } = await supabase.storage.from("product-images").remove(chunk);
      if (storageError) {
        console.error("[deleteArticle] storage remove", {
          articleId,
          message: storageError.message,
          chunkSize: chunk.length,
        });
      }
    }
  }

  return { ok: true, projectName, season, category };
}
