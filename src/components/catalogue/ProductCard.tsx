import { productDetailPath } from "@/lib/catalogue/paths";
import type { CatalogueProduct } from "@/lib/catalogue/types";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ProductPlaceholder } from "./ProductPlaceholder";

type ProductCardProps = {
  product: CatalogueProduct;
  className?: string;
};

export function ProductCard({ product, className }: ProductCardProps) {
  const hasImage = Boolean(product.imageUrl);

  return (
    <Link
      href={productDetailPath(product.slug)}
      className={cn("catalogue-product-card group", className)}
    >
      <div className="catalogue-product-card-media">
        {hasImage ? (
          <Image
            src={product.imageUrl!}
            alt={`${product.projectName} — ${product.seasonLabel} ${product.categoryLabel}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="catalogue-product-card-image"
          />
        ) : (
          <ProductPlaceholder
            category={product.categorySlug}
            season={product.seasonSlug}
            seasonLabel={product.seasonLabel}
            categoryLabel={product.categoryLabel}
            referenceLabel={product.articleReference}
            visualIndex={product.visualIndex}
            size="card"
          />
        )}
        <span className="catalogue-product-card-detail" aria-hidden>
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>

      <div className="catalogue-product-card-body">
        <h3 className="catalogue-product-card-title">{product.projectName}</h3>
        {product.articleReference && (
          <p className="catalogue-product-card-ref">{product.articleReference}</p>
        )}
        <p className="catalogue-product-card-meta-line">
          <span>{product.seasonLabel}</span>
          <span aria-hidden>·</span>
          <span>{product.categoryLabel}</span>
        </p>
        <dl className="catalogue-product-card-facts">
          {product.material && (
            <div className="catalogue-product-card-fact">
              <dt>Material</dt>
              <dd>{product.material}</dd>
            </div>
          )}
          {product.colour && (
            <div className="catalogue-product-card-fact">
              <dt>Colour</dt>
              <dd>{product.colour}</dd>
            </div>
          )}
          {product.sizeRange && (
            <div className="catalogue-product-card-fact">
              <dt>Size range</dt>
              <dd>{product.sizeRange}</dd>
            </div>
          )}
          {product.making && (
            <div className="catalogue-product-card-fact">
              <dt>Making</dt>
              <dd>{product.making}</dd>
            </div>
          )}
          {product.type && (
            <div className="catalogue-product-card-fact catalogue-product-card-fact--full">
              <dt>Type</dt>
              <dd>{product.type}</dd>
            </div>
          )}
        </dl>
        <span className="catalogue-product-card-cta">
          View product
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
