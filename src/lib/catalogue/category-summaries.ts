import {
  CATEGORIES,
  getCategorySourceSheet,
  type CategorySlug,
  type SeasonSlug,
} from "@/lib/collections/config";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getDemoSession } from "@/lib/auth/demo-session";
import { fetchCoverImageUrlsByArticleId } from "./images";
import type { CategoryPreviewSlot, CategorySummary } from "./types";

const PREVIEW_SLOT_COUNT = 4;

async function createSummaryReaderClient(): Promise<SupabaseClient | null> {
  if (await getDemoSession()) {
    return createServiceRoleClient();
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return supabase;
}

async function fetchLiveCategorySummary(
  supabase: SupabaseClient,
  season: SeasonSlug,
  category: CategorySlug
): Promise<CategorySummary> {
  const sourceSheet = getCategorySourceSheet(season, category);

  const { count, error: countError } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("source_sheet", sourceSheet);

  const productCount = countError ? null : count ?? 0;

  const { data: previewRows } = await supabase
    .from("articles")
    .select("id")
    .eq("source_sheet", sourceSheet)
    .order("project_raw", { ascending: true })
    .limit(PREVIEW_SLOT_COUNT);

  const ids = (previewRows ?? []).map((r) => r.id as string);
  const coverUrls = await fetchCoverImageUrlsByArticleId(supabase, ids);

  const previewSlots: CategoryPreviewSlot[] = Array.from({ length: PREVIEW_SLOT_COUNT }, (_, i) => {
    const articleId = ids[i];
    const imageUrl = articleId ? coverUrls.get(articleId) ?? null : null;
    return {
      imageUrl,
      visualIndex: i + 1,
    };
  });

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

export async function getSeasonCategorySummaries(season: SeasonSlug): Promise<CategorySummary[]> {
  const client = await createSummaryReaderClient();

  if (client) {
    try {
      const summaries = await Promise.all(
        CATEGORIES.map((cat) => fetchLiveCategorySummary(client, season, cat.slug))
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
