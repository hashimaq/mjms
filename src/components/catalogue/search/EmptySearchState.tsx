import { SearchX } from "lucide-react";

export function SearchCataloguePrompt() {
  return (
    <div className="catalogue-search-prompt" role="status">
      <p className="catalogue-search-prompt-title">Search the MJMS product development catalogue</p>
      <p className="catalogue-search-prompt-text">
        Enter a project name or article reference, or apply filters to browse matching records.
      </p>
    </div>
  );
}

export function EmptySearchState() {
  return (
    <div className="catalogue-search-empty" role="status">
      <SearchX className="catalogue-search-empty-icon" aria-hidden />
      <p className="catalogue-search-empty-title">No products found</p>
      <p className="catalogue-search-empty-text">
        Try another project name, article reference, or filter combination.
      </p>
    </div>
  );
}
