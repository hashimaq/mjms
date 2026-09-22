import { getCatalogueReaderClient } from "@/lib/catalogue/catalogue-reader";
import {
  getCategory,
  getCategorySourceSheet,
  getSeason,
  type CategorySlug,
  type SeasonSlug,
} from "@/lib/collections/config";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildDemoCategoryProducts, findDemoProduct, isDemoCatalogueSlug } from "./demo-catalogue";
import { attachCollageToProducts } from "./attach-product-collage";
import { fetchGalleryMetaForArticle } from "./images";
import type {
  CatalogueProduct,
  CategoryCatalogueResult,
  ProductDetailResult,
} from "./types";
import { CATALOGUE_PAGE_SIZE as PAGE_SIZE } from "./types";
import { cache } from "react";

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
    collageImages: [],
    photoCount: 0,
    images: [],
    isDemo: false,
    visualIndex,
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
  await attachCollageToProducts(supabase, products);

  return {
    ok: true,
    products,
    total: count ?? 0,
    page,
    pageSize,
    dataSource: "live",
  };
}

export async function getCategoryCatalogue(
  season: SeasonSlug,
  category: CategorySlug,
  page: number
): Promise<CategoryCatalogueResult> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const client = await getCatalogueReaderClient();

  if (client) {
    try {
      const live = await fetchCategoryArticles(client, season, category, safePage);
      if (live.ok) {
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
  const gallery = await fetchGalleryMetaForArticle(supabase, id);
  product.galleryItems = gallery.items;
  product.photoCount = gallery.totalCount;
  product.images = [];
  product.collageImages = [];
  product.imageUrl = null;
  return product;
}

async function fetchLiveProductHeading(
  supabase: SupabaseClient,
  id: string
): Promise<{ projectName: string; seasonLabel: string; categoryLabel: string } | null> {
  const { data, error } = await supabase
    .from("articles")
    .select("project_raw, source_sheet")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as { project_raw: string; source_sheet: string };
  const season: SeasonSlug | null = row.source_sheet.startsWith("WINTER")
    ? "winter"
    : row.source_sheet.startsWith("SUMMER")
      ? "summer"
      : null;
  if (!season) return null;

  const category = inferCategoryFromSheet(row.source_sheet);
  if (!category) return null;

  const seasonConfig = getSeason(season);
  const categoryConfig = getCategory(category);

  return {
    projectName: row.project_raw.trim(),
    seasonLabel: seasonConfig.shortTitle,
    categoryLabel: categoryConfig.label,
  };
}

export async function getProductDetailHeading(
  slug: string
): Promise<{ title: string; description: string } | null> {
  if (!slug?.trim()) return null;

  if (isDemoCatalogueSlug(slug)) {
    const demo = findDemoProduct(slug);
    if (!demo) return null;
    return {
      title: `${demo.projectName} — MJMS Product Development`,
      description: `${demo.projectName} — ${demo.seasonLabel} ${demo.categoryLabel} product development catalogue.`,
    };
  }

  const client = await getCatalogueReaderClient();
  if (!client) return null;

  try {
    const heading = await fetchLiveProductHeading(client, slug);
    if (!heading) return null;
    return {
      title: `${heading.projectName} — MJMS Product Development`,
      description: `${heading.projectName} — ${heading.seasonLabel} ${heading.categoryLabel} product development catalogue.`,
    };
  } catch {
    return null;
  }
}

function inferCategoryFromSheet(sheet: string): CategorySlug | null {
  if (sheet.endsWith(" DIP PVC")) return "dip-pvc";
  if (sheet.endsWith(" DIP PU")) return "dip-pu";
  if (sheet.endsWith(" HEEL")) return "heel";
  if (sheet.endsWith(" FLAT")) return "flat";
  if (sheet.endsWith(" PU")) return "pu";
  return null;
}

export const getProductDetail = cache(async (slug: string): Promise<ProductDetailResult> => {
  if (!slug?.trim()) {
    return { ok: false, message: "Product not found." };
  }

  if (isDemoCatalogueSlug(slug)) {
    const demo = findDemoProduct(slug);
    return demo ? { ok: true, product: demo } : { ok: false, message: "Product not found." };
  }

  const client = await getCatalogueReaderClient();
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
});
