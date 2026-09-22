import { CategoryNav } from "@/components/collections/CategoryNav";
import type { CategoryDefinition, SeasonDefinition } from "@/lib/collections/config";
import type { CategoryCatalogueSuccess } from "@/lib/catalogue/types";
import type { ReactNode } from "react";
import { EmptySearchState } from "./search/EmptySearchState";
import { CatalogueEmptyState } from "./CatalogueEmptyState";
import { CatalogueHeader } from "./CatalogueHeader";
import { CataloguePagination } from "./CataloguePagination";
import { ProductGrid } from "./ProductGrid";

type CategoryCatalogueSectionProps = {
  season: SeasonDefinition;
  category: CategoryDefinition;
  catalogue: CategoryCatalogueSuccess;
  refineToolbar?: ReactNode;
  /** When true, search results replace default category pagination listing. */
  searchMode?: boolean;
  searchPagination?: ReactNode;
};

export function CategoryCatalogueSection({
  season,
  category,
  catalogue,
  refineToolbar,
  searchMode = false,
  searchPagination,
}: CategoryCatalogueSectionProps) {
  const { products, total, page, pageSize, dataSource } = catalogue;

  return (
    <>
      <CatalogueHeader
        season={season}
        category={category}
        totalCount={total}
        dataSource={dataSource}
      />

      {refineToolbar && (
        <div className="collection-catalogue-refine">{refineToolbar}</div>
      )}

      {dataSource === "demo" && (
        <p className="catalogue-demo-banner" role="status">
          Demonstration catalogue — visual structure for review until live records and HD product
          visuals are connected.
        </p>
      )}

      <CategoryNav
        season={season}
        activeCategory={category.slug}
        className="collection-page-category-nav"
      />

      {!searchMode && (
        <section className="collection-products-region" aria-labelledby="catalogue-heading">
          <h2 id="catalogue-heading" className="visually-hidden">
            {season.title} — {category.label} product catalogue
          </h2>

          {products.length === 0 ? (
            <CatalogueEmptyState seasonTitle={season.title} categoryLabel={category.label} />
          ) : (
            <>
              <ProductGrid products={products} />
              <CataloguePagination
                season={season.slug}
                category={category.slug}
                page={page}
                pageSize={pageSize}
                total={total}
              />
            </>
          )}
        </section>
      )}

      {searchMode && (
        <section className="collection-products-region" aria-labelledby="catalogue-heading">
          <h2 id="catalogue-heading" className="visually-hidden">
            {season.title} — {category.label} search results
          </h2>
          {products.length === 0 ? (
            <EmptySearchState />
          ) : (
            <>
              <ProductGrid products={products} />
              {searchPagination}
            </>
          )}
        </section>
      )}
    </>
  );
}
