import { productDetailPath } from "@/lib/catalogue/paths";
import type { CatalogueProduct } from "@/lib/catalogue/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ProductPhotoCollage } from "./ProductPhotoCollage";

type ProductCardProps = {
  product: CatalogueProduct;
  className?: string;
  /** First row LCP — limit to first ~4 cards per grid. */
  priority?: boolean;
};

export function ProductCard({ product, className, priority = false }: ProductCardProps) {
  const name = product.projectName.trim() || "Untitled project";

  return (
    <Link
      href={productDetailPath(product.slug)}
      className={cn("catalogue-product-card group", className)}
      title={name}
      aria-label={`View project: ${name}`}
    >
      <div className="catalogue-product-card-media">
        <ProductPhotoCollage product={product} priority={priority} />
      </div>
      <div className="catalogue-product-card-body">
        <h3 className="catalogue-product-card-title">
          <span className="catalogue-product-card-title-text">{name}</span>
        </h3>
      </div>
    </Link>
  );
}
