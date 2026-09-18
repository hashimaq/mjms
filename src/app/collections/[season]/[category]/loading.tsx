import { ProductGridSkeleton } from "@/components/catalogue/ProductCardSkeleton";
import { CollectionPageDecor } from "@/components/collections/CollectionPageDecor";

export default function CategoryCatalogueLoading() {
  return (
    <article className="collection-page collection-page--category collection-page--catalogue">
      <CollectionPageDecor />
      <div className="collection-page-inner home-container">
        <div className="catalogue-header catalogue-header--skeleton" aria-hidden>
          <div className="catalogue-skeleton-line catalogue-skeleton-line--breadcrumb catalogue-skeleton-shimmer" />
          <div className="catalogue-skeleton-line catalogue-skeleton-line--title catalogue-skeleton-shimmer" />
          <div className="catalogue-skeleton-line catalogue-skeleton-line--lead catalogue-skeleton-shimmer" />
        </div>
        <ProductGridSkeleton count={8} />
      </div>
    </article>
  );
}
