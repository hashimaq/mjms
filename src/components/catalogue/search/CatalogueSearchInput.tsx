"use client";

import type { CategorySlug, SeasonSlug } from "@/lib/collections/config";
import type { CatalogueSuggestion } from "@/lib/catalogue/types";
import {
  CATALOGUE_SUGGEST_DEBOUNCE_MS,
  CATALOGUE_SUGGEST_MIN_CHARS,
} from "@/lib/catalogue/search-constants";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

type CatalogueSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  inputClassName: string;
  wrapClassName?: string;
  iconClassName?: string;
  clearButtonClassName?: string;
  season?: SeasonSlug;
  category?: CategorySlug;
  /** When set, selecting a suggestion navigates here with ?q= instead of product detail. */
  preferSearchNavigation?: boolean;
  searchNavigatePath?: string;
};

export function CatalogueSearchInput({
  value,
  onChange,
  inputClassName,
  wrapClassName,
  iconClassName = "catalogue-search-toolbar-icon",
  clearButtonClassName = "catalogue-search-toolbar-clear",
  season,
  category,
  preferSearchNavigation = false,
  searchNavigatePath = "/search",
}: CatalogueSearchInputProps) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<CatalogueSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchSuggestions = useCallback(
    async (term: string) => {
      const q = term.trim();
      if (q.length < CATALOGUE_SUGGEST_MIN_CHARS) {
        setSuggestions([]);
        setOpen(false);
        setActiveIndex(-1);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      try {
        const params = new URLSearchParams({ q });
        if (season) params.set("season", season);
        if (category) params.set("category", category);
        const res = await fetch(`/api/catalogue/suggestions?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          setSuggestions([]);
          setOpen(false);
          return;
        }
        const data = (await res.json()) as { suggestions?: CatalogueSuggestion[] };
        const next = data.suggestions ?? [];
        setSuggestions(next);
        setOpen(next.length > 0);
        setActiveIndex(-1);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setSuggestions([]);
          setOpen(false);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [season, category]
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void fetchSuggestions(value);
    }, CATALOGUE_SUGGEST_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [value, fetchSuggestions]);

  const selectSuggestion = useCallback(
    (item: CatalogueSuggestion) => {
      setOpen(false);
      setSuggestions([]);
      setActiveIndex(-1);
      if (preferSearchNavigation) {
        onChange(item.projectName);
        router.push(
          `${searchNavigatePath}?q=${encodeURIComponent(item.projectName || item.articleReference || "")}`
        );
        return;
      }
      router.push(`/products/${encodeURIComponent(item.slug)}`);
    },
    [onChange, preferSearchNavigation, router, searchNavigatePath]
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) {
      if (e.key === "Escape") setOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]!);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const showList = open && suggestions.length > 0;

  return (
    <div className={cn("catalogue-search-field-wrap", wrapClassName)}>
      <Search className={iconClassName} aria-hidden />
      <input
        ref={inputRef}
        type="search"
        name="q"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (e.target.value.trim().length >= CATALOGUE_SUGGEST_MIN_CHARS) {
            setOpen(true);
          }
        }}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={onKeyDown}
        placeholder="Search products or projects..."
        aria-label="Search products or projects"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={showList ? listId : undefined}
        aria-activedescendant={
          showList && activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
        }
        className={inputClassName}
        autoComplete="off"
      />
      {value && (
        <button
          type="button"
          className={clearButtonClassName}
          aria-label="Clear search"
          onClick={() => {
            onChange("");
            setSuggestions([]);
            setOpen(false);
            inputRef.current?.focus();
          }}
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {showList && (
        <ul
          id={listId}
          className="catalogue-search-suggestions"
          role="listbox"
          aria-label="Search suggestions"
        >
          {suggestions.map((item, index) => (
            <li key={item.slug} role="presentation">
              <button
                type="button"
                id={`${listId}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={cn(
                  "catalogue-search-suggestion",
                  index === activeIndex && "catalogue-search-suggestion--active"
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectSuggestion(item)}
              >
                <span className="catalogue-search-suggestion-label">Project name</span>
                <span className="catalogue-search-suggestion-name">{item.projectName}</span>
                {item.articleReference && (
                  <>
                    <span className="catalogue-search-suggestion-label">Article</span>
                    <span className="catalogue-search-suggestion-article">{item.articleReference}</span>
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      {loading && value.trim().length >= CATALOGUE_SUGGEST_MIN_CHARS && !showList && (
        <span className="catalogue-search-suggestions-status visually-hidden" role="status">
          Loading suggestions
        </span>
      )}
    </div>
  );
}
