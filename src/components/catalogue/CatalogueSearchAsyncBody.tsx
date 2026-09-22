import { CatalogueErrorState } from "@/components/catalogue/CatalogueErrorState";
import { ProductGrid } from "@/components/catalogue/ProductGrid";
import { CatalogueSearchToolbar } from "@/components/catalogue/search/CatalogueSearchToolbar";
import { ActiveFilterChips } from "@/components/catalogue/search/ActiveFilterChips";
import {
  EmptySearchState,
  SearchCataloguePrompt,
} from "@/components/catalogue/search/EmptySearchState";
import { SearchPagination } from "@/components/catalogue/search/SearchPagination";
import { getCatalogueFilterFacets, searchCatalogue } from "@/lib/catalogue/search";
import {
  buildCatalogueHref,
  hasActiveSearchCriteria,
  type CatalogueSearchParams,
} from "@/lib/catalogue/search-params";

type CatalogueSearchAsyncBodyProps = {
  basePath: string;
  params: CatalogueSearchParams;
  searchNavigatePath?: string;
};

export async function CatalogueSearchAsyncBody({
  basePath,
  params,
  searchNavigatePath,
}: CatalogueSearchAsyncBodyProps) {
  const active = hasActiveSearchCriteria(params);
  const retryHref = buildCatalogueHref(basePath, params);

  const [{ facets, dataSource }, result] = await Promise.all([
    getCatalogueFilterFacets(),
    active ? searchCatalogue(params) : Promise.resolve(null),
  ]);

  return (
    <>
      <div className="mjms-search-panel">
        <div className="mjms-search-panel-intro">
          <h2 className="mjms-search-panel-title">Search &amp; filters</h2>
          <p className="mjms-search-panel-lead">
            Search by project or article, then refine with season, category, and product attributes.
          </p>
        </div>
        <CatalogueSearchToolbar
          key={retryHref}
          scope="global"
          basePath={basePath}
          initialParams={params}
          facets={facets}
          dataSource={dataSource}
          searchNavigatePath={searchNavigatePath ?? basePath}
          workspaceLayout
        />
      </div>

      {!active && (
        <div className="mjms-search-prompt-region">
          <SearchCataloguePrompt />
        </div>
      )}

      {active && result && !result.ok && (
        <div className="mjms-search-results-region">
          <CatalogueErrorState message={result.message} retryHref={retryHref} />
        </div>
      )}

      {active && result?.ok && (
        <section
          className="mjms-search-results-region collection-products-region"
          aria-labelledby="workspace-search-results-heading"
        >
          <header className="mjms-search-results-head">
            <h2 id="workspace-search-results-heading" className="mjms-search-results-title">
              Search results
            </h2>
            <ActiveFilterChips
              params={params}
              basePath={basePath}
              lockedSeason={undefined}
              lockedCategory={undefined}
            />
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
              <p className="catalogue-search-results-count" role="status">
                {result.total.toLocaleString()} matching product{result.total === 1 ? "" : "s"}
              </p>
              <ProductGrid products={result.products} />
              <SearchPagination
                basePath={basePath}
                params={params}
                pageSize={result.pageSize}
                total={result.total}
              />
            </>
          )}
        </section>
      )}
    </>
  );
}
