import type { SupabaseClient } from "@supabase/supabase-js";
import type { CatalogueProductImage } from "./types";

const SIGNED_URL_TTL = 3600;
const ARTICLE_CHUNK = 200;

type ImageRow = {
  id: string;
  article_id: string;
  storage_path: string;
  is_primary: boolean;
  image_order: number;
  width: number | null;
  height: number | null;
};

export async function signStoragePaths(
  supabase: SupabaseClient,
  paths: string[]
): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter(Boolean))];
  const map = new Map<string, string>();
  if (unique.length === 0) return map;

  const { data, error } = await supabase.storage
    .from("product-images")
    .createSignedUrls(unique, SIGNED_URL_TTL);

  if (error || !data) return map;

  for (const item of data) {
    if (item.path && item.signedUrl) {
      map.set(item.path, item.signedUrl);
    }
  }
  return map;
}

/** One cover URL per article (primary first, else lowest image_order). */
export async function fetchCoverImageUrlsByArticleId(
  supabase: SupabaseClient,
  articleIds: string[]
): Promise<Map<string, string>> {
  const coverPathByArticle = new Map<string, string>();
  if (articleIds.length === 0) return new Map();

  for (let i = 0; i < articleIds.length; i += ARTICLE_CHUNK) {
    const chunk = articleIds.slice(i, i + ARTICLE_CHUNK);
    const { data, error } = await supabase
      .from("article_images")
      .select("article_id, storage_path, is_primary, image_order")
      .in("article_id", chunk);

    if (error || !data) continue;

    const rows = data as Pick<ImageRow, "article_id" | "storage_path" | "is_primary" | "image_order">[];
    const grouped = new Map<string, typeof rows>();
    for (const row of rows) {
      const list = grouped.get(row.article_id) ?? [];
      list.push(row);
      grouped.set(row.article_id, list);
    }

    for (const [articleId, list] of grouped) {
      list.sort((a, b) => {
        if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
        return a.image_order - b.image_order;
      });
      const best = list[0];
      if (best?.storage_path) {
        coverPathByArticle.set(articleId, best.storage_path);
      }
    }
  }

  const signed = await signStoragePaths(supabase, [...coverPathByArticle.values()]);
  const urlByArticle = new Map<string, string>();
  for (const [articleId, path] of coverPathByArticle) {
    const url = signed.get(path);
    if (url) urlByArticle.set(articleId, url);
  }
  return urlByArticle;
}

export async function fetchGalleryImagesForArticle(
  supabase: SupabaseClient,
  articleId: string,
  altBase: string
): Promise<CatalogueProductImage[]> {
  const { data, error } = await supabase
    .from("article_images")
    .select("id, storage_path, is_primary, image_order, width, height")
    .eq("article_id", articleId)
    .order("is_primary", { ascending: false })
    .order("image_order", { ascending: true });

  if (error || !data?.length) return [];

  const rows = data as ImageRow[];
  const signed = await signStoragePaths(
    supabase,
    rows.map((r) => r.storage_path)
  );

  return rows
    .map((row) => {
      const url = signed.get(row.storage_path);
      if (!url) return null;
      return {
        id: row.id,
        url,
        isPrimary: row.is_primary,
        width: row.width,
        height: row.height,
        alt: altBase,
      };
    })
    .filter((img): img is CatalogueProductImage => img !== null);
}
