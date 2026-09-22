import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  signStoragePathsForVariant,
  type CatalogueImageVariant,
} from "@/lib/catalogue/images";

const PRODUCT_IMAGE_PATH =
  /^products\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9]{2}\.[A-Za-z0-9]+$/;

export function isValidProductImageStoragePath(path: string): boolean {
  return PRODUCT_IMAGE_PATH.test(path);
}

/**
 * Sign only storage paths that belong to the given article (prevents arbitrary path signing).
 */
export async function signVerifiedArticleImagePaths(
  supabase: SupabaseClient,
  articleId: string,
  requestedPaths: string[],
  variant: CatalogueImageVariant
): Promise<Record<string, string>> {
  const paths = [...new Set(requestedPaths.filter(isValidProductImageStoragePath))];
  if (paths.length === 0) return {};

  const { data, error } = await supabase
    .from("article_images")
    .select("storage_path")
    .eq("article_id", articleId)
    .in("storage_path", paths);

  if (error || !data?.length) return {};

  const allowed = data.map((row) => row.storage_path as string);
  const signed = await signStoragePathsForVariant(supabase, allowed, variant);
  const out: Record<string, string> = {};
  for (const path of allowed) {
    const url = signed.get(path);
    if (url) out[path] = url;
  }
  return out;
}
