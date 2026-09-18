import { BrandGeometry } from "@/components/brand/BrandGeometry";

type CatalogueEmptyStateProps = {
  seasonTitle: string;
  categoryLabel: string;
};

export function CatalogueEmptyState({ seasonTitle, categoryLabel }: CatalogueEmptyStateProps) {
  return (
    <div className="collection-empty-products catalogue-empty-state">
      <BrandGeometry variant="empty" />
      <h2 className="collection-empty-title">No catalogue references yet</h2>
      <p className="collection-empty-text">
        <strong>{seasonTitle}</strong> — <strong>{categoryLabel}</strong> currently has no available
        product-development records in the catalogue.
      </p>
    </div>
  );
}
