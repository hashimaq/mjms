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
  const { products, total, page, pageSize, dataSource } = catalogue;

  return (
    <>
      <CatalogueHeader
        season={season}
        category={category}
        totalCount={total}
        dataSource={dataSource}
      />

      {dataSource === "demo" && (
        <p className="catalogue-demo-banner" role="status">
          Demonstration catalogue — visual structure for review until live records and HD product
          visuals are connected.
        </p>
      )}

      <CategoryNav
        season={season}
        activeCategory={category.slug}
        className="collection-page-category-nav"
      />

      <section className="collection-products-region" aria-labelledby="catalogue-heading">
        <h2 id="catalogue-heading" className="visually-hidden">
          {season.title} — {category.label} product catalogue
        </h2>

        {products.length === 0 ? (
          <CatalogueEmptyState seasonTitle={season.title} categoryLabel={category.label} />
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
