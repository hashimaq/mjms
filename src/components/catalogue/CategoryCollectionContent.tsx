import { CatalogueErrorState } from "@/components/catalogue/CatalogueErrorState";
import { CatalogueEmptyState } from "@/components/catalogue/CatalogueEmptyState";
import { CataloguePagination } from "@/components/catalogue/CataloguePagination";
import { ProductGrid } from "@/components/catalogue/ProductGrid";
import { CatalogueSearchToolbar } from "@/components/catalogue/search/CatalogueSearchToolbar";
import { EmptySearchState } from "@/components/catalogue/search/EmptySearchState";
import { SearchPagination } from "@/components/catalogue/search/SearchPagination";
import type { CategoryDefinition, SeasonDefinition } from "@/lib/collections/config";
import { getCategoryCatalogue } from "@/lib/catalogue/queries";
import { getCatalogueFilterFacets, searchCatalogue } from "@/lib/catalogue/search";
import {
  buildCatalogueHref,
  type CatalogueSearchParams,
} from "@/lib/catalogue/search-params";
import type { CategorySlug, SeasonSlug } from "@/lib/collections/config";

type CategoryCollectionContentProps = {
  season: SeasonDefinition;
  category: CategoryDefinition;
  basePath: string;
  queryParams: CatalogueSearchParams;
  parsed: CatalogueSearchParams;
  hasRefine: boolean;
  searchNavigatePath: string;
};

export async function CategoryCollectionContent({
  season,
  category,
  basePath,
  queryParams,
  parsed,
  hasRefine,
  searchNavigatePath,
}: CategoryCollectionContentProps) {
  const hrefOptions = { omitSeason: true, omitCategory: true } as const;
  const retryHref = buildCatalogueHref(basePath, queryParams, hrefOptions);

  if (hasRefine) {
    const [facetsResult, result] = await Promise.all([
      getCatalogueFilterFacets(),
      searchCatalogue(queryParams),
    ]);

    if (!result.ok) {
      return (
        <div className="mjms-category-results">
          <CatalogueErrorState message={result.message} retryHref={retryHref} />
        </div>
      );
    }

    const { facets, dataSource: facetsSource } = facetsResult;

    return (
      <>
        <div className="mjms-category-refine-panel">
          <CatalogueSearchToolbar
            key={retryHref}
            scope="category"
            basePath={basePath}
            initialParams={parsed}
            facets={facets}
            dataSource={facetsSource}
            lockedSeason={season.slug}
            lockedCategory={category.slug}
            searchNavigatePath={searchNavigatePath}
            workspaceLayout
          />
        </div>

        <section className="mjms-category-results" aria-labelledby="category-results-heading">
          <header className="mjms-category-results-head">
            <h2 id="category-results-heading" className="mjms-category-results-title">
              Filtered results
            </h2>
            <p className="mjms-category-results-count" role="status">
              {result.total.toLocaleString()} matching product{result.total === 1 ? "" : "s"}
            </p>
          </header>

          {result.products.length === 0 ? (
            <EmptySearchState />
          ) : (
            <>
              {result.dataSource === "demo" && (
                <p className="catalogue-demo-banner" role="status">
                  Demonstration catalogue — structural samples until live data is connected.
                </p>
              )}
              <ProductGrid products={result.products} className="catalogue-product-grid--workspace" />
              <SearchPagination
                basePath={basePath}
                params={queryParams}
                pageSize={result.pageSize}
                total={result.total}
                hrefOptions={hrefOptions}
              />
            </>
          )}
        </section>
      </>
    );
  }

  const page = parsed.page;
  const result = await getCategoryCatalogue(
    season.slug as SeasonSlug,
    category.slug as CategorySlug,
    page
  );

  const listRetryHref =
    page === 1
      ? basePath
      : buildCatalogueHref(
          basePath,
          { q: "", page, season: season.slug, category: category.slug },
          hrefOptions
        );

  if (!result.ok) {
    return (
      <div className="mjms-category-results">
        <CatalogueErrorState message={result.message} retryHref={listRetryHref} />
      </div>
    );
  }

  const { products, total, pageSize, dataSource } = result;

  return (
    <section className="mjms-category-results" aria-labelledby="category-results-heading">
      <header className="mjms-category-results-head">
        <h2 id="category-results-heading" className="visually-hidden">
          {season.title} — {category.label} products
        </h2>
        <p className="mjms-category-results-count" role="status">
          {total.toLocaleString()} development project{total === 1 ? "" : "s"}
        </p>
        <p className="mjms-category-results-context">
          {season.shortTitle} {category.label} catalogue
        </p>
      </header>

      {dataSource === "demo" && (
        <p className="catalogue-demo-banner" role="status">
          Demonstration catalogue — visual structure for review until live records are connected.
        </p>
      )}

      {products.length === 0 ? (
        <CatalogueEmptyState seasonTitle={season.title} categoryLabel={category.label} />
      ) : (
        <>
          <ProductGrid products={products} className="catalogue-product-grid--workspace" />
          <CataloguePagination
            basePath={basePath}
            season={season.slug}
            category={category.slug}
            page={page}
            pageSize={pageSize}
            total={total}
          />
        </>
      )}
    </section>
  );
}
