import { productDetailPath } from "@/lib/catalogue/paths";
import type { CatalogueProduct } from "@/lib/catalogue/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ProductImage } from "./ProductImage";

type ProductCardProps = {
  product: CatalogueProduct;
  className?: string;
};

export function ProductCard({ product, className }: ProductCardProps) {
  return (
    <Link
      href={productDetailPath(product.slug)}
      className={cn("catalogue-product-card group", className)}
    >
      <div className="catalogue-product-card-media">
        <ProductImage product={product} variant="card" />
      </div>
      <div className="catalogue-product-card-body">
        <h3 className="catalogue-product-card-title">{product.projectName}</h3>
      </div>
    </Link>
  );
}
