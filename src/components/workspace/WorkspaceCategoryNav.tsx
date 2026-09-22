import { CategoryNav } from "@/components/collections/CategoryNav";
import type { CategorySlug, SeasonDefinition, SeasonSlug } from "@/lib/collections/config";

type WorkspaceCategoryNavProps = {
  season: SeasonDefinition;
  activeCategory: CategorySlug;
  getCategoryHref: (season: SeasonSlug, category: CategorySlug) => string;
};

export function WorkspaceCategoryNav({
  season,
  activeCategory,
  getCategoryHref,
}: WorkspaceCategoryNavProps) {
  return (
    <div className="mjms-category-nav-block">
      <p className="mjms-category-nav-label">{season.shortTitle} categories</p>
      <CategoryNav
        season={season}
        activeCategory={activeCategory}
        getCategoryHref={getCategoryHref}
        className="mjms-category-nav"
      />
    </div>
  );
}
