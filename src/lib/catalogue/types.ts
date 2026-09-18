import type { CategorySlug, SeasonSlug } from "@/lib/collections/config";

export type CatalogueDataSource = "live" | "demo";

/** Public catalogue row — article id is canonical; project name is display, not unique key. */
export type CatalogueProduct = {
  id: string;
  slug: string;
  projectName: string;
  articleReference: string | null;
  seasonSlug: SeasonSlug;
  seasonLabel: string;
  categorySlug: CategorySlug;
  categoryLabel: string;
  making: string | null;
  type: string | null;
  material: string | null;
  colour: string | null;
  sizeRange: string | null;
  qty: string | null;
  remarks: string | null;
  /** Official HD asset URL when available; Day 4: always null. */
  imageUrl: string | null;
  isDemo: boolean;
  /** Visual index for placeholder composition (1-based). */
  visualIndex: number;
};

export type CategoryCatalogueSuccess = {
  ok: true;
  products: CatalogueProduct[];
  total: number;
  page: number;
  pageSize: number;
  dataSource: CatalogueDataSource;
};

export type CategoryCatalogueFailure = {
  ok: false;
  message: string;
};

export type CategoryCatalogueResult = CategoryCatalogueSuccess | CategoryCatalogueFailure;

export const CATALOGUE_PAGE_SIZE = 24;

export type ProductDetailResult =
  | { ok: true; product: CatalogueProduct }
  | { ok: false; message: string };
