import { BrandGeometry } from "@/components/brand/BrandGeometry";

type CatalogueEmptyStateProps = {
  seasonTitle: string;
  categoryLabel: string;
};

export function CatalogueEmptyState({ seasonTitle, categoryLabel }: CatalogueEmptyStateProps) {
  return (
    <div className="collection-empty-products catalogue-empty-state mjms-category-empty">
      <BrandGeometry variant="empty" />
      <h2 className="collection-empty-title">No projects found</h2>
      <p className="collection-empty-text">
        There are currently no development projects in{" "}
        <strong>
          {seasonTitle} — {categoryLabel}
        </strong>
        .
      </p>
    </div>
  );
}
