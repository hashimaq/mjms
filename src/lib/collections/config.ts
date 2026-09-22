/**
 * Public catalogue navigation — maps UI slugs to internal article/source_sheet identity.
 * Project names and article fields in the DB are unchanged; this layer is routing + labels only.
 */

export type SeasonSlug = "winter" | "summer";

export type CategorySlug = "heel" | "flat" | "pu" | "dip-pu" | "dip-pvc";

export type SeasonDefinition = {
  slug: SeasonSlug;
  title: string;
  shortTitle: string;
  description: string;
  /** Accent for cards / category nav (CSS modifier) */
  accent: "winter" | "summer";
};

export type CategoryDefinition = {
  slug: CategorySlug;
  label: string;
  description: string;
  /** Matches articles.source_sheet for imported Excel rows (Day 4 queries). */
  sourceSheetForSeason: (season: SeasonSlug) => string;
};

const SEASON_PREFIX: Record<SeasonSlug, "WINTER" | "SUMMER"> = {
  winter: "WINTER",
  summer: "SUMMER",
};

export const SEASONS: Record<SeasonSlug, SeasonDefinition> = {
  winter: {
    slug: "winter",
    title: "Winter Collection",
    shortTitle: "Winter",
    description:
      "Cold-weather footwear lines — browse by category to explore styles and development records.",
    accent: "winter",
  },
  summer: {
    slug: "summer",
    title: "Summer Collection",
    shortTitle: "Summer",
    description:
      "Warm-season footwear lines — browse by category to explore styles and development records.",
    accent: "summer",
  },
};

export const CATEGORIES: CategoryDefinition[] = [
  {
    slug: "heel",
    label: "Heel",
    description: "Heel silhouettes, heights, and heel-line product development.",
    sourceSheetForSeason: (s) => `${SEASON_PREFIX[s]} HEEL`,
  },
  {
    slug: "flat",
    label: "Flat",
    description: "Flat profiles and everyday silhouettes for the season.",
    sourceSheetForSeason: (s) => `${SEASON_PREFIX[s]} FLAT`,
  },
  {
    slug: "pu",
    label: "PU",
    description: "PU constructions and related mould development.",
    sourceSheetForSeason: (s) => `${SEASON_PREFIX[s]} PU`,
  },
  {
    slug: "dip-pu",
    label: "Dip PU",
    description: "Dip PU category styles and development records.",
    sourceSheetForSeason: (s) => `${SEASON_PREFIX[s]} DIP PU`,
  },
  {
    slug: "dip-pvc",
    label: "Dip PVC",
    description: "Dip PVC category styles and development records.",
    sourceSheetForSeason: (s) => `${SEASON_PREFIX[s]} DIP PVC`,
  },
];

export const SEASON_SLUGS = Object.keys(SEASONS) as SeasonSlug[];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

export function isSeasonSlug(value: string): value is SeasonSlug {
  return value in SEASONS;
}

export function isCategorySlug(value: string): value is CategorySlug {
  return CATEGORIES.some((c) => c.slug === value);
}

export function getSeason(slug: SeasonSlug): SeasonDefinition {
  return SEASONS[slug];
}

export function getCategory(slug: CategorySlug): CategoryDefinition {
  const cat = CATEGORIES.find((c) => c.slug === slug);
  if (!cat) throw new Error(`Unknown category: ${slug}`);
  return cat;
}

export function collectionPath(season: SeasonSlug): string {
  return `/collections/${season}`;
}

export function categoryPath(season: SeasonSlug, category: CategorySlug): string {
  return `/collections/${season}/${category}`;
}

export function adminCategoryPath(season: SeasonSlug, category: CategorySlug): string {
  return `/admin/catalogue/${season}/${category}`;
}

export function employeeCategoryPath(season: SeasonSlug, category: CategorySlug): string {
  return `/employee/catalogue/${season}/${category}`;
}

/** For Day 4 — targeted filter on articles.source_sheet (no full catalogue rebuild). */
export function getCategorySourceSheet(
  season: SeasonSlug,
  category: CategorySlug
): string {
  return getCategory(category).sourceSheetForSeason(season);
}
