import { getDemoSession } from "@/lib/auth/demo-session";
import {
  getCategory,
  getCategorySourceSheet,
  getSeason,
  type CategorySlug,
  type SeasonSlug,
} from "@/lib/collections/config";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CatalogueProduct, CategoryCatalogueResult } from "./types";
import { CATALOGUE_PAGE_SIZE as PAGE_SIZE } from "./types";

export { CATALOGUE_PAGE_SIZE } from "./types";

type ArticleCatalogueRow = {
  id: string;
  project_raw: string;
  making_raw: string | null;
  making_normalized: string | null;
  type_raw: string | null;
  type_normalized: string | null;
  material_raw: string | null;
  colour_raw: string | null;
  size_range_raw: string | null;
};

function displayField(raw: string | null, normalized: string | null): string | null {
  const value = (normalized || raw)?.trim();
  return value || null;
}

function mapArticleToProduct(
  row: ArticleCatalogueRow,
  season: SeasonSlug,
  category: CategorySlug
): CatalogueProduct {
  const seasonDef = getSeason(season);
  const categoryDef = getCategory(category);
  const projectName = row.project_raw.trim() || "Untitled";

  return {
    id: row.id,
    slug: row.id,
    projectName,
    seasonSlug: season,
    seasonLabel: seasonDef.shortTitle,
    categorySlug: category,
    categoryLabel: categoryDef.label,
    making: displayField(row.making_raw, row.making_normalized),
    type: displayField(row.type_raw, row.type_normalized),
    material: row.material_raw?.trim() || null,
    colour: row.colour_raw?.trim() || null,
    sizeRange: row.size_range_raw?.trim() || null,
    imageUrl: null,
  };
}

async function fetchCategoryArticles(
  supabase: SupabaseClient,
  season: SeasonSlug,
  category: CategorySlug,
  page: number
): Promise<CategoryCatalogueResult> {
  const sourceSheet = getCategorySourceSheet(season, category);
  const pageSize = PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("articles")
    .select(
      "id, project_raw, making_raw, making_normalized, type_raw, type_normalized, material_raw, colour_raw, size_range_raw",
      { count: "exact" }
    )
    .eq("source_sheet", sourceSheet)
    .order("project_raw", { ascending: true })
    .range(from, to);

  if (error) {
    return { ok: false, message: "Unable to load the catalogue right now." };
  }

  const rows = (data ?? []) as ArticleCatalogueRow[];
  const products = rows.map((row) => mapArticleToProduct(row, season, category));

  return {
    ok: true,
    products,
    total: count ?? 0,
    page,
    pageSize,
  };
}

/**
 * Demo session or authenticated Supabase user (RLS). Public visitors: empty catalogue, no service-role bypass.
 */
async function createCatalogueReaderClient(): Promise<SupabaseClient | null> {
  if (await getDemoSession()) {
    return createServiceRoleClient();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return supabase;
}

export async function getCategoryCatalogue(
  season: SeasonSlug,
  category: CategorySlug,
  page: number
): Promise<CategoryCatalogueResult> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const client = await createCatalogueReaderClient();

  if (!client) {
    return {
      ok: true,
      products: [],
      total: 0,
      page: safePage,
      pageSize: PAGE_SIZE,
      publicPreviewOnly: true,
    };
  }

  try {
    return await fetchCategoryArticles(client, season, category, safePage);
  } catch {
    return { ok: false, message: "Unable to load the catalogue right now." };
  }
}
