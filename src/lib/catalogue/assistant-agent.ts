import "server-only";

import {
  allowedProductIdsFromContext,
  buildContextPromptBlock,
  isPermittedProductId,
  resolveRecentProductDetailRequest,
  type AssistantFacetsPayload,
  type SanitizedAssistantContext,
} from "@/lib/catalogue/assistant-context";
import {
  applySearchIntentToParams,
  contextFiltersToSearchParams,
  resolveSearchIntent,
} from "@/lib/catalogue/assistant-filter-merge";
import { normalizeExtractedFilters } from "@/lib/catalogue/assistant-parse";
import { getProductDetail } from "@/lib/catalogue/queries";
import { getCatalogueFilterFacets, searchCatalogue } from "@/lib/catalogue/search";
import { hasActiveSearchCriteria } from "@/lib/catalogue/search-params";
import type { CatalogueSearchParams } from "@/lib/catalogue/search-params";
import type { CatalogueFilterFacets, CatalogueProduct } from "@/lib/catalogue/types";
import {
  CATEGORIES,
  CATEGORY_SLUGS,
  SEASONS,
  SEASON_SLUGS,
  type CategorySlug,
  type SeasonSlug,
} from "@/lib/collections/config";
import {
  FunctionCallingMode,
  GoogleGenerativeAI,
  SchemaType,
  type FunctionDeclaration,
  type FunctionCall,
} from "@google/generative-ai";

const DEFAULT_ASSISTANT_MODEL = "gemini-3.8-flash";
const MAX_QUERY_LENGTH = 500;
const LLM_MAX_ATTEMPTS = 3;
const CLARIFICATION_FALLBACK =
  "Please provide the article ID or a more specific product reference.";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class AssistantAgentError extends Error {
  readonly code: "CONFIG" | "LLM" | "VALIDATION" | "TOOL";

  constructor(message: string, code: "CONFIG" | "LLM" | "VALIDATION" | "TOOL") {
    super(message);
    this.name = "AssistantAgentError";
    this.code = code;
  }
}

export type AssistantApiFilters = {
  q: string;
  season: CatalogueSearchParams["season"] | null;
  category: CatalogueSearchParams["category"] | null;
  making: string | null;
  type: string | null;
  material: string | null;
  colour: string | null;
  page: number;
};

export type AssistantPagination = {
  total: number;
  page: number;
  pageSize: number;
  dataSource: "live" | "demo";
};

export type AssistantAgentSuccess = {
  message: string;
  filters: AssistantApiFilters;
  products: CatalogueProduct[];
  pagination: AssistantPagination;
  facets: AssistantFacetsPayload | null;
};

const EMPTY_FILTERS: AssistantApiFilters = {
  q: "",
  season: null,
  category: null,
  making: null,
  type: null,
  material: null,
  colour: null,
  page: 1,
};

const EMPTY_PAGINATION: AssistantPagination = {
  total: 0,
  page: 1,
  pageSize: 24,
  dataSource: "live",
};

const AGENT_SYSTEM_INSTRUCTION = `You are the MJMS Product Assistant.

You help users find and understand products from the actual MJMS footwear development catalogue.

Rules:
- Only use information returned by your tools.
- Never invent product information.
- Never claim a product exists unless a catalogue tool returned it.
- Use search_products for product discovery (season, category, colour, project name, article reference, etc.).
- Use get_catalogue_facets when the user asks what colours, seasons, categories, making, types, or materials exist in the catalogue (global options — not filtered by season).
- Use get_product_details only when the user asks for details and the product id (UUID) is in the recent products list or explicitly in the user's message.
- Never invent or guess a product id.
- If a request is ambiguous and cannot safely be resolved, respond with a short clarification instead of calling a tool.
- When recent session context is provided, set search_intent to refinement for narrow follow-ups (e.g. "ab red wali", "sirf ladies wali") and new_search for fresh browse requests (e.g. "summer PU products dikhao").
- For refinements, pass only the filters the user is adding or changing in search_products; previous filters are merged server-side.
- Understand English, Urdu, and Roman Urdu naturally.
- Keep responses concise and useful.
- Do not expose internal tool names, database names, Supabase details, API keys, or implementation details.`;

function buildToolDeclarations(facets: CatalogueFilterFacets): FunctionDeclaration[] {
  const facetHint = (values: string[]) =>
    values.length ? `Allowed values include: ${values.slice(0, 40).join(" | ")}` : "Use exact catalogue values only.";

  return [
    {
      name: "search_products",
      description:
        "Search the MJMS catalogue by filters. Use for discovery requests (show, dikhao, find, list). Do not invent facet values.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          q: {
            type: SchemaType.STRING,
            description: "Project name or article/reference text search.",
          },
          season: {
            type: SchemaType.STRING,
            description: `Season slug: ${SEASON_SLUGS.join(" or ")}.`,
          },
          category: {
            type: SchemaType.STRING,
            description: `Category slug: ${CATEGORY_SLUGS.join(", ")}.`,
          },
          making: {
            type: SchemaType.STRING,
            description: facetHint(facets.making),
          },
          type: {
            type: SchemaType.STRING,
            description: facetHint(facets.type),
          },
          material: {
            type: SchemaType.STRING,
            description: facetHint(facets.material),
          },
          colour: {
            type: SchemaType.STRING,
            description: facetHint(facets.colour),
          },
          search_intent: {
            type: SchemaType.STRING,
            description:
              'Optional: "refinement" when the user narrows or adjusts the previous search in context; "new_search" for an independent browse.',
          },
        },
      },
    },
    {
      name: "get_catalogue_facets",
      description:
        "Return available catalogue filter options from MJMS data (colours, making, types, materials, seasons, categories). Use for “what options exist” questions — not product search.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {},
      },
    },
    {
      name: "get_product_details",
      description:
        "Load full details for one catalogue product when the user asks for details and a valid MJMS product id (UUID) is known.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          product_id: {
            type: SchemaType.STRING,
            description: "MJMS product/article UUID from the catalogue.",
          },
        },
        required: ["product_id"],
      },
    },
  ];
}

function serializeFilters(params: CatalogueSearchParams): AssistantApiFilters {
  return {
    q: params.q,
    season: params.season ?? null,
    category: params.category ?? null,
    making: params.making ?? null,
    type: params.type ?? null,
    material: params.material ?? null,
    colour: params.colour ?? null,
    page: params.page,
  };
}

type UiPayload = {
  filters: AssistantApiFilters;
  products: CatalogueProduct[];
  pagination: AssistantPagination;
  catalogueFacets: AssistantFacetsPayload | null;
};

type ToolOutcome =
  | { tool: "search_products"; status: "success" | "empty" | "no_valid_filters" | "search_failed" }
  | { tool: "get_catalogue_facets"; status: "success" | "failed" }
  | { tool: "get_product_details"; status: "success" | "not_found" | "invalid_product_id" }
  | { tool: "unknown" };

function emptyUiPayload(page: number): UiPayload {
  return {
    filters: { ...EMPTY_FILTERS, page },
    products: [],
    pagination: { ...EMPTY_PAGINATION, page },
    catalogueFacets: null,
  };
}

function buildAssistantFacetsPayload(
  facets: CatalogueFilterFacets,
  dataSource: "live" | "demo"
): AssistantFacetsPayload {
  return {
    dataSource,
    seasons: SEASON_SLUGS.map((slug) => ({
      slug,
      label: SEASONS[slug].shortTitle,
    })),
    categories: CATEGORIES.map((c) => ({ slug: c.slug, label: c.label })),
    making: facets.making,
    type: facets.type,
    material: facets.material,
    colour: facets.colour,
  };
}

function readStringArg(args: object, key: string): string | undefined {
  const value = (args as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

function messageForToolOutcome(outcome: ToolOutcome, pagination: AssistantPagination): string {
  if (outcome.tool === "search_products") {
    if (outcome.status === "success" && pagination.total > 0) {
      const total = pagination.total.toLocaleString();
      return `Found ${total} matching product${pagination.total === 1 ? "" : "s"}.`;
    }
    if (outcome.status === "empty" || outcome.status === "no_valid_filters") {
      return "I couldn't find products matching those filters.";
    }
    return "The catalogue search could not be completed. Please try again.";
  }

  if (outcome.tool === "get_catalogue_facets") {
    if (outcome.status === "success") {
      return "Here are the available catalogue options.";
    }
    return "Catalogue options could not be loaded. Please try again.";
  }

  if (outcome.tool === "get_product_details") {
    if (outcome.status === "success") {
      return "Here are the details for this product.";
    }
    if (outcome.status === "not_found") {
      return "That product could not be found in the catalogue.";
    }
    return CLARIFICATION_FALLBACK;
  }

  return "The assistant could not complete that request. Please try again.";
}

async function runSearchProductsTool(
  args: object,
  facets: CatalogueFilterFacets,
  page: number,
  userQuery: string,
  previousFilters: SanitizedAssistantContext["previousFilters"]
): Promise<{ ui: UiPayload; outcome: ToolOutcome }> {
  const incoming = normalizeExtractedFilters(
    {
      q: readStringArg(args, "q") ?? "",
      season: readStringArg(args, "season") ?? null,
      category: readStringArg(args, "category") ?? null,
      making: readStringArg(args, "making") ?? null,
      type: readStringArg(args, "type") ?? null,
      material: readStringArg(args, "material") ?? null,
      colour: readStringArg(args, "colour") ?? null,
    },
    facets,
    1
  );

  const previous = contextFiltersToSearchParams(previousFilters);
  const intent = resolveSearchIntent(
    userQuery,
    previous,
    incoming,
    readStringArg(args, "search_intent")
  );
  const params = applySearchIntentToParams(intent, previous, { ...incoming, page: 1 });

  if (!hasActiveSearchCriteria(params)) {
    return {
      outcome: { tool: "search_products", status: "no_valid_filters" },
      ui: emptyUiPayload(page),
    };
  }

  const searchResult = await searchCatalogue(params);
  if (!searchResult.ok) {
    return {
      outcome: { tool: "search_products", status: "search_failed" },
      ui: {
        ...emptyUiPayload(page),
        filters: serializeFilters(params),
      },
    };
  }

  const ui: UiPayload = {
    filters: serializeFilters(params),
    products: searchResult.products,
    pagination: {
      total: searchResult.total,
      page: searchResult.page,
      pageSize: searchResult.pageSize,
      dataSource: searchResult.dataSource,
    },
    catalogueFacets: null,
  };

  const status =
    searchResult.total === 0 || searchResult.products.length === 0 ? "empty" : "success";

  return {
    outcome: { tool: "search_products", status },
    ui,
  };
}

async function runGetProductDetailsById(
  productId: string,
  options?: { allowedIds?: Set<string>; userQuery?: string; trustContextResolution?: boolean }
): Promise<{ ui: UiPayload; outcome: ToolOutcome }> {
  const normalizedId = productId.trim().toLowerCase();

  if (!normalizedId || !UUID_RE.test(normalizedId)) {
    return {
      outcome: { tool: "get_product_details", status: "invalid_product_id" },
      ui: emptyUiPayload(1),
    };
  }

  if (!options?.trustContextResolution) {
    const allowedIds = options?.allowedIds ?? new Set<string>();
    const userQuery = options?.userQuery ?? "";
    if (!isPermittedProductId(normalizedId, allowedIds, userQuery)) {
      return {
        outcome: { tool: "get_product_details", status: "invalid_product_id" },
        ui: emptyUiPayload(1),
      };
    }
  }

  const detail = await getProductDetail(normalizedId);
  if (!detail.ok) {
    return {
      outcome: { tool: "get_product_details", status: "not_found" },
      ui: emptyUiPayload(1),
    };
  }

  const p = detail.product;
  return {
    outcome: { tool: "get_product_details", status: "success" },
    ui: {
      filters: EMPTY_FILTERS,
      products: [p],
      pagination: {
        total: 1,
        page: 1,
        pageSize: 1,
        dataSource: p.isDemo ? "demo" : "live",
      },
      catalogueFacets: null,
    },
  };
}

function runGetCatalogueFacetsTool(
  facets: CatalogueFilterFacets,
  dataSource: "live" | "demo",
  page: number
): { ui: UiPayload; outcome: ToolOutcome } {
  return {
    outcome: { tool: "get_catalogue_facets", status: "success" },
    ui: {
      ...emptyUiPayload(page),
      catalogueFacets: buildAssistantFacetsPayload(facets, dataSource),
    },
  };
}

async function runGetProductDetailsTool(
  args: object,
  allowedIds: Set<string>,
  userQuery: string
): Promise<{ ui: UiPayload; outcome: ToolOutcome }> {
  const productId = readStringArg(args, "product_id") ?? "";
  return runGetProductDetailsById(productId, { allowedIds, userQuery });
}

async function executeToolCall(
  call: FunctionCall,
  facets: CatalogueFilterFacets,
  page: number,
  allowedIds: Set<string>,
  userQuery: string,
  context: SanitizedAssistantContext | null,
  facetDataSource: "live" | "demo"
): Promise<{ ui: UiPayload; outcome: ToolOutcome }> {
  if (call.name === "search_products") {
    return runSearchProductsTool(
      call.args,
      facets,
      page,
      userQuery,
      context?.previousFilters ?? null
    );
  }
  if (call.name === "get_catalogue_facets") {
    return runGetCatalogueFacetsTool(facets, facetDataSource, page);
  }
  if (call.name === "get_product_details") {
    return runGetProductDetailsTool(call.args, allowedIds, userQuery);
  }
  return {
    outcome: { tool: "unknown" },
    ui: emptyUiPayload(page),
  };
}

function logGenerativeAiError(err: unknown, context: { model: string; attempt: number }) {
  const payload: Record<string, unknown> = { ...context };
  if (typeof err === "object" && err !== null) {
    const e = err as {
      message?: string;
      status?: number;
      statusText?: string;
      errorDetails?: unknown;
    };
    if (e.message) payload.message = e.message;
    if (e.status !== undefined) payload.status = e.status;
    if (e.statusText) payload.statusText = e.statusText;
    if (e.errorDetails !== undefined) payload.errorDetails = e.errorDetails;
  } else {
    payload.message = String(err);
  }
  console.error("[catalogue-assistant] Gemini generateContent failed", payload);
}

async function generateWithRetry(
  model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>,
  request: Parameters<typeof model.generateContent>[0],
  modelName: string
) {
  let lastError: unknown;
  for (let attempt = 0; attempt < LLM_MAX_ATTEMPTS; attempt++) {
    try {
      return await model.generateContent(request);
    } catch (err) {
      lastError = err;
      const status =
        typeof err === "object" && err !== null && "status" in err
          ? (err as { status?: number }).status
          : undefined;
      if (status === 503 && attempt < LLM_MAX_ATTEMPTS - 1) {
        await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
        continue;
      }
      break;
    }
  }
  logGenerativeAiError(lastError, { model: modelName, attempt: LLM_MAX_ATTEMPTS });
  throw new AssistantAgentError("Assistant language model request failed.", "LLM");
}

function buildUserPrompt(query: string, context: SanitizedAssistantContext | null): string {
  if (!context) return query;
  return `${buildContextPromptBlock(context)}\n\nCurrent user query:\n${query}`;
}

export async function runAssistantAgent(
  userQuery: string,
  page = 1,
  context: SanitizedAssistantContext | null = null
): Promise<AssistantAgentSuccess> {
  const query = userQuery.trim();
  if (!query) {
    throw new AssistantAgentError("Query is required.", "VALIDATION");
  }
  if (query.length > MAX_QUERY_LENGTH) {
    throw new AssistantAgentError(
      `Query must be at most ${MAX_QUERY_LENGTH} characters.`,
      "VALIDATION"
    );
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new AssistantAgentError(
      "Assistant is not configured (missing GEMINI_API_KEY).",
      "CONFIG"
    );
  }

  if (context?.recentProducts.length) {
    const resolved = resolveRecentProductDetailRequest(query, context.recentProducts);
    if (resolved?.kind === "clarify") {
      return {
        message: CLARIFICATION_FALLBACK,
        filters: { ...EMPTY_FILTERS, page },
        products: [],
        pagination: { ...EMPTY_PAGINATION, page },
        facets: null,
      };
    }
    if (resolved?.kind === "product") {
      const executed = await runGetProductDetailsById(resolved.productId, {
        trustContextResolution: true,
      });
      return {
        message: messageForToolOutcome(executed.outcome, executed.ui.pagination),
        filters: executed.ui.filters,
        products: executed.ui.products,
        pagination: executed.ui.pagination,
        facets: null,
      };
    }
  }

  const allowedIds = allowedProductIdsFromContext(context, query);

  const { facets, dataSource: facetDataSource } = await getCatalogueFilterFacets();
  const modelName =
    process.env.GEMINI_ASSISTANT_MODEL?.trim() || DEFAULT_ASSISTANT_MODEL;
  const functionDeclarations = buildToolDeclarations(facets);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: AGENT_SYSTEM_INSTRUCTION,
    tools: [{ functionDeclarations }],
    toolConfig: {
      functionCallingConfig: { mode: FunctionCallingMode.AUTO },
    },
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 512,
    },
  });

  const userPrompt = buildUserPrompt(query, context);

  const first = await generateWithRetry(
    model,
    {
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    },
    modelName
  );

  const calls = first.response.functionCalls();
  if (!calls?.length) {
    let message: string;
    try {
      message = first.response.text().trim();
    } catch {
      message = CLARIFICATION_FALLBACK;
    }
    if (!message) {
      message = CLARIFICATION_FALLBACK;
    }
    return {
      message,
      filters: { ...EMPTY_FILTERS, page },
      products: [],
      pagination: { ...EMPTY_PAGINATION, page },
      facets: null,
    };
  }

  let ui: UiPayload = emptyUiPayload(page);
  let outcome: ToolOutcome = { tool: "unknown" };

  for (const call of calls) {
    const executed = await executeToolCall(
      call,
      facets,
      page,
      allowedIds,
      query,
      context,
      facetDataSource
    );
    outcome = executed.outcome;
    if (executed.ui.catalogueFacets) {
      ui = executed.ui;
    } else if (
      executed.ui.products.length > 0 ||
      hasActiveSearchCriteria({
        q: executed.ui.filters.q,
        season: executed.ui.filters.season ?? undefined,
        category: executed.ui.filters.category ?? undefined,
        making: executed.ui.filters.making ?? undefined,
        type: executed.ui.filters.type ?? undefined,
        material: executed.ui.filters.material ?? undefined,
        colour: executed.ui.filters.colour ?? undefined,
        page: executed.ui.filters.page,
      })
    ) {
      ui = executed.ui;
    }
  }

  return {
    message: messageForToolOutcome(outcome, ui.pagination),
    filters: ui.filters,
    products: ui.products,
    pagination: ui.pagination,
    facets: ui.catalogueFacets,
  };
}
