import { CatalogueErrorState } from "@/components/catalogue/CatalogueErrorState";
import { ProductGrid } from "@/components/catalogue/ProductGrid";
import { CatalogueSearchToolbar } from "@/components/catalogue/search/CatalogueSearchToolbar";
import {
  EmptySearchState,
  SearchCataloguePrompt,
} from "@/components/catalogue/search/EmptySearchState";
import { SearchPagination } from "@/components/catalogue/search/SearchPagination";
import { CollectionBreadcrumbs } from "@/components/collections/CollectionBreadcrumbs";
import { CollectionPageDecor } from "@/components/collections/CollectionPageDecor";
import { getCatalogueFilterFacets, searchCatalogue } from "@/lib/catalogue/search";
import {
  buildSearchHref,
  hasActiveSearchCriteria,
  parseCatalogueSearchParams,
} from "@/lib/catalogue/search-params";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search catalogue | MJMS Product Development",
  description: "Search MJMS product development catalogue by project name or article reference.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const params = parseCatalogueSearchParams(raw);
  const active = hasActiveSearchCriteria(params);
  const { facets, dataSource } = await getCatalogueFilterFacets();

  const result = active ? await searchCatalogue(params) : null;
  const retryHref = buildSearchHref(params);

  return (
    <article className="collection-page collection-page--search collection-page--catalogue">
      <CollectionPageDecor />
      <div className="collection-page-inner home-container">
        <CollectionBreadcrumbs
          items={[
            { label: "MJMS Product Development", href: "/" },
            { label: "Search catalogue" },
          ]}
        />

        <header className="catalogue-search-header">
          <p className="collection-page-eyebrow">Catalogue</p>
          <h1 className="collection-page-title">Search &amp; filter</h1>
          <p className="collection-page-lead">
            Find footwear development records by project name or article reference.
          </p>
        </header>

        <CatalogueSearchToolbar
          key={retryHref}
          scope="global"
          basePath="/search"
          initialParams={params}
          facets={facets}
          dataSource={dataSource}
        />

        {!active && <SearchCataloguePrompt />}

        {active && result && !result.ok && (
          <CatalogueErrorState message={result.message} retryHref={retryHref} />
        )}

        {active && result?.ok && (
          <section className="collection-products-region" aria-labelledby="search-results-heading">
            <h2 id="search-results-heading" className="visually-hidden">
              Search results
            </h2>
            {result.products.length === 0 ? (
              <EmptySearchState />
            ) : (
              <>
                {result.dataSource === "demo" && (
                  <p className="catalogue-demo-banner" role="status">
                    Demonstration catalogue — visual structure for review until live records are
                    connected.
                  </p>
                )}
                <p className="catalogue-search-results-count" role="status">
                  {result.total.toLocaleString()} matching product{result.total === 1 ? "" : "s"}
                </p>
                <ProductGrid products={result.products} />
                <SearchPagination
                  basePath="/search"
                  params={params}
                  pageSize={result.pageSize}
                  total={result.total}
                />
              </>
            )}
          </section>
        )}
      </div>
    </article>
  );
}
