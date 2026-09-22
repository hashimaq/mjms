import {
  buildCatalogueHref,
  type BuildCatalogueHrefOptions,
  type CatalogueSearchParams,
} from "@/lib/catalogue/search-params";
import Link from "next/link";

type SearchPaginationProps = {
  basePath: string;
  params: CatalogueSearchParams;
  pageSize: number;
  total: number;
  hrefOptions?: BuildCatalogueHrefOptions;
};

export function SearchPagination({
  basePath,
  params,
  pageSize,
  total,
  hrefOptions,
}: SearchPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const prevPage = params.page > 1 ? params.page - 1 : null;
  const nextPage = params.page < totalPages ? params.page + 1 : null;

  return (
    <nav className="catalogue-pagination" aria-label="Search result pages">
      <p className="catalogue-pagination-summary">
        Page {params.page} of {totalPages}
        <span className="catalogue-pagination-count"> ({total} products)</span>
      </p>
      <div className="catalogue-pagination-actions">
        {prevPage ? (
          <Link
            href={buildCatalogueHref(basePath, { ...params, page: prevPage }, hrefOptions)}
            className="mjms-btn mjms-btn-secondary mjms-btn-sm"
            rel="prev"
          >
            Previous
          </Link>
        ) : (
          <span className="mjms-btn mjms-btn-secondary mjms-btn-sm mjms-btn-disabled" aria-disabled>
            Previous
          </span>
        )}
        {nextPage ? (
          <Link
            href={buildCatalogueHref(basePath, { ...params, page: nextPage }, hrefOptions)}
            className="mjms-btn mjms-btn-secondary mjms-btn-sm"
            rel="next"
          >
            Next
          </Link>
        ) : (
          <span className="mjms-btn mjms-btn-secondary mjms-btn-sm mjms-btn-disabled" aria-disabled>
            Next
          </span>
        )}
      </div>
    </nav>
  );
}
