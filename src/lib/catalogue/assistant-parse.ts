import {
  isCategorySlug,
  isSeasonSlug,
  type CategorySlug,
  type SeasonSlug,
} from "@/lib/collections/config";
import type { CatalogueFilterFacets } from "@/lib/catalogue/types";
import type { CatalogueSearchParams } from "@/lib/catalogue/search-params";

export type ExtractedCatalogueFilters = {
  q?: string;
  season?: string | null;
  category?: string | null;
  making?: string | null;
  type?: string | null;
  material?: string | null;
  colour?: string | null;
};

function pickFacetValue(
  candidate: string | null | undefined,
  allowed: string[]
): string | undefined {
  const raw = candidate?.trim();
  if (!raw || allowed.length === 0) return undefined;

  const exact = allowed.find((v) => v === raw);
  if (exact) return exact;

  const lower = raw.toLowerCase();
  const caseInsensitive = allowed.find((v) => v.toLowerCase() === lower);
  return caseInsensitive;
}

function normalizeSeason(raw: string | null | undefined): SeasonSlug | undefined {
  const value = raw?.trim().toLowerCase();
  if (!value) return undefined;
  return isSeasonSlug(value) ? value : undefined;
}

function normalizeCategory(raw: string | null | undefined): CategorySlug | undefined {
  const value = raw?.trim().toLowerCase();
  if (!value) return undefined;
  if (value === "dip pu") return "dip-pu";
  if (value === "dip pvc") return "dip-pvc";
  return isCategorySlug(value) ? value : undefined;
}

function mergeQueryParts(...parts: (string | undefined | null)[]): string {
  const seen = new Set<string>();
  const tokens: string[] = [];

  for (const part of parts) {
    const text = part?.trim();
    if (!text) continue;
    for (const token of text.split(/\s+/)) {
      const key = token.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      tokens.push(token);
    }
  }

  return tokens.join(" ");
}

/** Maps tool/LLM filter args to validated catalogue search params using live facet lists. */
export function normalizeExtractedFilters(
  extracted: ExtractedCatalogueFilters,
  facets: CatalogueFilterFacets,
  page = 1
): CatalogueSearchParams {
  const qOverflow: string[] = [];

  const making = pickFacetValue(extracted.making, facets.making);
  if (extracted.making?.trim() && !making) {
    qOverflow.push(extracted.making.trim());
  }

  const type = pickFacetValue(extracted.type, facets.type);
  if (extracted.type?.trim() && !type) {
    qOverflow.push(extracted.type.trim());
  }

  const material = pickFacetValue(extracted.material, facets.material);
  if (extracted.material?.trim() && !material) {
    qOverflow.push(extracted.material.trim());
  }

  const colour = pickFacetValue(extracted.colour, facets.colour);
  if (extracted.colour?.trim() && !colour) {
    qOverflow.push(extracted.colour.trim());
  }

  return {
    q: mergeQueryParts(extracted.q, qOverflow.join(" ")),
    season: normalizeSeason(extracted.season),
    category: normalizeCategory(extracted.category),
    making,
    type,
    material,
    colour,
    page,
  };
}
