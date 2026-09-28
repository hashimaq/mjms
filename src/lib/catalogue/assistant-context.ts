import { isCategorySlug, isSeasonSlug, type CategorySlug, type SeasonSlug } from "@/lib/collections/config";

const MAX_PREVIOUS_QUERY = 500;
const MAX_RECENT_PRODUCTS = 24;
const MAX_PRODUCT_NAME = 300;
const MAX_ARTICLE_REF = 120;
const MAX_Q_FILTER = 200;
const MAX_FACET = 120;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AssistantContextFilters = {
  q: string;
  season: SeasonSlug | null;
  category: CategorySlug | null;
  making: string | null;
  type: string | null;
  material: string | null;
  colour: string | null;
  page: number;
};

export type AssistantRecentProduct = {
  id: string;
  projectName: string;
  articleReference: string | null;
};

/** Client-provided follow-up context (sanitized on the server). */
export type AssistantRequestContext = {
  previousQuery?: string;
  previousFilters?: AssistantContextFilters;
  recentProducts?: AssistantRecentProduct[];
};

/** Structured facet options returned by the assistant API. */
export type AssistantFacetsPayload = {
  dataSource: "live" | "demo";
  seasons: { slug: SeasonSlug; label: string }[];
  categories: { slug: CategorySlug; label: string }[];
  making: string[];
  type: string[];
  material: string[];
  colour: string[];
};

export type SanitizedAssistantContext = {
  previousQuery: string | null;
  previousFilters: AssistantContextFilters | null;
  recentProducts: AssistantRecentProduct[];
};

function trimString(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (!t) return null;
  return t.length > max ? t.slice(0, max) : t;
}

function sanitizeFilters(raw: unknown): AssistantContextFilters | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const seasonRaw = trimString(record.season, 16);
  const categoryRaw = trimString(record.category, 16);
  const pageRaw = Number(record.page);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.min(Math.floor(pageRaw), 50) : 1;

  return {
    q: trimString(record.q, MAX_Q_FILTER) ?? "",
    season: seasonRaw && isSeasonSlug(seasonRaw) ? seasonRaw : null,
    category: categoryRaw && isCategorySlug(categoryRaw) ? categoryRaw : null,
    making: trimString(record.making, MAX_FACET),
    type: trimString(record.type, MAX_FACET),
    material: trimString(record.material, MAX_FACET),
    colour: trimString(record.colour, MAX_FACET),
    page,
  };
}

function sanitizeRecentProduct(raw: unknown): AssistantRecentProduct | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const id = trimString(record.id, 64);
  if (!id || !UUID_RE.test(id)) return null;
  const projectName = trimString(record.projectName, MAX_PRODUCT_NAME);
  if (!projectName) return null;
  const articleReference = trimString(record.articleReference, MAX_ARTICLE_REF);
  return { id, projectName, articleReference };
}

export function sanitizeAssistantContext(raw: unknown): SanitizedAssistantContext | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== "object") return null;

  const record = raw as Record<string, unknown>;
  const previousQuery = trimString(record.previousQuery, MAX_PREVIOUS_QUERY);
  const previousFilters = sanitizeFilters(record.previousFilters);

  const recentRaw = record.recentProducts;
  const recentProducts: AssistantRecentProduct[] = [];
  if (Array.isArray(recentRaw)) {
    for (const item of recentRaw.slice(0, MAX_RECENT_PRODUCTS)) {
      const product = sanitizeRecentProduct(item);
      if (product && !recentProducts.some((p) => p.id === product.id)) {
        recentProducts.push(product);
      }
    }
  }

  if (!previousQuery && !previousFilters && recentProducts.length === 0) {
    return null;
  }

  return {
    previousQuery,
    previousFilters,
    recentProducts,
  };
}

export function allowedProductIdsFromContext(
  context: SanitizedAssistantContext | null,
  userQuery: string
): Set<string> {
  const allowed = new Set<string>();
  if (context) {
    for (const p of context.recentProducts) {
      allowed.add(p.id.toLowerCase());
    }
  }
  const match = userQuery.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i
  );
  if (match) {
    allowed.add(match[0]!.toLowerCase());
  }
  return allowed;
}

export function isPermittedProductId(
  productId: string,
  allowedIds: Set<string>,
  userQuery: string
): boolean {
  const normalized = productId.trim().toLowerCase();
  if (allowedIds.has(normalized)) return true;
  return userQuery.toLowerCase().includes(normalized);
}

const DETAIL_INTENT_RE =
  /\b(details?|detail|batao)\b|ki details|product details|article details/i;

function isDetailReferenceRequest(query: string): boolean {
  return DETAIL_INTENT_RE.test(query);
}

type OrdinalMatch = { index: number; label: string };

function findOrdinalMatches(query: string): OrdinalMatch[] {
  const normalized = query.toLowerCase();
  const matches: OrdinalMatch[] = [];

  const rules: { index: number; patterns: RegExp[] }[] = [
    { index: 0, patterns: [/\bfirst\b/, /\bpehla\b/, /\bpehle\b/, /\b1st\b/, /pehle\s+wale?/] },
    { index: 1, patterns: [/\bsecond\b/, /\bdoosra\b/, /\bdusra\b/, /\bdusre\b/, /\b2nd\b/, /doosre?\s+wale?/] },
    { index: 2, patterns: [/\bthird\b/, /\bteesra\b/, /\bteesre\b/, /\b3rd\b/, /teesre?\s+wale?/] },
    {
      index: 0,
      patterns: [/\b(us|is|that|woh)\s+(product|article|wali?|wale?)?\b/, /\bus article\b/, /\bis article\b/],
    },
    { index: -1, patterns: [/\blast\b/, /\baakhri\b/, /\baakhri\s+wale?/] },
  ];

  for (const rule of rules) {
    for (const pattern of rule.patterns) {
      if (pattern.test(normalized)) {
        matches.push({ index: rule.index, label: pattern.source });
        break;
      }
    }
  }

  return matches;
}

function resolveOrdinalIndex(
  query: string,
  listLength: number
): number | null | "ambiguous" {
  if (listLength === 0) return null;

  const matches = findOrdinalMatches(query);
  const resolvedIndexes = new Set<number>();

  for (const m of matches) {
    if (m.index === -1) {
      resolvedIndexes.add(listLength - 1);
    } else if (m.index >= 0 && m.index < listLength) {
      resolvedIndexes.add(m.index);
    } else if (m.index >= listLength) {
      return "ambiguous";
    }
  }

  if (resolvedIndexes.size === 1) {
    return [...resolvedIndexes][0]!;
  }
  if (resolvedIndexes.size > 1) {
    return "ambiguous";
  }

  if (isDetailReferenceRequest(query) && listLength === 1) {
    return 0;
  }

  return null;
}

export type ResolvedRecentProductDetail =
  | { kind: "product"; productId: string }
  | { kind: "clarify" };

/** Deterministic follow-up: "pehle wale ki details" → recent product id. */
export function resolveRecentProductDetailRequest(
  query: string,
  recentProducts: AssistantRecentProduct[]
): ResolvedRecentProductDetail | null {
  if (!isDetailReferenceRequest(query) || recentProducts.length === 0) {
    return null;
  }

  const ordinal = resolveOrdinalIndex(query, recentProducts.length);
  if (ordinal === "ambiguous") {
    return { kind: "clarify" };
  }
  if (ordinal === null) {
    return { kind: "clarify" };
  }

  const product = recentProducts[ordinal];
  if (!product) {
    return { kind: "clarify" };
  }

  return { kind: "product", productId: product.id };
}

export function buildContextPromptBlock(context: SanitizedAssistantContext): string {
  const lines: string[] = [
    "Recent session context (follow-up only — use for refining searches; never invent product ids):",
  ];

  if (context.previousQuery) {
    lines.push(`Previous user query: ${context.previousQuery}`);
  }

  if (context.previousFilters) {
    const f = context.previousFilters;
    const parts: string[] = [];
    if (f.season) parts.push(`season=${f.season}`);
    if (f.category) parts.push(`category=${f.category}`);
    if (f.colour) parts.push(`colour=${f.colour}`);
    if (f.making) parts.push(`making=${f.making}`);
    if (f.type) parts.push(`type=${f.type}`);
    if (f.material) parts.push(`material=${f.material}`);
    if (f.q) parts.push(`q=${f.q}`);
    if (parts.length) {
      lines.push(`Previous filters: ${parts.join(", ")}`);
    }
  }

  if (context.recentProducts.length > 0) {
    lines.push("Recent products shown (only these ids may be used for get_product_details):");
    context.recentProducts.forEach((p, i) => {
      const ref = p.articleReference ? `, ref=${p.articleReference}` : "";
      lines.push(`${i + 1}. id=${p.id}, name=${p.projectName}${ref}`);
    });
  }

  lines.push(
    "For follow-up refinements (e.g. 'ab red wali', 'sirf ladies wali'), call search_products with search_intent=refinement and only the new/changed filters."
  );
  lines.push(
    "For a fresh browse (e.g. 'summer PU products dikhao'), use search_intent=new_search with a full filter set."
  );

  return lines.join("\n");
}
