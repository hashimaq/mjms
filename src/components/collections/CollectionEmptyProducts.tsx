import { BrandGeometry } from "@/components/brand/BrandGeometry";

type CollectionEmptyProductsProps = {
  categoryLabel: string;
};

export function CollectionEmptyProducts({ categoryLabel }: CollectionEmptyProductsProps) {
  return (
    <div className="collection-empty-products">
      <BrandGeometry variant="empty" />
      <h2 className="collection-empty-title">No products available yet</h2>
      <p className="collection-empty-text">
        Products for <strong>{categoryLabel}</strong> will appear here once they are added to the
        catalogue. Project names and development records remain searchable for employees in the
        projects area.
      </p>
    </div>
  );
}
