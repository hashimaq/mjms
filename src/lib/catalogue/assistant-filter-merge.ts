import type { AssistantContextFilters } from "@/lib/catalogue/assistant-context";
import type { CatalogueSearchParams } from "@/lib/catalogue/search-params";
import { hasActiveSearchCriteria } from "@/lib/catalogue/search-params";

export type SearchIntent = "refinement" | "new_search";

const REFINEMENT_CUE_RE =
  /\b(ab|aur|sirf|same|bas|only|bhi|instead|winter wali|red wali|black wali)\b|\b(wali|wale)\b|\bbut\b/i;

const NEW_SEARCH_CUE_RE =
  /\b(products?|items?|catalogue)\b.*\b(dikhao|show|find|list)\b|\b(dikhao|show|find)\b.*\b(products?|items?)\b|\b(mujhe|show me|find)\s+.+\b(summer|winter)\b.+\b(pu|heel|flat|dip)\b/i;

const STANDALONE_BROWSE_RE =
  /^(mujhe\s+)?(summer|winter)\s+(pu|heel|flat|dip[- ]?pu|dip[- ]?pvc)\b/i;

export function contextFiltersToSearchParams(
  filters: AssistantContextFilters | null
): CatalogueSearchParams | null {
  if (!filters) return null;
  const params: CatalogueSearchParams = {
    q: filters.q ?? "",
    season: filters.season ?? undefined,
    category: filters.category ?? undefined,
    making: filters.making ?? undefined,
    type: filters.type ?? undefined,
    material: filters.material ?? undefined,
    colour: filters.colour ?? undefined,
    page: 1,
  };
  return hasActiveSearchCriteria(params) ? params : null;
}

function countStructuredFilters(params: CatalogueSearchParams): number {
  let n = 0;
  if (params.season) n++;
  if (params.category) n++;
  if (params.making) n++;
  if (params.type) n++;
  if (params.material) n++;
  if (params.colour) n++;
  if (params.q.trim()) n++;
  return n;
}

function parseGeminiSearchIntent(raw: string | undefined): SearchIntent | null {
  const value = raw?.trim().toLowerCase();
  if (value === "refinement") return "refinement";
  if (value === "new_search") return "new_search";
  return null;
}

/** Classify follow-up vs fresh browse (server-side; Gemini hint is advisory). */
export function resolveSearchIntent(
  userQuery: string,
  previous: CatalogueSearchParams | null,
  incoming: CatalogueSearchParams,
  geminiIntentRaw?: string
): SearchIntent {
  if (!previous || !hasActiveSearchCriteria(previous)) {
    return "new_search";
  }

  const geminiIntent = parseGeminiSearchIntent(geminiIntentRaw);
  const q = userQuery.trim();
  const qLower = q.toLowerCase();

  if (STANDALONE_BROWSE_RE.test(qLower) || NEW_SEARCH_CUE_RE.test(qLower)) {
    return "new_search";
  }

  const incomingStructured = countStructuredFilters({
    ...incoming,
    q: "",
  });
  const previousStructured = countStructuredFilters({
    ...previous,
    q: "",
  });

  if (
    incomingStructured >= 2 &&
    !REFINEMENT_CUE_RE.test(qLower) &&
    (incoming.season !== previous.season || incoming.category !== previous.category)
  ) {
    return "new_search";
  }

  if (REFINEMENT_CUE_RE.test(qLower)) {
    return "refinement";
  }

  if (geminiIntent) {
    return geminiIntent;
  }

  const incomingWithQ = countStructuredFilters(incoming);
  if (incomingWithQ <= 2 && q.split(/\s+/).length <= 8) {
    return "refinement";
  }

  if (previousStructured > 0 && incomingStructured <= 1) {
    return "refinement";
  }

  return "new_search";
}

/** Merge previous catalogue filters with newly validated filters (refinement only). */
export function mergeRefinementFilters(
  previous: CatalogueSearchParams,
  incoming: CatalogueSearchParams
): CatalogueSearchParams {
  return {
    q: incoming.q.trim() ? incoming.q.trim() : previous.q,
    season: incoming.season ?? previous.season,
    category: incoming.category ?? previous.category,
    making: incoming.making ?? previous.making,
    type: incoming.type ?? previous.type,
    material: incoming.material ?? previous.material,
    colour: incoming.colour ?? previous.colour,
    page: 1,
  };
}

export function applySearchIntentToParams(
  intent: SearchIntent,
  previous: CatalogueSearchParams | null,
  incoming: CatalogueSearchParams
): CatalogueSearchParams {
  if (intent === "refinement" && previous) {
    return mergeRefinementFilters(previous, incoming);
  }
  return { ...incoming, page: 1 };
}
