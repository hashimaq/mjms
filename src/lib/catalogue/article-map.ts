import {
  getCategory,
  getSeason,
  type CategorySlug,
  type SeasonSlug,
} from "@/lib/collections/config";
import type { CatalogueProduct } from "./types";

export type ArticleCatalogueRow = {
  id: string;
  project_raw: string;
  source_no: string | null;
  source_sheet: string;
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

export function inferCategoryFromSheet(sheet: string): CategorySlug | null {
  if (sheet.endsWith(" DIP PVC")) return "dip-pvc";
  if (sheet.endsWith(" DIP PU")) return "dip-pu";
  if (sheet.endsWith(" HEEL")) return "heel";
  if (sheet.endsWith(" FLAT")) return "flat";
  if (sheet.endsWith(" PU")) return "pu";
  return null;
}

export function inferSeasonFromSheet(sheet: string): SeasonSlug | null {
  if (sheet.startsWith("WINTER")) return "winter";
  if (sheet.startsWith("SUMMER")) return "summer";
  return null;
}

export function mapArticleRowToProduct(
  row: ArticleCatalogueRow,
  visualIndex: number
): CatalogueProduct | null {
  const season = inferSeasonFromSheet(row.source_sheet);
  const category = inferCategoryFromSheet(row.source_sheet);
  if (!season || !category) return null;

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
