"use client";

import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";

type ProjectSearchProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function ProjectSearch({ value, onChange, className }: ProjectSearchProps) {
  return (
    <div className={cn("catalog-search", className)}>
      <label htmlFor="project-search" className="catalog-search-label">
        Search projects
      </label>
      <div className="catalog-search-field">
        <Search className="catalog-search-icon" aria-hidden />
        <input
          id="project-search"
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search product projects by name…"
          aria-label="Search projects"
          className="catalog-search-input"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="catalog-search-clear"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
