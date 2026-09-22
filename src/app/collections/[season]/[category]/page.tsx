import { CategoryCatalogueSection } from "@/components/catalogue/CategoryCatalogueSection";
import { CatalogueErrorState } from "@/components/catalogue/CatalogueErrorState";
import { ProductGrid } from "@/components/catalogue/ProductGrid";
import { CatalogueSearchToolbar } from "@/components/catalogue/search/CatalogueSearchToolbar";
import { SearchPagination } from "@/components/catalogue/search/SearchPagination";
import { CollectionPageDecor } from "@/components/collections/CollectionPageDecor";
import {
  CATEGORIES,
  SEASON_SLUGS,
  categoryPath,
  collectionPath,
  getCategory,
  getSeason,
  isCategorySlug,
  isSeasonSlug,
  type CategorySlug,
} from "@/lib/collections/config";
import { getCategoryCatalogue } from "@/lib/catalogue/queries";
import { getCatalogueFilterFacets, searchCatalogue } from "@/lib/catalogue/search";
import {
  buildCatalogueHref,
  hasRefinementCriteria,
  parseCatalogueSearchParams,
} from "@/lib/catalogue/search-params";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ season: string; category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function generateStaticParams() {
  const params: { season: string; category: CategorySlug }[] = [];
  for (const season of SEASON_SLUGS) {
    for (const cat of CATEGORIES) {
      params.push({ season, category: cat.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { season: seasonParam, category: categoryParam } = await params;
  if (!isSeasonSlug(seasonParam) || !isCategorySlug(categoryParam)) {
    return { title: "Category | MJMS Product Development" };
  }
  const season = getSeason(seasonParam);
  const category = getCategory(categoryParam);
  return {
    title: `${season.shortTitle} ${category.label} Collection — MJMS Product Development`,
    description: `${season.shortTitle} ${category.label} product development catalogue — MJMS Product Development.`,
  };
}

export default async function CategoryCollectionPage({ params, searchParams }: PageProps) {
  const { season: seasonParam, category: categoryParam } = await params;
  const raw = await searchParams;

  if (!isSeasonSlug(seasonParam) || !isCategorySlug(categoryParam)) notFound();

  const season = getSeason(seasonParam);
  const category = getCategory(categoryParam);
  const basePath = categoryPath(season.slug, category.slug);
  const parsed = parseCatalogueSearchParams(raw);
  const queryParams = {
    ...parsed,
    season: season.slug,
    category: category.slug,
  };
  const hasRefine = hasRefinementCriteria(parsed, {
    lockedSeason: season.slug,
    lockedCategory: category.slug,
  });

  const { facets, dataSource: facetsSource } = await getCatalogueFilterFacets();
  const retryHref = buildCatalogueHref(basePath, queryParams, {
    omitSeason: true,
    omitCategory: true,
  });

  if (hasRefine) {
    const result = await searchCatalogue(queryParams);

    return (
      <article className="collection-page collection-page--category collection-page--catalogue">
        <CollectionPageDecor />
        <div className="collection-page-inner home-container">
          {!result.ok ? (
            <>
              <CatalogueErrorState message={result.message} retryHref={retryHref} />
              <div className="collection-page-back">
                <Link
                  href={collectionPath(season.slug)}
                  className="mjms-btn mjms-btn-secondary mjms-btn-sm"
                >
                  ← {season.shortTitle} categories
                </Link>
              </div>
            </>
          ) : (
            <>
              <CategoryCatalogueSection
                season={season}
                category={category}
                catalogue={result}
                refineToolbar={
                  <CatalogueSearchToolbar
                    key={retryHref}
                    scope="category"
                    basePath={basePath}
                    initialParams={parsed}
                    facets={facets}
                    dataSource={facetsSource}
                    lockedSeason={season.slug}
                    lockedCategory={category.slug}
                  />
                }
                searchMode
                searchPagination={
                  result.products.length > 0 ? (
                    <SearchPagination
                      basePath={basePath}
                      params={queryParams}
                      pageSize={result.pageSize}
                      total={result.total}
                      hrefOptions={{ omitSeason: true, omitCategory: true }}
                    />
                  ) : null
                }
              />
              <div className="collection-page-back">
                <Link
                  href={collectionPath(season.slug)}
                  className="mjms-btn mjms-btn-secondary mjms-btn-sm"
                >
                  ← {season.shortTitle} categories
                </Link>
              </div>
            </>
          )}
        </div>
      </article>
    );
  }

  const page = parsed.page;
  const result = await getCategoryCatalogue(season.slug, category.slug, page);
  const listRetryHref =
    page === 1
      ? basePath
      : buildCatalogueHref(basePath, { q: "", page, season: season.slug, category: category.slug }, {
          omitSeason: true,
          omitCategory: true,
        });

  return (
    <article className="collection-page collection-page--category collection-page--catalogue">
      <CollectionPageDecor />
      <div className="collection-page-inner home-container">
        {!result.ok ? (
          <>
            <CatalogueErrorState message={result.message} retryHref={listRetryHref} />
            <div className="collection-page-back">
              <Link
                href={collectionPath(season.slug)}
                className="mjms-btn mjms-btn-secondary mjms-btn-sm"
              >
                ← {season.shortTitle} categories
              </Link>
            </div>
          </>
        ) : (
          <>
            <CategoryCatalogueSection
              season={season}
              category={category}
              catalogue={result}
              refineToolbar={
                <CatalogueSearchToolbar
                  key={basePath}
                  scope="category"
                  basePath={basePath}
                  initialParams={parsed}
                  facets={facets}
                  dataSource={facetsSource}
                  lockedSeason={season.slug}
                  lockedCategory={category.slug}
                />
              }
            />
            <div className="collection-page-back">
              <Link
                href={collectionPath(season.slug)}
                className="mjms-btn mjms-btn-secondary mjms-btn-sm"
              >
                ← {season.shortTitle} categories
              </Link>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
