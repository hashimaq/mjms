import type { CategorySlug, SeasonSlug } from "@/lib/collections/config";

/** Public catalogue row — article id is canonical; project name is display, not unique key. */
export type CatalogueProduct = {
  id: string;
  /** Route segment for Day 6 detail (article UUID). */
  slug: string;
  projectName: string;
  seasonSlug: SeasonSlug;
  seasonLabel: string;
  categorySlug: CategorySlug;
  categoryLabel: string;
  making: string | null;
  type: string | null;
  material: string | null;
  colour: string | null;
  sizeRange: string | null;
  /**
   * Reserved for official MJMS HD assets. Day 4: always null — no images fetched or rendered.
   */
  imageUrl: string | null;
};

export type CategoryCatalogueSuccess = {
  ok: true;
  products: CatalogueProduct[];
  total: number;
  page: number;
  pageSize: number;
  /** True when public visitor has no catalogue read access (RLS); UI shows empty state. */
  publicPreviewOnly?: boolean;
};

export type CategoryCatalogueFailure = {
  ok: false;
  message: string;
};

export type CategoryCatalogueResult = CategoryCatalogueSuccess | CategoryCatalogueFailure;

export const CATALOGUE_PAGE_SIZE = 24;
