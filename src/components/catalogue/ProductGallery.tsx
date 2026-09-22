"use client";

import { CataloguePhotoLightbox } from "@/components/catalogue/CataloguePhotoLightbox";
import { useProgressiveGalleryUrls } from "@/components/catalogue/useProgressiveGalleryUrls";
import type { CatalogueProduct, CatalogueProductImage } from "@/lib/catalogue/types";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProductPlaceholder } from "./ProductPlaceholder";

type ProductGalleryProps = {
  product: CatalogueProduct;
};

export function ProductGallery({ product }: ProductGalleryProps) {
  const progressiveItems = product.galleryItems ?? [];
  const useProgressive = progressiveItems.length > 0 && !product.isDemo;
  const staticImages = product.images;
  const totalCount = product.photoCount > 0 ? product.photoCount : useProgressive ? progressiveItems.length : staticImages.length;

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const altBase = `${product.projectName} — ${product.seasonLabel} ${product.categoryLabel}`;

  const { urls, requestGrid, ensureFullForIndices } = useProgressiveGalleryUrls(
    product.id,
    progressiveItems
  );

  const requestFullAt = useCallback(
    (idx: number) => ensureFullForIndices([idx]),
    [ensureFullForIndices]
  );

  const resolveLightboxUrl = useCallback(
    (idx: number) => {
      if (!useProgressive) return staticImages[idx]?.url ?? null;
      const item = progressiveItems[idx];
      if (!item) return null;
      return urls.full[item.storagePath] ?? urls.grid[item.storagePath] ?? null;
    },
    [useProgressive, staticImages, progressiveItems, urls.full, urls.grid]
  );

  if (totalCount === 0 && staticImages.length === 0 && progressiveItems.length === 0) {
    return (
      <div className="product-gallery-shell">
        <div className="product-gallery-main product-gallery-main--empty">
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

  const loadedProgressiveCount = useProgressive
    ? progressiveItems.filter((item) => urls.grid[item.storagePath] || urls.full[item.storagePath])
        .length
    : staticImages.length;

  return (
    <div className="product-gallery-shell">
      <p className="product-gallery-count" role="status">
        {totalCount} photo{totalCount === 1 ? "" : "s"}
      </p>

      {useProgressive && loadedProgressiveCount < totalCount && loadedProgressiveCount > 0 && (
        <p className="visually-hidden" role="status" aria-live="polite">
          Loaded {loadedProgressiveCount} of {totalCount} photo previews
        </p>
      )}

      {!useProgressive && staticImages.length < totalCount && (
        <p className="product-gallery-load-warning" role="status">
          Showing {staticImages.length} of {totalCount} photos. Some images could not be loaded —
          refresh or contact support if this persists.
        </p>
      )}

      <ul className="product-gallery-grid" aria-label={`${product.projectName} photo gallery`}>
        {useProgressive
          ? progressiveItems.map((item, index) => (
              <ProgressiveGalleryTile
                key={item.id}
                storagePath={item.storagePath}
                gridUrl={urls.grid[item.storagePath]}
                alt={altBase}
                index={index}
                total={progressiveItems.length}
                onOpen={() => setLightboxIndex(index)}
                onNeedUrl={() => requestGrid([item.storagePath])}
              />
            ))
          : staticImages.map((img, index) => (
              <StaticGalleryTile
                key={img.id}
                image={img}
                index={index}
                total={staticImages.length}
                onOpen={() => setLightboxIndex(index)}
              />
            ))}
      </ul>

      {lightboxIndex !== null && (
        <CataloguePhotoLightbox
          index={lightboxIndex}
          totalCount={useProgressive ? progressiveItems.length : staticImages.length}
          alt={altBase}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
          resolveUrl={resolveLightboxUrl}
          onRequestFull={requestFullAt}
        />
      )}

      <p className="visually-hidden">
        {altBase}: complete gallery with {totalCount} photos. Select a photo to enlarge.
      </p>
    </div>
  );
}

function ProgressiveGalleryTile({
  storagePath,
  gridUrl,
  alt,
  index,
  total,
  onOpen,
  onNeedUrl,
}: {
  storagePath: string;
  gridUrl?: string;
  alt: string;
  index: number;
  total: number;
  onOpen: () => void;
  onNeedUrl: () => void;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const priority = index < 6;

  useEffect(() => {
    onNeedUrl();
  }, [storagePath, onNeedUrl]);

  useEffect(() => {
    const node = ref.current;
    if (!node || gridUrl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) onNeedUrl();
      },
      { rootMargin: "200px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [gridUrl, onNeedUrl]);

  return (
    <li ref={ref}>
      <button
        type="button"
        className="product-gallery-grid-cell"
        onClick={onOpen}
        aria-label={`View photo ${index + 1} of ${total}`}
      >
        {gridUrl ? (
          <Image
            src={gridUrl}
            alt={alt}
            fill
            priority={priority}
            loading={priority ? undefined : "lazy"}
            decoding="async"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="product-gallery-grid-image"
          />
        ) : (
          <span className="product-gallery-grid-skeleton" aria-hidden />
        )}
      </button>
    </li>
  );
}

function StaticGalleryTile({
  image,
  index,
  total,
  onOpen,
}: {
  image: CatalogueProductImage;
  index: number;
  total: number;
  onOpen: () => void;
}) {
  const priority = index < 6;

  return (
    <li>
      <button
        type="button"
        className="product-gallery-grid-cell"
        onClick={onOpen}
        aria-label={`View photo ${index + 1} of ${total}`}
      >
        <Image
          src={image.url}
          alt={image.alt}
          fill
          priority={priority}
          loading={priority ? undefined : "lazy"}
          decoding="async"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="product-gallery-grid-image"
        />
      </button>
    </li>
  );
}
