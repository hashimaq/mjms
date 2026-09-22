import { CatalogueErrorState } from "@/components/catalogue/CatalogueErrorState";
import { ProductGrid } from "@/components/catalogue/ProductGrid";
import { CatalogueSearchToolbar } from "@/components/catalogue/search/CatalogueSearchToolbar";
import { EmptySearchState } from "@/components/catalogue/search/EmptySearchState";
import { SearchPagination } from "@/components/catalogue/search/SearchPagination";
import { CollectionBreadcrumbs } from "@/components/collections/CollectionBreadcrumbs";
import { CategoryFolderGrid } from "@/components/collections/CategoryFolderGrid";
import { CollectionPageDecor } from "@/components/collections/CollectionPageDecor";
import { getSeasonCategorySummaries } from "@/lib/catalogue/category-summaries";
import { getCatalogueFilterFacets, searchCatalogue } from "@/lib/catalogue/search";
import {
  buildCatalogueHref,
  hasRefinementCriteria,
  parseCatalogueSearchParams,
} from "@/lib/catalogue/search-params";
import {
  collectionPath,
  getSeason,
  isSeasonSlug,
  SEASON_SLUGS,
} from "@/lib/collections/config";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ season: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function generateStaticParams() {
  return SEASON_SLUGS.map((season) => ({ season }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { season: seasonParam } = await params;
  if (!isSeasonSlug(seasonParam)) {
    return { title: "Collection | MJMS Product Development" };
  }
  const season = getSeason(seasonParam);
  return {
    title: `${season.title} | MJMS Product Development`,
    description: season.description,
  };
}

export default async function SeasonCollectionPage({ params, searchParams }: PageProps) {
  const { season: seasonParam } = await params;
  if (!isSeasonSlug(seasonParam)) notFound();

  const season = getSeason(seasonParam);
  const basePath = collectionPath(season.slug);
  const parsed = parseCatalogueSearchParams(await searchParams);
  const queryParams = { ...parsed, season: season.slug };
  const hasRefine = hasRefinementCriteria(parsed, { lockedSeason: season.slug });

  const summaries = await getSeasonCategorySummaries(season.slug);
  const { facets, dataSource: facetsSource } = await getCatalogueFilterFacets();
  const result = hasRefine ? await searchCatalogue(queryParams) : null;
  const retryHref = buildCatalogueHref(basePath, queryParams, { omitSeason: true });
  const toolbarKey = retryHref;

  return (
    <article className="collection-page collection-page--season">
      <CollectionPageDecor />
      <div className="collection-page-inner home-container">
        <CollectionBreadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: season.title },
          ]}
        />

        <header className="collection-page-header">
          <p className="collection-page-eyebrow">Collection</p>
          <h1 className="collection-page-title">{season.title}</h1>
          <p className="collection-page-lead">{season.description}</p>
        </header>

        <div className="collection-catalogue-refine">
          <h2 className="collection-section-heading">Search this collection</h2>
          <CatalogueSearchToolbar
            key={toolbarKey}
            scope="season"
            basePath={basePath}
            initialParams={parsed}
            facets={facets}
            dataSource={facetsSource}
            lockedSeason={season.slug}
          />
        </div>

        {hasRefine && result && !result.ok && (
          <CatalogueErrorState message={result.message} retryHref={retryHref} />
        )}

        {hasRefine && result?.ok && (
          <section
            className="collection-products-region collection-search-results"
            aria-labelledby="season-search-results-heading"
          >
            <h2 id="season-search-results-heading" className="collection-section-heading">
              {result.products.length > 0 ? (
                <>
                  Matching products
                  <span className="catalogue-section-count"> ({result.total})</span>
                </>
              ) : (
                "Search results"
              )}
            </h2>
            {result.dataSource === "demo" && result.products.length > 0 && (
              <p className="catalogue-demo-banner" role="status">
                Demonstration catalogue — structural samples for this season search.
              </p>
            )}
            {result.products.length === 0 ? (
              <EmptySearchState />
            ) : (
              <>
                <ProductGrid products={result.products} />
                <SearchPagination
                  basePath={basePath}
                  params={queryParams}
                  pageSize={result.pageSize}
                  total={result.total}
                  hrefOptions={{ omitSeason: true }}
                />
              </>
            )}
          </section>
        )}

        <section className="collection-folder-wall" aria-labelledby="category-grid-heading">
          <h2 id="category-grid-heading" className="collection-section-heading">
            Product development folders
          </h2>
          <CategoryFolderGrid season={season} summaries={summaries} />
        </section>
      </div>
    </article>
  );
}
