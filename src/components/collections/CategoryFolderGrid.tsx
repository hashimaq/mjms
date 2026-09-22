import {
  CATEGORIES,
  categoryPath,
  type CategorySlug,
  type SeasonDefinition,
  type SeasonSlug,
} from "@/lib/collections/config";
import type { CategorySummary } from "@/lib/catalogue/types";
import { CategoryFolderCard } from "./CategoryFolderCard";

type CategoryFolderGridProps = {
  season: SeasonDefinition;
  summaries: CategorySummary[];
  getCategoryHref?: (season: SeasonSlug, category: CategorySlug) => string;
};

export function CategoryFolderGrid({
  season,
  summaries,
  getCategoryHref = categoryPath,
}: CategoryFolderGridProps) {
  const bySlug = new Map(summaries.map((s) => [s.categorySlug, s]));

  return (
    <div className="category-folder-grid">
      {CATEGORIES.map((category) => {
        const summary = bySlug.get(category.slug) ?? {
          categorySlug: category.slug,
          productCount: null,
          previewSlots: Array.from({ length: 4 }, (_, i) => ({
            imageUrl: null,
            visualIndex: i + 1,
          })),
          dataSource: "demo" as const,
        };
        return (
          <CategoryFolderCard
            key={category.slug}
            season={season}
            category={category}
            summary={summary}
            href={getCategoryHref(season.slug, category.slug)}
          />
        );
      })}
    </div>
  );
}
