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
import { buildDemoCategoryProducts, findDemoProduct, isDemoCatalogueSlug } from "./demo-catalogue";
import {
  fetchCoverImageUrlsByArticleId,
  fetchGalleryImagesForArticle,
} from "./images";
import type {
  CatalogueProduct,
  CategoryCatalogueResult,
  ProductDetailResult,
} from "./types";
import { CATALOGUE_PAGE_SIZE as PAGE_SIZE } from "./types";

export { CATALOGUE_PAGE_SIZE } from "./types";

type ArticleCatalogueRow = {
  id: string;
  project_raw: string;
  source_no: string | null;
  making_raw: string | null;
  making_normalized: string | null;
  type_raw: string | null;
  type_normalized: string | null;
  material_raw: string | null;
  colour_raw: string | null;
  size_range_raw: string | null;
  qty_raw: string | null;
  remarks_raw: string | null;
};

function displayField(raw: string | null, normalized: string | null): string | null {
  const value = (normalized || raw)?.trim();
  return value || null;
}

function mapArticleToProduct(
  row: ArticleCatalogueRow,
  season: SeasonSlug,
  category: CategorySlug,
  visualIndex: number
): CatalogueProduct {
  const seasonDef = getSeason(season);
  const categoryDef = getCategory(category);
  const projectName = row.project_raw.trim() || "Untitled";

  return {
    id: row.id,
    slug: row.id,
    projectName,
    articleReference: row.source_no?.trim() || null,
    seasonSlug: season,
    seasonLabel: seasonDef.shortTitle,
    categorySlug: category,
    categoryLabel: categoryDef.label,
    making: displayField(row.making_raw, row.making_normalized),
    type: displayField(row.type_raw, row.type_normalized),
    material: row.material_raw?.trim() || null,
    colour: row.colour_raw?.trim() || null,
    sizeRange: row.size_range_raw?.trim() || null,
    qty: row.qty_raw?.trim() || null,
    remarks: row.remarks_raw?.trim() || null,
    imageUrl: null,
    images: [],
    isDemo: false,
    visualIndex,
  };
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
      "id, project_raw, source_no, making_raw, making_normalized, type_raw, type_normalized, material_raw, colour_raw, size_range_raw, qty_raw, remarks_raw",
      { count: "exact" }
    )
    .eq("source_sheet", sourceSheet)
    .order("project_raw", { ascending: true })
    .range(from, to);

  if (error) {
    return { ok: false, message: "Unable to load the catalogue right now." };
  }

  const rows = (data ?? []) as ArticleCatalogueRow[];
  const products = rows.map((row, i) => mapArticleToProduct(row, season, category, from + i + 1));
  await attachCoverImagesToProducts(supabase, products);

  return {
    ok: true,
    products,
    total: count ?? 0,
    page,
    pageSize,
    dataSource: "live",
  };
}

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

export async function getCategoryCatalogue(
  season: SeasonSlug,
  category: CategorySlug,
  page: number
): Promise<CategoryCatalogueResult> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const client = await createCatalogueReaderClient();

  if (client) {
    try {
      const live = await fetchCategoryArticles(client, season, category, safePage);
      if (live.ok && live.total > 0) {
        return live;
      }
    } catch {
      return { ok: false, message: "Unable to load the catalogue right now." };
    }
  }

  const demo = buildDemoCategoryProducts(season, category, safePage);
  return {
    ok: true,
    products: demo.products,
    total: demo.total,
    page: safePage,
    pageSize: PAGE_SIZE,
    dataSource: "demo",
  };
}

async function fetchLiveProductById(
  supabase: SupabaseClient,
  id: string
): Promise<CatalogueProduct | null> {
  const { data, error } = await supabase
    .from("articles")
    .select(
      "id, project_raw, source_no, source_sheet, making_raw, making_normalized, type_raw, type_normalized, material_raw, colour_raw, size_range_raw, qty_raw, remarks_raw"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as ArticleCatalogueRow & { source_sheet: string };
  const season: SeasonSlug | null = row.source_sheet.startsWith("WINTER") ? "winter" : row.source_sheet.startsWith("SUMMER") ? "summer" : null;
  if (!season) return null;

  const category = inferCategoryFromSheet(row.source_sheet);
  if (!category) return null;

  const product = mapArticleToProduct(row, season, category, 1);
  const altBase = `${product.projectName} — ${product.seasonLabel} ${product.categoryLabel}`;
  const images = await fetchGalleryImagesForArticle(supabase, id, altBase);
  product.images = images;
  product.imageUrl = images[0]?.url ?? null;
  return product;
}

function inferCategoryFromSheet(sheet: string): CategorySlug | null {
  if (sheet.endsWith(" DIP PVC")) return "dip-pvc";
  if (sheet.endsWith(" DIP PU")) return "dip-pu";
  if (sheet.endsWith(" HEEL")) return "heel";
  if (sheet.endsWith(" FLAT")) return "flat";
  if (sheet.endsWith(" PU")) return "pu";
  return null;
}

export async function getProductDetail(slug: string): Promise<ProductDetailResult> {
  if (!slug?.trim()) {
    return { ok: false, message: "Product not found." };
  }

  if (isDemoCatalogueSlug(slug)) {
    const demo = findDemoProduct(slug);
    return demo ? { ok: true, product: demo } : { ok: false, message: "Product not found." };
  }

  const client = await createCatalogueReaderClient();
  if (!client) {
    return { ok: false, message: "Product not found." };
  }

  try {
    const product = await fetchLiveProductById(client, slug);
    if (!product) {
      return { ok: false, message: "Product not found." };
    }
    return { ok: true, product };
  } catch {
    return { ok: false, message: "Unable to load this product." };
  }
}
