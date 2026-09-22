import { CATEGORIES, SEASONS, type CategorySlug, type SeasonSlug } from "@/lib/collections/config";
import {
  buildCatalogueHref,
  type BuildCatalogueHrefOptions,
  type CatalogueSearchParams,
} from "@/lib/catalogue/search-params";
import Link from "next/link";

type ActiveFilterChipsProps = {
  params: CatalogueSearchParams;
  basePath: string;
  hrefOptions?: BuildCatalogueHrefOptions;
  lockedSeason?: SeasonSlug;
  lockedCategory?: CategorySlug;
};

function labelForSeason(slug: SeasonSlug) {
  return SEASONS[slug].shortTitle;
}

function labelForCategory(slug: CategorySlug) {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

export function ActiveFilterChips({
  params,
  basePath,
  hrefOptions,
  lockedSeason,
  lockedCategory,
}: ActiveFilterChipsProps) {
  const chips: { key: string; label: string; href: string }[] = [];

  if (params.season && params.season !== lockedSeason) {
    chips.push({
      key: "season",
      label: labelForSeason(params.season),
      href: buildCatalogueHref(
        basePath,
        { ...params, season: undefined, page: 1 },
        hrefOptions
      ),
    });
  }
  if (params.category && params.category !== lockedCategory) {
    chips.push({
      key: "category",
      label: labelForCategory(params.category),
      href: buildCatalogueHref(
        basePath,
        { ...params, category: undefined, page: 1 },
        hrefOptions
      ),
    });
  }
  if (params.making) {
    chips.push({
      key: "making",
      label: `Making: ${params.making}`,
      href: buildCatalogueHref(
        basePath,
        { ...params, making: undefined, page: 1 },
        hrefOptions
      ),
    });
  }
  if (params.type) {
    chips.push({
      key: "type",
      label: `Type: ${params.type}`,
      href: buildCatalogueHref(basePath, { ...params, type: undefined, page: 1 }, hrefOptions),
    });
  }
  if (params.material) {
    chips.push({
      key: "material",
      label: `Material: ${params.material}`,
      href: buildCatalogueHref(
        basePath,
        { ...params, material: undefined, page: 1 },
        hrefOptions
      ),
    });
  }
  if (params.colour) {
    chips.push({
      key: "colour",
      label: `Colour: ${params.colour}`,
      href: buildCatalogueHref(
        basePath,
        { ...params, colour: undefined, page: 1 },
        hrefOptions
      ),
    });
  }

  if (chips.length === 0) return null;

  return (
    <ul className="catalogue-active-filters" aria-label="Active filters">
      {chips.map((chip) => (
        <li key={chip.key}>
          <Link href={chip.href} className="catalogue-active-filter-chip">
            {chip.label}
            <span className="catalogue-active-filter-chip-x" aria-hidden>
              ×
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
