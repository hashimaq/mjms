"use client";

import type { CatalogueProduct, CatalogueProductImage } from "@/lib/catalogue/types";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";
import { ProductPlaceholder } from "./ProductPlaceholder";

type ProductGalleryProps = {
  product: CatalogueProduct;
};

export function ProductGallery({ product }: ProductGalleryProps) {
  const images = product.images;
  const [activeIndex, setActiveIndex] = useState(0);
  const altBase = `${product.projectName} — ${product.seasonLabel} ${product.categoryLabel}`;

  if (images.length === 0) {
    return (
      <div className="product-gallery-shell">
        <div className="product-gallery-main">
          <ProductPlaceholder
            category={product.categorySlug}
            season={product.seasonSlug}
            seasonLabel={product.seasonLabel}
            categoryLabel={product.categoryLabel}
            referenceLabel={product.articleReference}
            visualIndex={product.visualIndex}
            size="detail"
          />
        </div>
      </div>
    );
  }

  const active: CatalogueProductImage = images[activeIndex] ?? images[0];

  return (
    <div className="product-gallery-shell">
      <div className="product-gallery-main">
        <Image
          key={active.id}
          src={active.url}
          alt={active.alt || altBase}
          fill
          priority={activeIndex === 0}
          sizes="(max-width: 900px) 100vw, 50vw"
          className="product-detail-image"
        />
      </div>
      {images.length > 1 && (
        <ul className="product-gallery-thumbs" aria-label="Product images">
          {images.map((img, index) => (
            <li key={img.id}>
              <button
                type="button"
                className={cn(
                  "product-gallery-thumb-btn",
                  index === activeIndex && "product-gallery-thumb-btn--active"
                )}
                aria-label={`Show image ${index + 1} of ${images.length}`}
                aria-current={index === activeIndex ? "true" : undefined}
                onClick={() => setActiveIndex(index)}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  sizes="80px"
                  className="product-gallery-thumb-image"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
