import { CollectionBreadcrumbs } from "@/components/collections/CollectionBreadcrumbs";
import type { CategoryDefinition, SeasonDefinition } from "@/lib/collections/config";
import { collectionPath } from "@/lib/collections/config";
import type { CatalogueDataSource } from "@/lib/catalogue/types";
import { cn } from "@/lib/utils";
import { CatalogueBoard } from "./CatalogueBoard";

type CatalogueHeaderProps = {
  season: SeasonDefinition;
  category: CategoryDefinition;
  totalCount?: number;
  dataSource?: CatalogueDataSource;
  className?: string;
};

export function CatalogueHeader({
  season,
  category,
  totalCount,
  dataSource,
  className,
}: CatalogueHeaderProps) {
  return (
    <header className={cn("catalogue-header", className)}>
      <CollectionBreadcrumbs
        items={[
          { label: "MJMS Product Development", href: "/" },
          { label: season.shortTitle, href: collectionPath(season.slug) },
          { label: category.label },
        ]}
      />

      <CatalogueBoard season={season} category={category} />

      <div className="catalogue-header-titles">
        <p className="catalogue-header-season">{season.shortTitle.toUpperCase()}</p>
        <h1 className="catalogue-header-category">{category.label.toUpperCase()}</h1>
        <p className="catalogue-header-subtitle">Product Development Catalogue</p>
        {typeof totalCount === "number" && totalCount > 0 && (
          <p className="catalogue-header-count">
            {totalCount.toLocaleString()} catalogue reference{totalCount === 1 ? "" : "s"}
            {dataSource === "demo" ? " (demonstration)" : ""}
          </p>
        )}
      </div>
    </header>
  );
}
