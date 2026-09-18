import { CollectionBreadcrumbs } from "@/components/collections/CollectionBreadcrumbs";
import type { CategoryDefinition, SeasonDefinition } from "@/lib/collections/config";
import { collectionPath } from "@/lib/collections/config";
import { cn } from "@/lib/utils";

type CatalogueHeaderProps = {
  season: SeasonDefinition;
  category: CategoryDefinition;
  className?: string;
};

export function CatalogueHeader({ season, category, className }: CatalogueHeaderProps) {
  return (
    <header className={cn("catalogue-header", className)}>
      <CollectionBreadcrumbs
        items={[
          { label: "MJMS Product Development", href: "/" },
          { label: season.shortTitle, href: collectionPath(season.slug) },
          { label: category.label },
        ]}
      />
      <h1 className="collection-page-title catalogue-header-title">
        {season.shortTitle.toUpperCase()} — {category.label.toUpperCase()}
      </h1>
      <p className="catalogue-header-subtitle">Product Development Catalogue</p>
    </header>
  );
}
