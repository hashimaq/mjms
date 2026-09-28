import type { SupabaseClient } from "@supabase/supabase-js";

/** Accurate max order + primary flag without scanning all image rows. */
export async function loadArticleImageOrderMeta(
  supabase: SupabaseClient,
  articleId: string
): Promise<{ maxOrder: number; hasPrimary: boolean }> {
  const [maxRes, primaryRes] = await Promise.all([
    supabase
      .from("article_images")
      .select("image_order")
      .eq("article_id", articleId)
      .order("image_order", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("article_images")
      .select("id")
      .eq("article_id", articleId)
      .eq("is_primary", true)
      .limit(1)
      .maybeSingle(),
  ]);

  const maxOrder =
    maxRes.error || maxRes.data?.image_order == null
      ? 0
      : Number(maxRes.data.image_order);

  return {
    maxOrder: Number.isFinite(maxOrder) ? maxOrder : 0,
    hasPrimary: !primaryRes.error && !!primaryRes.data,
  };
}
