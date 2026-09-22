import { AddCatalogueProductWizard } from "@/components/catalogue/AddCatalogueProductWizard";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";

export default function AdminNewProductPage() {
  return (
    <div className="mjms-workspace-page">
      <WorkspacePageHeader
        variant="hero"
        eyebrow="Product development"
        title="Add product"
        lead="Create a catalogue record, then attach primary and gallery photos in one workflow."
      />
      <div className="mjms-panel mjms-panel--form">
        <AddCatalogueProductWizard />
      </div>
    </div>
  );
}
