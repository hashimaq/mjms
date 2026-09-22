import type { CategorySlug, SeasonSlug } from "@/lib/collections/config";

export type CatalogueDataSource = "live" | "demo";

export type CatalogueProductImage = {
  id: string;
  url: string;
  isPrimary: boolean;
  width: number | null;
  height: number | null;
  alt: string;
};

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
  /** Primary/cover URL — same as first gallery image when images exist. */
  imageUrl: string | null;
  images: CatalogueProductImage[];
  isDemo: boolean;
  /** Visual index for placeholder composition (1-based). */
  visualIndex: number;
};

export type CategoryPreviewSlot = {
  imageUrl: string | null;
  visualIndex: number;
};

export type CategorySummary = {
  categorySlug: CategorySlug;
  /** Only set when loaded from the database with a positive count. */
  productCount: number | null;
  previewSlots: CategoryPreviewSlot[];
  dataSource: CatalogueDataSource;
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

export type CatalogueFilterFacets = {
  making: string[];
  type: string[];
  material: string[];
  colour: string[];
};

export type SearchCatalogueResult = CategoryCatalogueResult;

/** Lightweight row for search autocomplete (no images or full product payload). */
export type CatalogueSuggestion = {
  slug: string;
  projectName: string;
  articleReference: string | null;
};

export type CatalogueSuggestionsResult =
  | { ok: true; suggestions: CatalogueSuggestion[]; dataSource: CatalogueDataSource }
  | { ok: false; message: string };
