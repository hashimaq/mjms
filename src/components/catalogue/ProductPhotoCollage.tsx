import type { CatalogueProduct, CatalogueProductImage } from "@/lib/catalogue/types";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ProductPlaceholder } from "./ProductPlaceholder";

type ProductPhotoCollageProps = {
  product: Pick<
    CatalogueProduct,
    | "projectName"
    | "seasonLabel"
    | "categoryLabel"
    | "categorySlug"
    | "seasonSlug"
    | "articleReference"
    | "visualIndex"
    | "photoCount"
    | "collageImages"
  >;
  priority?: boolean;
};

export function ProductPhotoCollage({ product, priority = false }: ProductPhotoCollageProps) {
  const images = product.collageImages ?? [];
  const total = product.photoCount ?? images.length;
  const alt = `${product.projectName} — ${product.seasonLabel} ${product.categoryLabel}`;
  const sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw";

  if (total === 0 || images.length === 0) {
    return (
      <ProductPlaceholder
        category={product.categorySlug}
        season={product.seasonSlug}
        seasonLabel={product.seasonLabel}
        categoryLabel={product.categoryLabel}
        referenceLabel={null}
        visualIndex={product.visualIndex}
        size="card"
      />
    );
  }

  const layoutCount = Math.min(images.length, total >= 4 ? 4 : images.length);
  const display = images.slice(0, layoutCount);
  const remaining = total - display.length;

  return (
    <div
      className={cn("product-photo-collage", `product-photo-collage--layout-${layoutCount}`)}
      aria-hidden={false}
    >
      {display.map((img, index) => (
        <CollageCell
          key={img.id}
          image={img}
          alt={alt}
          priority={priority && index === 0}
          sizes={sizes}
          remaining={index === display.length - 1 ? remaining : 0}
        />
      ))}
    </div>
  );
}

function CollageCell({
  image,
  alt,
  priority,
  sizes,
  remaining,
}: {
  image: CatalogueProductImage;
  alt: string;
  priority: boolean;
  sizes: string;
  remaining: number;
}) {
  return (
    <div className="product-photo-collage-cell">
      <Image
        src={image.url}
        alt={alt}
        fill
        priority={priority}
        loading={priority ? undefined : "lazy"}
        decoding="async"
        sizes={sizes}
        className="product-photo-collage-image"
      />
      {remaining > 0 && (
        <span className="product-photo-collage-more" aria-label={`${remaining} more photos`}>
          +{remaining}
        </span>
      )}
    </div>
  );
}
