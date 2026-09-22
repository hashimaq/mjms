import { CatalogueErrorState } from "@/components/catalogue/CatalogueErrorState";
import { ProductDetailView } from "@/components/catalogue/ProductDetailView";
import { ProductStaffTools } from "@/components/catalogue/ProductStaffTools";
import { CollectionPageDecor } from "@/components/collections/CollectionPageDecor";
import { getSessionUser } from "@/lib/auth/session";
import { getProductDetail, getProductDetailHeading } from "@/lib/catalogue/queries";
import { ProductManageActions } from "@/components/catalogue/ProductManageActions";
import { categoryPath } from "@/lib/collections/config";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const heading = await getProductDetailHeading(slug);
  if (!heading) {
    return { title: "Product | MJMS Product Development" };
  }
  return {
    title: heading.title,
    description: heading.description,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  if (!slug?.trim()) notFound();

  const [result, sessionUser] = await Promise.all([getProductDetail(slug), getSessionUser()]);
  const canManage = Boolean(sessionUser) && result.ok && !result.product.isDemo;
  const manageActions =
    canManage && sessionUser && result.ok ? (
      <ProductManageActions
        articleId={result.product.id}
        projectName={result.product.projectName}
        role={sessionUser.role}
        redirectAfterDelete={categoryPath(result.product.seasonSlug, result.product.categorySlug)}
        variant="detail"
      />
    ) : null;

  return (
    <article className="collection-page collection-page--catalogue collection-page--product-detail">
      <CollectionPageDecor />
      <div className="collection-page-inner home-container">
        {!result.ok ? (
          <CatalogueErrorState message={result.message} retryHref={`/products/${slug}`} />
        ) : (
          <>
            <ProductDetailView product={result.product} manageActions={manageActions} />
            {canManage && (
              <ProductStaffTools
                articleId={result.product.id}
                canUpload
                role={sessionUser!.role}
              />
            )}
          </>
        )}
      </div>
    </article>
  );
}
