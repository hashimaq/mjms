import { CategoryNav } from "@/components/collections/CategoryNav";
import type { CategoryDefinition, SeasonDefinition } from "@/lib/collections/config";
import type { CategoryCatalogueSuccess } from "@/lib/catalogue/types";
import { CatalogueEmptyState } from "./CatalogueEmptyState";
import { CatalogueHeader } from "./CatalogueHeader";
import { CataloguePagination } from "./CataloguePagination";
import { ProductGrid } from "./ProductGrid";

type CategoryCatalogueSectionProps = {
  season: SeasonDefinition;
  category: CategoryDefinition;
  catalogue: CategoryCatalogueSuccess;
};

export function CategoryCatalogueSection({
  season,
  category,
  catalogue,
}: CategoryCatalogueSectionProps) {
  const { products, total, page, pageSize, publicPreviewOnly } = catalogue;

  return (
    <>
      <CatalogueHeader season={season} category={category} />

      <CategoryNav
        season={season}
        activeCategory={category.slug}
        className="collection-page-category-nav"
      />

      <section className="collection-products-region" aria-labelledby="catalogue-heading">
        <h2 id="catalogue-heading" className="catalogue-section-label">
          Product catalogue
          {total > 0 && (
            <span className="catalogue-section-count">{total.toLocaleString()} items</span>
          )}
        </h2>

        {products.length === 0 ? (
          <CatalogueEmptyState
            seasonTitle={season.title}
            categoryLabel={category.label}
            publicPreviewOnly={publicPreviewOnly}
          />
        ) : (
          <>
            <ProductGrid products={products} />
            <CataloguePagination
              season={season.slug}
              category={category.slug}
              page={page}
              pageSize={pageSize}
              total={total}
            />
          </>
        )}
      </section>
    </>
  );
}
