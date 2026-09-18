import { CatalogueErrorState } from "@/components/catalogue/CatalogueErrorState";
import { ProductDetailView } from "@/components/catalogue/ProductDetailView";
import { CollectionPageDecor } from "@/components/collections/CollectionPageDecor";
import { getProductDetail } from "@/lib/catalogue/queries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getProductDetail(slug);
  if (!result.ok) {
    return { title: "Product | MJMS Product Development" };
  }
  const { product } = result;
  return {
    title: `${product.projectName} — MJMS Product Development`,
    description: `${product.projectName} — ${product.seasonLabel} ${product.categoryLabel} product development catalogue.`,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  if (!slug?.trim()) notFound();

  const result = await getProductDetail(slug);

  return (
    <article className="collection-page collection-page--catalogue collection-page--product-detail">
      <CollectionPageDecor />
      <div className="collection-page-inner home-container">
        {!result.ok ? (
          <CatalogueErrorState message={result.message} retryHref={`/products/${slug}`} />
        ) : (
          <ProductDetailView product={result.product} />
        )}
      </div>
    </article>
  );
}
