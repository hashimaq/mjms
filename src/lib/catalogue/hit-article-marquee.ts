import "server-only";

import { signStoragePathsForVariant } from "@/lib/catalogue/images";
import { createServiceRoleClient } from "@/lib/supabase/admin";

const HIT_ARTICLE_LIMIT = 16;

type ImageMeta = {
  article_id: string;
  storage_path: string;
  is_primary: boolean;
  image_order: number;
};

function pickRepresentativePath(rows: ImageMeta[]): string | null {
  if (rows.length === 0) return null;
  const sorted = [...rows].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return a.image_order - b.image_order;
  });
  return sorted[0]?.storage_path ?? null;
}

/**
 * Hit articles + one primary image each — two batched queries, one batched sign.
 * Returns signed URLs in stable article order (updated_at desc).
 */
export async function getHitArticleMarqueeImageUrls(): Promise<string[]> {
  const supabase = createServiceRoleClient();

  const { data: hitArticles, error: hitError } = await supabase
    .from("articles")
    .select("id")
    .eq("is_hit", true)
    .order("updated_at", { ascending: false })
    .limit(HIT_ARTICLE_LIMIT);

  if (hitError || !hitArticles?.length) {
    if (hitError) console.error("[hit-article-marquee] articles", hitError.message);
    return [];
  }

  const articleIds = hitArticles.map((a) => a.id as string);

  const { data: imageRows, error: imgError } = await supabase
    .from("article_images")
    .select("article_id, storage_path, is_primary, image_order")
    .in("article_id", articleIds);

  if (imgError) {
    console.error("[hit-article-marquee] images", imgError.message);
    return [];
  }

  const byArticle = new Map<string, ImageMeta[]>();
  for (const row of imageRows ?? []) {
    const aid = row.article_id as string;
    const list = byArticle.get(aid) ?? [];
    list.push(row as ImageMeta);
    byArticle.set(aid, list);
  }

  const paths: string[] = [];
  for (const id of articleIds) {
    const path = pickRepresentativePath(byArticle.get(id) ?? []);
    if (path) paths.push(path);
  }

  if (paths.length === 0) return [];

  const signed = await signStoragePathsForVariant(supabase, paths, "grid");
  return paths.map((p) => signed.get(p)).filter((u): u is string => Boolean(u));
}
