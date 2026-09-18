import { CategoryCatalogueSection } from "@/components/catalogue/CategoryCatalogueSection";
import { CatalogueErrorState } from "@/components/catalogue/CatalogueErrorState";
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
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ season: string; category: string }>;
  searchParams: Promise<{ page?: string }>;
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

function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

export default async function CategoryCollectionPage({ params, searchParams }: PageProps) {
  const { season: seasonParam, category: categoryParam } = await params;
  const { page: pageParam } = await searchParams;

  if (!isSeasonSlug(seasonParam) || !isCategorySlug(categoryParam)) notFound();

  const season = getSeason(seasonParam);
  const category = getCategory(categoryParam);
  const page = parsePage(pageParam);
  const retryHref =
    page === 1
      ? categoryPath(season.slug, category.slug)
      : `${categoryPath(season.slug, category.slug)}?page=${page}`;

  const result = await getCategoryCatalogue(season.slug, category.slug, page);

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
            <CategoryCatalogueSection season={season} category={category} catalogue={result} />
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
