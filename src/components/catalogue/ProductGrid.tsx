import type { CatalogueProduct } from "@/lib/catalogue/types";
import { cn } from "@/lib/utils";
import { ProductCard } from "./ProductCard";

type ProductGridProps = {
  products: CatalogueProduct[];
  className?: string;
};

export function ProductGrid({ products, className }: ProductGridProps) {
  return (
    <ul className={cn("catalogue-product-grid", className)}>
      {products.map((product) => (
        <li key={product.id} className="catalogue-product-grid-item">
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
