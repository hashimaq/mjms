"use client";

import { deleteCataloguePhoto, setCataloguePrimaryPhoto } from "@/lib/catalogue/actions";
import type { CatalogueProductImage } from "@/lib/catalogue/types";
import { cn } from "@/lib/utils";
import { Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ExistingProductGalleryProps = {
  articleId: string;
  images: CatalogueProductImage[];
  canDeletePhotos: boolean;
};

export function ExistingProductGallery({
  articleId,
  images,
  canDeletePhotos,
}: ExistingProductGalleryProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (images.length === 0) {
    return (
      <p className="catalogue-product-form-hint">No photos yet. Add images below.</p>
    );
  }

  async function onSetPrimary(imageId: string) {
    setBusyId(imageId);
    setMessage(null);
    const result = await setCataloguePrimaryPhoto(articleId, imageId);
    setBusyId(null);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    router.refresh();
  }

  async function onDelete(imageId: string) {
    if (!canDeletePhotos) return;
    if (!window.confirm("Remove this photo from the product gallery?")) return;
    setBusyId(imageId);
    setMessage(null);
    const result = await deleteCataloguePhoto(articleId, imageId);
    setBusyId(null);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="catalogue-existing-gallery">
      <ul className="catalogue-media-grid">
        {images.map((image) => (
          <li key={image.id} className="catalogue-media-item">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt={image.alt} className="catalogue-media-thumb" />
            <div className="catalogue-media-item-actions">
              <button
                type="button"
                className={cn(
                  "catalogue-media-primary-btn",
                  image.isPrimary && "catalogue-media-primary-btn--active"
                )}
                disabled={busyId === image.id}
                onClick={() => void onSetPrimary(image.id)}
                aria-pressed={image.isPrimary}
              >
                <Star className="h-3.5 w-3.5" aria-hidden />
                Primary
              </button>
              {canDeletePhotos && (
                <button
                  type="button"
                  className="catalogue-media-remove-btn"
                  disabled={busyId === image.id}
                  onClick={() => void onDelete(image.id)}
                  aria-label="Remove image"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {message && (
        <p className="catalogue-product-form-error" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
