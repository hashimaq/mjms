import { CollectionBreadcrumbs } from "@/components/collections/CollectionBreadcrumbs";
import type { CategoryDefinition, SeasonDefinition } from "@/lib/collections/config";
import Link from "next/link";

type WorkspaceCategoryHeaderProps = {
  season: SeasonDefinition;
  category: CategoryDefinition;
  catalogueRootHref: string;
  catalogueRootLabel?: string;
  seasonCollectionHref: string;
  searchHref: string;
};

export function WorkspaceCategoryHeader({
  season,
  category,
  catalogueRootHref,
  catalogueRootLabel = "Catalogue",
  seasonCollectionHref,
  searchHref,
}: WorkspaceCategoryHeaderProps) {
  const description = `${season.shortTitle} ${category.label.toLowerCase()} development projects`;

  return (
    <header className="mjms-category-header mjms-page-header--hero">
      <CollectionBreadcrumbs
        className="mjms-category-breadcrumbs"
        items={[
          { label: catalogueRootLabel, href: catalogueRootHref },
          { label: season.title, href: seasonCollectionHref },
          { label: category.label },
        ]}
      />

      <div className="mjms-category-header-body">
        <div className="mjms-category-header-main">
          <p className="mjms-page-header-eyebrow">{season.title}</p>
          <h1 className="mjms-category-title">{category.label}</h1>
          <p className="mjms-page-header-lead">{description}</p>
        </div>

        <div className="mjms-page-header-actions mjms-category-header-actions">
          <Link href={seasonCollectionHref} className="mjms-btn mjms-btn-secondary mjms-btn-md">
            ← {season.title}
          </Link>
          <Link href={searchHref} className="mjms-btn mjms-btn-primary mjms-btn-md" prefetch>
            Search catalogue
          </Link>
        </div>
      </div>
    </header>
  );
}
