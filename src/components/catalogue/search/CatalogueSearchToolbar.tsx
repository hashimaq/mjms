"use client";

import {
  CATEGORIES,
  SEASON_SLUGS,
  SEASONS,
  type CategorySlug,
  type SeasonSlug,
} from "@/lib/collections/config";
import {
  buildCatalogueHref,
  hasRefinementCriteria,
  type CatalogueSearchParams,
} from "@/lib/catalogue/search-params";
import type { CatalogueFilterFacets } from "@/lib/catalogue/types";
import { cn } from "@/lib/utils";
import { Filter, X } from "lucide-react";
import { CatalogueSearchInput } from "./CatalogueSearchInput";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { ActiveFilterChips } from "./ActiveFilterChips";

export type CatalogueSearchScope = "global" | "season" | "category";

type CatalogueSearchToolbarProps = {
  scope: CatalogueSearchScope;
  basePath: string;
  initialParams: CatalogueSearchParams;
  facets: CatalogueFilterFacets;
  dataSource: "live" | "demo";
  lockedSeason?: SeasonSlug;
  lockedCategory?: CategorySlug;
};

type DraftParams = CatalogueSearchParams;

function FilterSelect({
  id,
  label,
  value,
  options,
  onChange,
  className,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  className?: string;
}) {
  if (options.length === 0) return null;
  return (
    <div className={cn("catalogue-filter-field", className)}>
      <label htmlFor={id} className="catalogue-filter-label">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="catalogue-filter-select"
      >
        <option value="">All</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function CategoryFilterPills({
  draft,
  setDraft,
  idPrefix,
  layout,
}: {
  draft: DraftParams;
  setDraft: (next: DraftParams) => void;
  idPrefix: string;
  layout: "inline" | "stack";
}) {
  return (
    <div className={cn("catalogue-filter-field", layout === "stack" && "catalogue-filter-field--stack")}>
      <span className="catalogue-filter-label" id={`${idPrefix}-category-label`}>
        Category
      </span>
      <div
        className="catalogue-filter-pills catalogue-filter-pills--wrap"
        role="group"
        aria-labelledby={`${idPrefix}-category-label`}
      >
        <button
          type="button"
          className={cn("catalogue-filter-pill", !draft.category && "catalogue-filter-pill--active")}
          onClick={() => setDraft({ ...draft, category: undefined, page: 1 })}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            className={cn(
              "catalogue-filter-pill",
              draft.category === cat.slug && "catalogue-filter-pill--active"
            )}
            onClick={() =>
              setDraft({ ...draft, category: cat.slug as CategorySlug, page: 1 })
            }
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SeasonFilterPills({
  draft,
  setDraft,
}: {
  draft: DraftParams;
  setDraft: (next: DraftParams) => void;
}) {
  return (
    <div className="catalogue-filter-field">
      <span className="catalogue-filter-label">Season</span>
      <div className="catalogue-filter-pills" role="group" aria-label="Season">
        <button
          type="button"
          className={cn("catalogue-filter-pill", !draft.season && "catalogue-filter-pill--active")}
          onClick={() => setDraft({ ...draft, season: undefined, page: 1 })}
        >
          All
        </button>
        {SEASON_SLUGS.map((slug) => (
          <button
            key={slug}
            type="button"
            className={cn(
              "catalogue-filter-pill",
              draft.season === slug && "catalogue-filter-pill--active"
            )}
            onClick={() => setDraft({ ...draft, season: slug, page: 1 })}
          >
            {SEASONS[slug].shortTitle}
          </button>
        ))}
      </div>
    </div>
  );
}

function AttributeFilters({
  draft,
  setDraft,
  facets,
  idPrefix,
}: {
  draft: DraftParams;
  setDraft: (next: DraftParams) => void;
  facets: CatalogueFilterFacets;
  idPrefix: string;
}) {
  return (
    <div className="catalogue-filter-attributes">
      <FilterSelect
        id={`${idPrefix}-making`}
        label="Making"
        value={draft.making ?? ""}
        options={facets.making}
        onChange={(making) => setDraft({ ...draft, making: making || undefined, page: 1 })}
      />
      <FilterSelect
        id={`${idPrefix}-type`}
        label="Type"
        value={draft.type ?? ""}
        options={facets.type}
        onChange={(type) => setDraft({ ...draft, type: type || undefined, page: 1 })}
      />
      <FilterSelect
        id={`${idPrefix}-material`}
        label="Material"
        value={draft.material ?? ""}
        options={facets.material}
        onChange={(material) => setDraft({ ...draft, material: material || undefined, page: 1 })}
      />
      <FilterSelect
        id={`${idPrefix}-colour`}
        label="Colour"
        value={draft.colour ?? ""}
        options={facets.colour}
        onChange={(colour) => setDraft({ ...draft, colour: colour || undefined, page: 1 })}
      />
    </div>
  );
}

export function CatalogueSearchToolbar({
  scope,
  basePath,
  initialParams,
  facets,
  dataSource,
  lockedSeason,
  lockedCategory,
}: CatalogueSearchToolbarProps) {
  const router = useRouter();
  const baseId = useId();
  const [draft, setDraft] = useState<DraftParams>(initialParams);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileDraft, setMobileDraft] = useState<DraftParams>(initialParams);

  const hrefOptions = useMemo(
    () => ({
      omitSeason: scope === "season" || scope === "category",
      omitCategory: scope === "category",
    }),
    [scope]
  );

  useEffect(() => {
    setDraft(initialParams);
    setMobileDraft(initialParams);
  }, [initialParams]);

  const withLockedContext = useCallback(
    (params: DraftParams): DraftParams => ({
      ...params,
      season: lockedSeason ?? params.season,
      category: lockedCategory ?? params.category,
    }),
    [lockedSeason, lockedCategory]
  );

  const navigate = useCallback(
    (params: DraftParams) => {
      router.push(buildCatalogueHref(basePath, withLockedContext(params), hrefOptions));
    },
    [router, basePath, withLockedContext, hrefOptions]
  );

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ ...draft, page: 1 });
  };

  const clearAll = () => {
    const empty: DraftParams = { q: "", page: 1 };
    setDraft(empty);
    setMobileDraft(empty);
    router.push(basePath);
    setMobileOpen(false);
  };

  const applyMobile = () => {
    navigate({ ...mobileDraft, page: 1 });
    setMobileOpen(false);
  };

  const showClear = hasRefinementCriteria(initialParams, {
    lockedSeason,
    lockedCategory,
  });

  const showSeasonFilters = scope === "global";
  const showCategoryFilters = scope === "global" || scope === "season";
  const showFilters = true;

  return (
    <div className="catalogue-search-toolbar">
      <form className="catalogue-search-form" onSubmit={onSearchSubmit}>
        <CatalogueSearchInput
          value={draft.q}
          onChange={(q) => setDraft({ ...draft, q })}
          inputClassName="catalogue-search-toolbar-input"
          season={lockedSeason}
          category={lockedCategory}
        />
        <button type="submit" className="mjms-btn mjms-btn-primary mjms-btn-md catalogue-search-submit">
          Search
        </button>
        {showFilters && (
          <button
            type="button"
            className="mjms-btn mjms-btn-secondary mjms-btn-md catalogue-search-filters-mobile"
            onClick={() => {
              setMobileDraft(draft);
              setMobileOpen(true);
            }}
          >
            <Filter className="h-4 w-4" aria-hidden />
            Filters
          </button>
        )}
      </form>

      {showFilters && (
        <div className="catalogue-search-filters-desktop">
          {showSeasonFilters && <SeasonFilterPills draft={draft} setDraft={setDraft} />}
          {showCategoryFilters && (
            <CategoryFilterPills
              draft={draft}
              setDraft={setDraft}
              idPrefix={`${baseId}-d`}
              layout="inline"
            />
          )}
          <AttributeFilters draft={draft} setDraft={setDraft} facets={facets} idPrefix={`${baseId}-d`} />
          <div className="catalogue-search-filters-actions">
            <button
              type="button"
              className="mjms-btn mjms-btn-secondary mjms-btn-sm"
              onClick={() => navigate({ ...draft, page: 1 })}
            >
              Apply filters
            </button>
            {showClear && (
              <button type="button" className="catalogue-search-clear-link" onClick={clearAll}>
                Clear all
              </button>
            )}
          </div>
        </div>
      )}

      {showFilters && (
        <ActiveFilterChips
          params={initialParams}
          basePath={basePath}
          hrefOptions={hrefOptions}
          lockedSeason={lockedSeason}
          lockedCategory={lockedCategory}
        />
      )}

      {dataSource === "demo" && showClear && (
        <p className="catalogue-search-demo-note" role="status">
          Demonstration catalogue — search results are structural samples, not live production records.
        </p>
      )}

      {showFilters && mobileOpen && (
        <div className="catalogue-filter-sheet-root" role="presentation">
          <button
            type="button"
            className="catalogue-filter-sheet-backdrop"
            aria-label="Close filters"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="catalogue-filter-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="catalogue-filter-sheet-title"
          >
            <header className="catalogue-filter-sheet-header">
              <h2 id="catalogue-filter-sheet-title" className="catalogue-filter-sheet-title">
                Filters
              </h2>
              <button
                type="button"
                className="catalogue-filter-sheet-close"
                aria-label="Close"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="catalogue-filter-sheet-body">
              {showSeasonFilters && (
                <SeasonFilterPills draft={mobileDraft} setDraft={setMobileDraft} />
              )}
              {showCategoryFilters && (
                <CategoryFilterPills
                  draft={mobileDraft}
                  setDraft={setMobileDraft}
                  idPrefix={`${baseId}-m`}
                  layout="stack"
                />
              )}
              <AttributeFilters
                draft={mobileDraft}
                setDraft={setMobileDraft}
                facets={facets}
                idPrefix={`${baseId}-m`}
              />
            </div>
            <footer className="catalogue-filter-sheet-footer">
              <button type="button" className="mjms-btn mjms-btn-ghost mjms-btn-md" onClick={clearAll}>
                Clear all
              </button>
              <button type="button" className="mjms-btn mjms-btn-primary mjms-btn-md" onClick={applyMobile}>
                Apply filters
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
