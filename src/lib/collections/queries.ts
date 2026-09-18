import type { SupabaseClient } from "@supabase/supabase-js";
import type { CategorySlug, SeasonSlug } from "./config";
import { getCategorySourceSheet } from "./config";

/**
 * Count articles in one season + category (single indexed filter on source_sheet).
 * Use with service role or future public read policy — not called from public pages until Day 4.
 */
export async function countArticlesInCategory(
  supabase: SupabaseClient,
  season: SeasonSlug,
  category: CategorySlug
): Promise<number> {
  const sourceSheet = getCategorySourceSheet(season, category);

  const { count, error } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("source_sheet", sourceSheet);

  if (error) throw error;
  return count ?? 0;
}
