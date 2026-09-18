import { CollectionBreadcrumbs } from "@/components/collections/CollectionBreadcrumbs";
import { categoryPath, collectionPath } from "@/lib/collections/config";
import type { CatalogueProduct } from "@/lib/catalogue/types";
import Link from "next/link";
import Image from "next/image";
import { ProductPlaceholder } from "./ProductPlaceholder";
import { ProductGalleryShell } from "./ProductGalleryShell";

type ProductDetailViewProps = {
  product: CatalogueProduct;
};

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const hasImage = Boolean(product.imageUrl);

  return (
    <article className="product-detail">
      <CollectionBreadcrumbs
        items={[
          { label: "MJMS Product Development", href: "/" },
          { label: product.seasonLabel, href: collectionPath(product.seasonSlug) },
          {
            label: product.categoryLabel,
            href: categoryPath(product.seasonSlug, product.categorySlug),
          },
          { label: product.projectName },
        ]}
      />

      {product.isDemo && (
        <p className="catalogue-demo-banner" role="status">
          Demonstration catalogue reference — structure only, not a live MJMS production record.
        </p>
      )}

      <div className="product-detail-grid">
        <div className="product-detail-visual">
          <ProductGalleryShell>
            {hasImage ? (
              <Image
                src={product.imageUrl!}
                alt={`${product.projectName} — ${product.seasonLabel} ${product.categoryLabel}`}
                fill
                className="product-detail-image"
                sizes="(max-width: 900px) 100vw, 50vw"
                priority
              />
            ) : (
              <ProductPlaceholder
                category={product.categorySlug}
                season={product.seasonSlug}
                seasonLabel={product.seasonLabel}
                categoryLabel={product.categoryLabel}
                referenceLabel={product.articleReference}
                visualIndex={product.visualIndex}
                size="detail"
              />
            )}
          </ProductGalleryShell>
        </div>

        <div className="product-detail-panel">
          <p className="product-detail-eyebrow">
            {product.seasonLabel.toUpperCase()} / {product.categoryLabel.toUpperCase()}
          </p>
          <h1 className="product-detail-title">{product.projectName}</h1>
          {product.articleReference && (
            <p className="product-detail-reference">Article · {product.articleReference}</p>
          )}

          <dl className="product-detail-specs">
            <Spec label="Season" value={product.seasonLabel} />
            <Spec label="Category" value={product.categoryLabel} />
            <Spec label="Material" value={product.material} />
            <Spec label="Colour" value={product.colour} />
            <Spec label="Size range" value={product.sizeRange} />
            <Spec label="Making" value={product.making} />
            <Spec label="Type" value={product.type} />
            <Spec label="Qty" value={product.qty} />
          </dl>

          {product.remarks && (
            <section className="product-detail-notes" aria-labelledby="product-notes-heading">
              <h2 id="product-notes-heading" className="product-detail-notes-title">
                Product development notes
              </h2>
              <p className="product-detail-notes-text">{product.remarks}</p>
            </section>
          )}

          <div className="product-detail-actions">
            <Link
              href={categoryPath(product.seasonSlug, product.categorySlug)}
              className="mjms-btn mjms-btn-secondary mjms-btn-md"
            >
              ← Back to {product.categoryLabel}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function Spec({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="product-detail-spec">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
