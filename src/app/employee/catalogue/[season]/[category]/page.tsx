import { CategoryCollectionView } from "@/components/catalogue/CategoryCollectionView";
import {
  employeeCategoryPath,
  isCategorySlug,
  isSeasonSlug,
  type CategorySlug,
  type SeasonSlug,
} from "@/lib/collections/config";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ season: string; category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { season, category } = await params;
  return {
    title: `${season} ${category} | Employee catalogue | MJMS`,
  };
}

export default async function EmployeeCategoryCataloguePage({ params, searchParams }: PageProps) {
  const { season, category } = await params;
  if (!isSeasonSlug(season) || !isCategorySlug(category)) notFound();
  const raw = await searchParams;
  const basePath = employeeCategoryPath(season as SeasonSlug, category as CategorySlug);

  return (
    <CategoryCollectionView
      seasonSlug={season}
      categorySlug={category}
      basePath={basePath}
      backHref="/employee/catalogue"
      backLabel="Catalogue"
      searchNavigatePath="/employee/search"
      searchParams={raw}
      getCategoryHref={employeeCategoryPath}
      seasonCollectionHref={`/employee/catalogue#employee-${season}-heading`}
    />
  );
}
