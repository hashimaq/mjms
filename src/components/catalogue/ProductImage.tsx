import type { CatalogueProduct } from "@/lib/catalogue/types";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ProductPlaceholder } from "./ProductPlaceholder";

type ProductImageProps = {
  product: Pick<
    CatalogueProduct,
    | "imageUrl"
    | "categorySlug"
    | "seasonSlug"
    | "seasonLabel"
    | "categoryLabel"
    | "articleReference"
    | "visualIndex"
    | "projectName"
  >;
  variant?: "card" | "detail";
  priority?: boolean;
  className?: string;
  imageClassName?: string;
};

export function ProductImage({
  product,
  variant = "card",
  priority = false,
  className,
  imageClassName,
}: ProductImageProps) {
  const alt = `${product.projectName} — ${product.seasonLabel} ${product.categoryLabel}`;

  if (product.imageUrl) {
    return (
      <Image
        src={product.imageUrl}
        alt={alt}
        fill
        priority={priority}
        sizes={
          variant === "detail"
            ? "(max-width: 900px) 100vw, 50vw"
            : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        }
        className={cn(
          variant === "card" ? "catalogue-product-card-image" : "product-detail-image",
          imageClassName
        )}
      />
    );
  }

  return (
    <ProductPlaceholder
      category={product.categorySlug}
      season={product.seasonSlug}
      seasonLabel={product.seasonLabel}
      categoryLabel={product.categoryLabel}
      referenceLabel={variant === "card" ? null : product.articleReference}
      visualIndex={product.visualIndex}
      size={variant === "detail" ? "detail" : "card"}
      className={className}
    />
  );
}
