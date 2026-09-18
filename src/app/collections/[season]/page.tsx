import { CollectionBreadcrumbs } from "@/components/collections/CollectionBreadcrumbs";
import { CollectionCategoryCard } from "@/components/collections/CollectionCategoryCard";
import { CollectionPageDecor } from "@/components/collections/CollectionPageDecor";
import { CategoryNav } from "@/components/collections/CategoryNav";
import {
  CATEGORIES,
  SEASON_SLUGS,
  getSeason,
  isSeasonSlug,
} from "@/lib/collections/config";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ season: string }>;
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

export default async function SeasonCollectionPage({ params }: PageProps) {
  const { season: seasonParam } = await params;
  if (!isSeasonSlug(seasonParam)) notFound();

  const season = getSeason(seasonParam);

  return (
    <article className="collection-page">
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

        <CategoryNav season={season} className="collection-page-category-nav" />

        <section className="collection-category-grid" aria-labelledby="category-grid-heading">
          <h2 id="category-grid-heading" className="collection-section-heading">
            Browse by category
          </h2>
          <div className="collection-category-grid-inner">
            {CATEGORIES.map((category) => (
              <CollectionCategoryCard key={category.slug} season={season} category={category} />
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}
