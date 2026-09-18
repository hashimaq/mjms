import { categoryPath, type CategoryDefinition, type SeasonDefinition } from "@/lib/collections/config";
import { cn } from "@/lib/utils";
import Link from "next/link";

type CollectionCategoryCardProps = {
  season: SeasonDefinition;
  category: CategoryDefinition;
};

export function CollectionCategoryCard({ season, category }: CollectionCategoryCardProps) {
  return (
    <Link
      href={categoryPath(season.slug, category.slug)}
      className={cn(
        "collection-category-card",
        `collection-category-card--${season.accent}`
      )}
    >
      <div className="collection-category-card-geo" aria-hidden />
      <div className="collection-category-card-body">
        <h2 className="collection-category-card-title">{category.label}</h2>
        <p className="collection-category-card-text">{category.description}</p>
        <span className="collection-category-card-action">Browse category</span>
      </div>
    </Link>
  );
}
