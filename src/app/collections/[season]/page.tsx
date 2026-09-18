import { CollectionBreadcrumbs } from "@/components/collections/CollectionBreadcrumbs";
import { CategoryFolderGrid } from "@/components/collections/CategoryFolderGrid";
import { CollectionPageDecor } from "@/components/collections/CollectionPageDecor";
import { getSeasonCategorySummaries } from "@/lib/catalogue/category-summaries";
import {
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
  const summaries = await getSeasonCategorySummaries(season.slug);

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
