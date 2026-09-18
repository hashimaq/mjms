import { categoryPath, type CategorySlug, type SeasonSlug } from "@/lib/collections/config";
import Link from "next/link";

type CataloguePaginationProps = {
  season: SeasonSlug;
  category: CategorySlug;
  page: number;
  pageSize: number;
  total: number;
};

export function CataloguePagination({
  season,
  category,
  page,
  pageSize,
  total,
}: CataloguePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const base = categoryPath(season, category);
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  return (
    <nav className="catalogue-pagination" aria-label="Catalogue pages">
      <p className="catalogue-pagination-summary">
        Page {page} of {totalPages}
        <span className="catalogue-pagination-count"> ({total} products)</span>
      </p>
      <div className="catalogue-pagination-actions">
        {prevPage ? (
          <Link
            href={prevPage === 1 ? base : `${base}?page=${prevPage}`}
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
            href={`${base}?page=${nextPage}`}
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
