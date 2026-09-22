import { CategoryCollectionContent } from "@/components/catalogue/CategoryCollectionContent";
import { WorkspaceCategoryGridSkeleton } from "@/components/workspace/WorkspacePageSkeletons";
import { WorkspaceCategoryHeader } from "@/components/workspace/WorkspaceCategoryHeader";
import { WorkspaceCategoryNav } from "@/components/workspace/WorkspaceCategoryNav";
import {
  getCategory,
  getSeason,
  isCategorySlug,
  isSeasonSlug,
  type CategorySlug,
  type SeasonSlug,
} from "@/lib/collections/config";
import {
  buildCatalogueHref,
  hasRefinementCriteria,
  parseCatalogueSearchParams,
} from "@/lib/catalogue/search-params";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type CategoryCollectionViewProps = {
  seasonSlug: string;
  categorySlug: string;
  basePath: string;
  backHref: string;
  backLabel?: string;
  searchNavigatePath: string;
  searchParams: Record<string, string | string[] | undefined>;
  getCategoryHref: (season: SeasonSlug, category: CategorySlug) => string;
  seasonCollectionHref?: string;
};

export function CategoryCollectionView({
  seasonSlug,
  categorySlug,
  basePath,
  backHref,
  backLabel = "Catalogue",
  searchNavigatePath,
  searchParams: raw,
  getCategoryHref,
  seasonCollectionHref: seasonCollectionHrefProp,
}: CategoryCollectionViewProps) {
  if (!isSeasonSlug(seasonSlug) || !isCategorySlug(categorySlug)) notFound();

  const season = getSeason(seasonSlug as SeasonSlug);
  const category = getCategory(categorySlug as CategorySlug);
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

  const seasonCollectionHref =
    seasonCollectionHrefProp ?? `${backHref}#admin-${season.slug}-heading`;
  const searchHref = buildCatalogueHref(searchNavigatePath, {
    q: "",
    page: 1,
    season: season.slug,
    category: category.slug,
  });

  return (
    <div className="mjms-workspace-page mjms-workspace-page--category">
      <WorkspaceCategoryHeader
        season={season}
        category={category}
        catalogueRootHref={backHref}
        catalogueRootLabel={backLabel}
        seasonCollectionHref={seasonCollectionHref}
        searchHref={searchHref}
      />

      <WorkspaceCategoryNav
        season={season}
        activeCategory={category.slug}
        getCategoryHref={getCategoryHref}
      />

      <Suspense fallback={<WorkspaceCategoryGridSkeleton />}>
        <CategoryCollectionContent
          season={season}
          category={category}
          basePath={basePath}
          queryParams={queryParams}
          parsed={parsed}
          hasRefine={hasRefine}
          searchNavigatePath={searchNavigatePath}
        />
      </Suspense>
    </div>
  );
}
