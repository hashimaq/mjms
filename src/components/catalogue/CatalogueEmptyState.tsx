import { BrandedStatePanel } from "@/components/brand/BrandedStatePanel";

type CatalogueEmptyStateProps = {
  seasonTitle: string;
  categoryLabel: string;
};

export function CatalogueEmptyState({ seasonTitle, categoryLabel }: CatalogueEmptyStateProps) {
  return (
    <BrandedStatePanel title="No projects found" sketch="sandal" className="catalogue-empty-state">
      <p className="collection-empty-text">
        There are currently no development projects in{" "}
        <strong>
          {seasonTitle} — {categoryLabel}
        </strong>
        .
      </p>
    </BrandedStatePanel>
  );
}
