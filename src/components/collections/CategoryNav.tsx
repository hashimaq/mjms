import {
  CATEGORIES,
  categoryPath,
  type CategorySlug,
  type SeasonDefinition,
} from "@/lib/collections/config";
import { cn } from "@/lib/utils";
import Link from "next/link";

type CategoryNavProps = {
  season: SeasonDefinition;
  activeCategory?: CategorySlug;
  className?: string;
};

export function CategoryNav({ season, activeCategory, className }: CategoryNavProps) {
  return (
    <nav
      className={cn("category-nav", className)}
      aria-label={`${season.shortTitle} categories`}
    >
      <ul className="category-nav-list">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.slug;
          return (
            <li key={cat.slug}>
              <Link
                href={categoryPath(season.slug, cat.slug)}
                className={cn(
                  "category-nav-link",
                  `category-nav-link--${season.accent}`,
                  isActive && "category-nav-link--active"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {cat.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
