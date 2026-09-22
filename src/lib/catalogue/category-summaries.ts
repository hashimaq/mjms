import {
  CATEGORIES,
  getCategorySourceSheet,
  type CategorySlug,
  type SeasonSlug,
} from "@/lib/collections/config";
import { getCatalogueReaderClient } from "@/lib/catalogue/catalogue-reader";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchCoverImageUrlsByArticleId } from "./images";
import type { CategoryPreviewSlot, CategorySummary } from "./types";

const PREVIEW_SLOT_COUNT = 4;

export type CategorySummaryOptions = {
  /** Skip signed URL work on folder cards (workspace routes). Public catalogue may enable. */
  includePreviewImages?: boolean;
};

async function fetchLiveCategorySummary(
  supabase: SupabaseClient,
  season: SeasonSlug,
  category: CategorySlug,
  options?: CategorySummaryOptions
): Promise<CategorySummary> {
  const sourceSheet = getCategorySourceSheet(season, category);

  const { count, error: countError } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("source_sheet", sourceSheet);

  const productCount = countError ? null : count ?? 0;

  let previewSlots: CategoryPreviewSlot[];

  if (options?.includePreviewImages === false) {
    previewSlots = Array.from({ length: PREVIEW_SLOT_COUNT }, (_, i) => ({
      imageUrl: null,
      visualIndex: i + 1,
    }));
  } else {
    const { data: previewRows } = await supabase
      .from("articles")
      .select("id")
      .eq("source_sheet", sourceSheet)
      .order("project_raw", { ascending: true })
      .limit(PREVIEW_SLOT_COUNT);

    const ids = (previewRows ?? []).map((r) => r.id as string);
    const coverUrls = await fetchCoverImageUrlsByArticleId(supabase, ids);

    previewSlots = Array.from({ length: PREVIEW_SLOT_COUNT }, (_, i) => {
      const articleId = ids[i];
      const imageUrl = articleId ? coverUrls.get(articleId) ?? null : null;
      return {
        imageUrl,
        visualIndex: i + 1,
      };
    });
  }

  return {
    categorySlug: category,
    productCount: productCount && productCount > 0 ? productCount : null,
    previewSlots,
    dataSource: "live",
  };
}

function buildDemoCategorySummary(category: CategorySlug): CategorySummary {
  return {
    categorySlug: category,
    productCount: null,
    previewSlots: Array.from({ length: PREVIEW_SLOT_COUNT }, (_, i) => ({
      imageUrl: null,
      visualIndex: i + 1,
    })),
    dataSource: "demo",
  };
}

export async function getSeasonCategorySummaries(
  season: SeasonSlug,
  options?: CategorySummaryOptions
): Promise<CategorySummary[]> {
  const client = await getCatalogueReaderClient();

  if (client) {
    try {
      const summaries = await Promise.all(
        CATEGORIES.map((cat) => fetchLiveCategorySummary(client, season, cat.slug, options))
      );
      const hasLive = summaries.some((s) => s.productCount != null && s.productCount > 0);
      if (hasLive) {
        return summaries;
      }
    } catch {
      /* fall through to demo previews */
    }
  }

  return CATEGORIES.map((cat) => buildDemoCategorySummary(cat.slug));
}
