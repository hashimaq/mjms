import { BrandGeometry } from "@/components/brand/BrandGeometry";

type CatalogueEmptyStateProps = {
  seasonTitle: string;
  categoryLabel: string;
  publicPreviewOnly?: boolean;
};

export function CatalogueEmptyState({
  seasonTitle,
  categoryLabel,
  publicPreviewOnly,
}: CatalogueEmptyStateProps) {
  return (
    <div className="collection-empty-products catalogue-empty-state">
      <BrandGeometry variant="empty" />
      <h2 className="collection-empty-title">No products available</h2>
      <p className="collection-empty-text">
        There are currently no catalogue items in <strong>{seasonTitle}</strong> —{" "}
        <strong>{categoryLabel}</strong>.
        {publicPreviewOnly
          ? " Sign in as an employee to browse development records, or items will appear here once the public catalogue is published."
          : " Records will appear here as they are added to this category."}
      </p>
    </div>
  );
}
