import { EditCatalogueProductForm } from "@/components/catalogue/EditCatalogueProductForm";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { requireAdmin } from "@/lib/auth/guards";
import { getArticleForEdit } from "@/lib/catalogue/get-article-for-edit";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditProductPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const result = await getArticleForEdit(id);
  if (!result.ok) notFound();

  return (
    <div className="mjms-workspace-page">
      <WorkspacePageHeader
        variant="hero"
        eyebrow="Product development"
        title="Edit product"
        lead={`Update catalogue details and manage photos for ${result.article.projectName}.`}
      />
      <div className="mjms-panel mjms-panel--form">
        <EditCatalogueProductForm article={result.article} canDeletePhotos role="admin" />
      </div>
    </div>
  );
}
