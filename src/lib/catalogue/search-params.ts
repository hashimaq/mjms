import {
  isCategorySlug,
  isSeasonSlug,
  type CategorySlug,
  type SeasonSlug,
} from "@/lib/collections/config";

export type CatalogueSearchParams = {
  q: string;
  season?: SeasonSlug;
  category?: CategorySlug;
  making?: string;
  type?: string;
  material?: string;
  colour?: string;
  page: number;
};

function readParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parseCatalogueSearchParams(
  raw: Record<string, string | string[] | undefined>
): CatalogueSearchParams {
  const pageRaw = Number(readParam(raw.page));
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  const seasonVal = readParam(raw.season);
  const categoryVal = readParam(raw.category);

  return {
    q: readParam(raw.q)?.trim() ?? "",
    season: seasonVal && isSeasonSlug(seasonVal) ? seasonVal : undefined,
    category: categoryVal && isCategorySlug(categoryVal) ? categoryVal : undefined,
    making: readParam(raw.making)?.trim() || undefined,
    type: readParam(raw.type)?.trim() || undefined,
    material: readParam(raw.material)?.trim() || undefined,
    colour: readParam(raw.colour)?.trim() || undefined,
    page,
  };
}

export function hasActiveSearchCriteria(params: CatalogueSearchParams): boolean {
  return (
    params.q.length > 0 ||
    Boolean(params.season) ||
    Boolean(params.category) ||
    Boolean(params.making) ||
    Boolean(params.type) ||
    Boolean(params.material) ||
    Boolean(params.colour)
  );
}

export type BuildCatalogueHrefOptions = {
  omitSeason?: boolean;
  omitCategory?: boolean;
};

export function buildCatalogueHref(
  basePath: string,
  params: CatalogueSearchParams,
  options?: BuildCatalogueHrefOptions
): string {
  const sp = new URLSearchParams();

  if (params.q) sp.set("q", params.q);
  if (!options?.omitSeason && params.season) sp.set("season", params.season);
  if (!options?.omitCategory && params.category) sp.set("category", params.category);
  if (params.making) sp.set("making", params.making);
  if (params.type) sp.set("type", params.type);
  if (params.material) sp.set("material", params.material);
  if (params.colour) sp.set("colour", params.colour);
  if (params.page > 1) sp.set("page", String(params.page));

  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function buildSearchHref(params: CatalogueSearchParams): string {
  return buildCatalogueHref("/search", params);
}

/** Whether the user has applied search text or filters beyond fixed route context. */
export function hasRefinementCriteria(
  params: CatalogueSearchParams,
  context?: { lockedSeason?: SeasonSlug; lockedCategory?: CategorySlug }
): boolean {
  if (params.q.length > 0) return true;
  if (params.making || params.type || params.material || params.colour) return true;

  if (!context?.lockedCategory && params.category) return true;
  if (!context?.lockedSeason && params.season) return true;

  return false;
}
