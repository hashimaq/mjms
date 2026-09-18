/**
 * Isolated demonstration catalogue — replaceable when live public reads + HD images exist.
 * Names are structural only (not real MJMS production project names).
 */

import {
  getCategory,
  getSeason,
  type CategorySlug,
  type SeasonSlug,
} from "@/lib/collections/config";
import type { CatalogueProduct } from "./types";
import { CATALOGUE_PAGE_SIZE } from "./types";

const DEMO_PER_CATEGORY = 8;

const DEMO_META_ROTATION = [
  { making: "CONVEYOR", type: "SANDAL", material: "PU", colour: "BLACK", sizeRange: "36–41", qty: "Proto", remarks: "Development sheet — layout reference." },
  { making: "INJECTION", type: "BOOT", material: "PVC", colour: "TAN", sizeRange: "37–42", qty: "1 pair", remarks: "Mould review pending final asset." },
  { making: "ASSEMBLY", type: "MULE", material: "TEXTILE / PU", colour: "NAVY", sizeRange: "38–43", qty: "Sample", remarks: "Colourway exploration." },
  { making: "CONVEYOR", type: "SLIPPER", material: "PU", colour: "BURGUNDY", sizeRange: "36–41", qty: "Proto", remarks: "Category board reference." },
  { making: "INJECTION", type: "SANDAL", material: "PU", colour: "WHITE", sizeRange: "37–42", qty: "1 pair", remarks: "Technical specification draft." },
  { making: "ASSEMBLY", type: "BOOT", material: "PVC", colour: "BLACK", sizeRange: "38–43", qty: "Sample", remarks: "Seasonal line placeholder." },
  { making: "CONVEYOR", type: "MULE", material: "PU", colour: "TAN", sizeRange: "36–41", qty: "Proto", remarks: "Awaiting HD product visual." },
  { making: "INJECTION", type: "SLIPPER", material: "TEXTILE / PU", colour: "NAVY", sizeRange: "37–42", qty: "1 pair", remarks: "Internal development record." },
] as const;

function demoSlug(season: SeasonSlug, category: CategorySlug, index: number): string {
  return `demo-${season}-${category}-${index}`;
}

export function buildDemoCategoryProducts(
  season: SeasonSlug,
  category: CategorySlug,
  page: number
): { products: CatalogueProduct[]; total: number } {
  const seasonDef = getSeason(season);
  const categoryDef = getCategory(category);
  const all: CatalogueProduct[] = [];

  for (let i = 1; i <= DEMO_PER_CATEGORY; i++) {
    const meta = DEMO_META_ROTATION[(i - 1) % DEMO_META_ROTATION.length];
    const slug = demoSlug(season, category, i);
    all.push({
      id: slug,
      slug,
      projectName: `Development Reference ${String(i).padStart(2, "0")}`,
      articleReference: `MJMS-DR-${season === "winter" ? "W" : "S"}-${category.toUpperCase().replace(/-/g, "")}-${String(i).padStart(2, "0")}`,
      seasonSlug: season,
      seasonLabel: seasonDef.shortTitle,
      categorySlug: category,
      categoryLabel: categoryDef.label,
      making: meta.making,
      type: meta.type,
      material: meta.material,
      colour: meta.colour,
      sizeRange: meta.sizeRange,
      qty: meta.qty,
      remarks: meta.remarks,
      imageUrl: null,
      images: [],
      isDemo: true,
      visualIndex: i,
    });
  }

  const start = (page - 1) * CATALOGUE_PAGE_SIZE;
  return {
    products: all.slice(start, start + CATALOGUE_PAGE_SIZE),
    total: all.length,
  };
}

export function findDemoProduct(slug: string): CatalogueProduct | null {
  const match = /^demo-(winter|summer)-(dip-pvc|dip-pu|heel|flat|pu)-(\d+)$/.exec(slug);
  if (!match) return null;
  const [, season, category, indexStr] = match;
  const index = Number(indexStr);
  if (!Number.isFinite(index) || index < 1 || index > DEMO_PER_CATEGORY) return null;

  const { products } = buildDemoCategoryProducts(
    season as SeasonSlug,
    category as CategorySlug,
    1
  );
  return products.find((p) => p.slug === slug) ?? null;
}

export function isDemoCatalogueSlug(slug: string): boolean {
  return slug.startsWith("demo-");
}
