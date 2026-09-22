import { CategoryCollectionView } from "@/components/catalogue/CategoryCollectionView";
import {
  adminCategoryPath,
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
    title: `${season} ${category} | Admin catalogue | MJMS`,
  };
}

export default async function AdminCategoryCataloguePage({ params, searchParams }: PageProps) {
  const { season, category } = await params;
  if (!isSeasonSlug(season) || !isCategorySlug(category)) notFound();
  const raw = await searchParams;
  const basePath = adminCategoryPath(season as SeasonSlug, category as CategorySlug);

  return (
    <CategoryCollectionView
      seasonSlug={season}
      categorySlug={category}
      basePath={basePath}
      backHref="/admin/catalogue"
      backLabel="Catalogue"
      searchNavigatePath="/admin/search"
      searchParams={raw}
      getCategoryHref={adminCategoryPath}
      seasonCollectionHref={`/admin/catalogue#admin-${season}-heading`}
    />
  );
}
