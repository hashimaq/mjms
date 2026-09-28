"use client";

import { BrandedStatePanel } from "@/components/brand/BrandedStatePanel";
import { ProductGrid } from "@/components/catalogue/ProductGrid";
import { CATEGORIES, SEASONS, type CategorySlug, type SeasonSlug } from "@/lib/collections/config";
import type {
  AssistantFacetsPayload,
  AssistantRequestContext,
} from "@/lib/catalogue/assistant-context";
import type { CatalogueProduct } from "@/lib/catalogue/types";
import { Loader2, Sparkles } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

const ASSISTANT_CONTEXT_SESSION_KEY = "mjms-assistant-context";
const MAX_CONTEXT_PRODUCTS = 24;

function loadSessionContext(): AssistantRequestContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ASSISTANT_CONTEXT_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AssistantRequestContext;
  } catch {
    return null;
  }
}

function saveSessionContext(context: AssistantRequestContext | null) {
  if (typeof window === "undefined") return;
  try {
    if (!context) {
      sessionStorage.removeItem(ASSISTANT_CONTEXT_SESSION_KEY);
      return;
    }
    sessionStorage.setItem(ASSISTANT_CONTEXT_SESSION_KEY, JSON.stringify(context));
  } catch {
    /* ignore quota / private mode */
  }
}

function shouldPersistAssistantContext(data: AssistantSuccessResponse): boolean {
  if (data.products.length > 0) return true;
  if (data.facets) return false;
  const f = data.filters;
  return !!(
    f.season ||
    f.category ||
    f.making ||
    f.type ||
    f.material ||
    f.colour ||
    f.q.trim()
  );
}

function buildContextFromResult(data: AssistantSuccessResponse): AssistantRequestContext {
  return {
    previousQuery: data.query,
    previousFilters: data.filters,
    recentProducts: data.products.slice(0, MAX_CONTEXT_PRODUCTS).map((p) => ({
      id: p.id,
      projectName: p.projectName,
      articleReference: p.articleReference,
    })),
  };
}

const EXAMPLE_PROMPTS = [
  "Black ladies heel winter mein dikhao",
  "Winter ke flat shoes dikhao",
  "Summer PU products dikhao",
] as const;

type AssistantFilters = {
  q: string;
  season: SeasonSlug | null;
  category: CategorySlug | null;
  making: string | null;
  type: string | null;
  material: string | null;
  colour: string | null;
  page: number;
};

type AssistantSuccessResponse = {
  ok: true;
  query: string;
  message?: string;
  filters: AssistantFilters;
  products: CatalogueProduct[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    dataSource: "live" | "demo";
  };
  facets?: AssistantFacetsPayload | null;
};

type AssistantErrorResponse = {
  ok: false;
  message?: string;
};

function labelForSeason(slug: SeasonSlug): string {
  return SEASONS[slug].shortTitle;
}

function labelForCategory(slug: CategorySlug): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

function displayFacetValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
    return trimmed
      .toLowerCase()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  return trimmed;
}

function formatInterpretedFilters(filters: AssistantFilters): string | null {
  const parts: string[] = [];

  if (filters.season) parts.push(labelForSeason(filters.season));
  if (filters.category) parts.push(labelForCategory(filters.category));
  if (filters.making) parts.push(displayFacetValue(filters.making));
  if (filters.type) parts.push(displayFacetValue(filters.type));
  if (filters.material) parts.push(displayFacetValue(filters.material));
  if (filters.colour) parts.push(displayFacetValue(filters.colour));
  if (filters.q.trim()) parts.push(filters.q.trim());

  if (parts.length === 0) return null;
  return parts.join(" · ");
}

const FACET_LIST_SECTIONS: {
  key: keyof Pick<
    AssistantFacetsPayload,
    "seasons" | "categories" | "making" | "type" | "material" | "colour"
  >;
  label: string;
}[] = [
  { key: "seasons", label: "Seasons" },
  { key: "categories", label: "Categories" },
  { key: "making", label: "Making" },
  { key: "type", label: "Types" },
  { key: "material", label: "Materials" },
  { key: "colour", label: "Colours" },
];

function formatFacetSectionValues(
  key: (typeof FACET_LIST_SECTIONS)[number]["key"],
  facets: AssistantFacetsPayload
): string {
  const raw = facets[key];
  if (key === "seasons" || key === "categories") {
    return (raw as { label: string }[]).map((item) => item.label).join(", ");
  }
  return (raw as string[]).map(displayFacetValue).join(", ");
}

function AssistantFacetsSummary({ facets }: { facets: AssistantFacetsPayload }) {
  return (
    <div className="catalogue-assistant-facets" role="region" aria-label="Catalogue filter options">
      <dl className="catalogue-assistant-facets-list">
        {FACET_LIST_SECTIONS.map(({ key, label }) => {
          const text = formatFacetSectionValues(key, facets);
          if (!text) return null;
          return (
            <div key={key} className="catalogue-assistant-facets-row">
              <dt className="catalogue-assistant-facets-term">{label}</dt>
              <dd className="catalogue-assistant-facets-def">{text}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

type ProductAssistantPanelProps = {
  /** When true, omits the page-style header (modal supplies its own). */
  embedded?: boolean;
};

export function ProductAssistantPanel({ embedded = false }: ProductAssistantPanelProps) {
  const inputId = useId();
  const abortRef = useRef<AbortController | null>(null);
  const contextRef = useRef<AssistantRequestContext | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    contextRef.current = loadSessionContext();
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssistantSuccessResponse | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const runSearch = useCallback(async (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    if (!trimmed) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setQuery(trimmed);
    setLoading(true);
    setError(null);
    setSubmitted(true);

    try {
      const response = await fetch("/api/catalogue/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmed,
          ...(contextRef.current ? { context: contextRef.current } : {}),
        }),
        signal: controller.signal,
      });

      const data = (await response.json()) as AssistantSuccessResponse | AssistantErrorResponse;

      if (controller.signal.aborted) return;

      if (!response.ok || !data.ok) {
        const message =
          !data.ok && data.message
            ? data.message
            : "We could not complete that search. Please try again.";
        setResult(null);
        setError(message);
        return;
      }

      setResult(data);
      if (shouldPersistAssistantContext(data)) {
        const nextContext = buildContextFromResult(data);
        contextRef.current = nextContext;
        saveSessionContext(nextContext);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setResult(null);
      setError("Network error. Check your connection and try again.");
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void runSearch(query);
  };

  const onExampleClick = (example: string) => {
    void runSearch(example);
  };

  const interpreted = result ? formatInterpretedFilters(result.filters) : null;

  return (
    <section
      className={`catalogue-assistant${embedded ? " catalogue-assistant--embedded" : ""}`}
      aria-labelledby={embedded ? undefined : "catalogue-assistant-heading"}
      aria-busy={loading}
    >
      {!embedded && (
        <header className="catalogue-assistant-head">
          <div className="catalogue-assistant-head-text">
            <p className="catalogue-assistant-eyebrow">
              <Sparkles className="catalogue-assistant-eyebrow-icon" aria-hidden />
              AI assistant
            </p>
            <h2 id="catalogue-assistant-heading" className="catalogue-assistant-title">
              Describe what you are looking for
            </h2>
            <p className="catalogue-assistant-lead">
              Ask in everyday language — season, category, colour, or project — and we will match
              catalogue records.
            </p>
          </div>
        </header>
      )}

      <form className="catalogue-assistant-form" onSubmit={onSubmit}>
        <label className="visually-hidden" htmlFor={inputId}>
          Describe products to search for
        </label>
        <input
          id={inputId}
          type="search"
          className="catalogue-assistant-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='e.g. "Black ladies heel winter mein dikhao"'
          autoComplete="off"
          enterKeyHint="search"
          disabled={loading}
          maxLength={500}
        />
        <button
          type="submit"
          className="mjms-btn mjms-btn-primary mjms-btn-md catalogue-assistant-submit"
          disabled={loading || !query.trim()}
        >
          {loading ? (
            <>
              <Loader2 className="catalogue-assistant-submit-icon" aria-hidden />
              Searching…
            </>
          ) : (
            "Search with AI"
          )}
        </button>
      </form>

      <div className="catalogue-assistant-examples">
        <p className="catalogue-assistant-examples-label">Try an example</p>
        <ul className="catalogue-assistant-examples-list">
          {EXAMPLE_PROMPTS.map((example) => (
            <li key={example}>
              <button
                type="button"
                className="catalogue-assistant-example"
                disabled={loading}
                onClick={() => onExampleClick(example)}
              >
                {example}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {error && (
        <div className="catalogue-assistant-alert" role="alert">
          {error}
        </div>
      )}

      {submitted && !loading && result && (
        <div className="catalogue-assistant-results catalogue-assistant-results-scroll">
          {result.message && (
            <p className="catalogue-assistant-message" role="status">
              {result.message}
            </p>
          )}

          {interpreted && (
            <p className="catalogue-assistant-interpreted">
              <span className="catalogue-assistant-interpreted-label">Understood as</span>
              {interpreted}
            </p>
          )}

          {result.facets && <AssistantFacetsSummary facets={result.facets} />}

          {result.products.length === 0 ? (
            result.message || result.facets ? null : (
              <BrandedStatePanel title="No matching products" sketch="loafer">
                <p className="catalogue-search-empty-text">
                  Nothing in the catalogue matched those filters. Try different wording or use the
                  search and filters below.
                </p>
              </BrandedStatePanel>
            )
          ) : (
            <>
              <p className="catalogue-search-results-count" role="status">
                {result.pagination.total.toLocaleString()} matching product
                {result.pagination.total === 1 ? "" : "s"}
              </p>
              <ProductGrid products={result.products} />
            </>
          )}
        </div>
      )}
    </section>
  );
}
