import { getDemoSession } from "@/lib/auth/demo-session";
import {
  CATEGORIES,
  getCategorySourceSheet,
  SEASON_SLUGS,
  type CategorySlug,
  type SeasonSlug,
} from "@/lib/collections/config";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mapArticleRowToProduct, type ArticleCatalogueRow } from "./article-map";
import { searchDemoCatalogue, getDemoFilterFacets } from "./demo-catalogue";
import { fetchCoverImageUrlsByArticleId } from "./images";
import type { CatalogueSearchParams } from "./search-params";
import type {
  CatalogueFilterFacets,
  CatalogueProduct,
  SearchCatalogueResult,
} from "./types";
import { CATALOGUE_PAGE_SIZE as PAGE_SIZE } from "./types";

const LIST_SELECT =
  "id, project_raw, source_no, source_sheet, making_raw, making_normalized, type_raw, type_normalized, material_raw, colour_raw, size_range_raw, qty_raw, remarks_raw";

async function createCatalogueReaderClient(): Promise<SupabaseClient | null> {
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

function resolveSourceSheets(
  season?: SeasonSlug,
  category?: CategorySlug
): string[] | null {
  if (season && category) {
    return [getCategorySourceSheet(season, category)];
  }
  if (season) {
    return CATEGORIES.map((c) => getCategorySourceSheet(season, c.slug));
  }
  if (category) {
    return SEASON_SLUGS.map((s) => getCategorySourceSheet(s, category));
  }
  return null;
}

async function attachCoverImagesToProducts(
  supabase: SupabaseClient,
  products: CatalogueProduct[]
): Promise<void> {
  const ids = products.filter((p) => !p.isDemo).map((p) => p.id);
  const covers = await fetchCoverImageUrlsByArticleId(supabase, ids);
  for (const product of products) {
    const url = covers.get(product.id);
    if (url) {
      product.imageUrl = url;
      product.images = [
        {
          id: `${product.id}-cover`,
          url,
          isPrimary: true,
          width: null,
          height: null,
          alt: `${product.projectName} — ${product.seasonLabel} ${product.categoryLabel}`,
        },
      ];
    }
  }
}

async function searchLiveCatalogue(
  supabase: SupabaseClient,
  params: CatalogueSearchParams
): Promise<SearchCatalogueResult> {
  const pageSize = PAGE_SIZE;
  const from = (params.page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("articles").select(LIST_SELECT, { count: "exact" });

  const sheets = resolveSourceSheets(params.season, params.category);
  if (sheets?.length === 1) {
    query = query.eq("source_sheet", sheets[0]!);
  } else if (sheets && sheets.length > 0) {
    query = query.in("source_sheet", sheets);
  }

  if (params.q) {
    const term = params.q.trim().replace(/[%_]/g, "\\$&");
    query = query.or(`project_raw.ilike.%${term}%,source_no.ilike.%${term}%`);
  }

  if (params.making) {
    query = query.or(
      `making_normalized.eq.${params.making},making_raw.eq.${params.making}`
    );
  }
  if (params.type) {
    query = query.or(`type_normalized.eq.${params.type},type_raw.eq.${params.type}`);
  }
  if (params.material) {
    query = query.eq("material_raw", params.material);
  }
  if (params.colour) {
    query = query.eq("colour_raw", params.colour);
  }

  const { data, error, count } = await query
    .order("project_raw", { ascending: true })
    .range(from, to);

  if (error) {
    return { ok: false, message: "Unable to load catalogue" };
  }

  const rows = (data ?? []) as ArticleCatalogueRow[];
  const products: CatalogueProduct[] = [];
  rows.forEach((row, i) => {
    const product = mapArticleRowToProduct(row, from + i + 1);
    if (product) products.push(product);
  });

  await attachCoverImagesToProducts(supabase, products);

  return {
    ok: true,
    products,
    total: count ?? 0,
    page: params.page,
    pageSize,
    dataSource: "live",
  };
}

function uniqueSorted(values: (string | null | undefined)[]): string[] {
  const set = new Set<string>();
  for (const v of values) {
    const t = v?.trim();
    if (t) set.add(t);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

async function fetchLiveFilterFacets(supabase: SupabaseClient): Promise<CatalogueFilterFacets> {
  const { data, error } = await supabase
    .from("articles")
    .select("making_raw, making_normalized, type_raw, type_normalized, material_raw, colour_raw")
    .limit(2000);

  if (error || !data) {
    return { making: [], type: [], material: [], colour: [] };
  }

  type Row = {
    making_raw: string | null;
    making_normalized: string | null;
    type_raw: string | null;
    type_normalized: string | null;
    material_raw: string | null;
    colour_raw: string | null;
  };

  const rows = data as Row[];
  return {
    making: uniqueSorted(rows.flatMap((r) => [r.making_normalized, r.making_raw])),
    type: uniqueSorted(rows.flatMap((r) => [r.type_normalized, r.type_raw])),
    material: uniqueSorted(rows.map((r) => r.material_raw)),
    colour: uniqueSorted(rows.map((r) => r.colour_raw)),
  };
}

export async function searchCatalogue(params: CatalogueSearchParams): Promise<SearchCatalogueResult> {
  const client = await createCatalogueReaderClient();

  if (client) {
    try {
      return await searchLiveCatalogue(client, params);
    } catch {
      return { ok: false, message: "Unable to load catalogue" };
    }
  }

  return searchDemoCatalogue(params);
}

export async function getCatalogueFilterFacets(): Promise<{
  facets: CatalogueFilterFacets;
  dataSource: "live" | "demo";
}> {
  const client = await createCatalogueReaderClient();
  if (client) {
    try {
      const facets = await fetchLiveFilterFacets(client);
      const hasValues =
        facets.making.length > 0 ||
        facets.type.length > 0 ||
        facets.material.length > 0 ||
        facets.colour.length > 0;
      if (hasValues) {
        return { facets, dataSource: "live" };
      }
    } catch {
      /* demo fallback */
    }
  }
  return { facets: getDemoFilterFacets(), dataSource: "demo" };
}
