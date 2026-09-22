"use client";

import { cn } from "@/lib/utils";
import { ImagePlus, Star, Trash2 } from "lucide-react";
import { useCallback } from "react";

export type PendingPhoto = {
  id: string;
  file: File;
  previewUrl: string;
};

type ProductPhotoPickerProps = {
  photos: PendingPhoto[];
  primaryId: string | null;
  onPhotosChange: (photos: PendingPhoto[]) => void;
  onPrimaryChange: (id: string | null) => void;
};

export function ProductPhotoPicker({
  photos,
  primaryId,
  onPhotosChange,
  onPrimaryChange,
}: ProductPhotoPickerProps) {
  const primaryPhotoId = primaryId ?? photos[0]?.id ?? null;

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (list.length === 0) return;

      const next = [...photos];
      for (const file of list) {
        if (file.size > 12 * 1024 * 1024) continue;
        const id = `${file.name}-${file.size}-${crypto.randomUUID()}`;
        next.push({ id, file, previewUrl: URL.createObjectURL(file) });
      }
      onPhotosChange(next);
    },
    [photos, onPhotosChange]
  );

  function removePhoto(id: string) {
    const target = photos.find((p) => p.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    const next = photos.filter((p) => p.id !== id);
    if (primaryId === id) onPrimaryChange(next[0]?.id ?? null);
    onPhotosChange(next);
  }

  return (
    <section className="catalogue-product-form-section">
      <h2 className="catalogue-product-form-heading">Photos</h2>
      <p className="catalogue-product-form-hint">
        Add a primary photo and optional gallery images (JPEG, PNG, WebP — max 12 MB each).
      </p>
      <div
        className="catalogue-media-dropzone"
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add("catalogue-media-dropzone--active");
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove("catalogue-media-dropzone--active");
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove("catalogue-media-dropzone--active");
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
      >
        <ImagePlus className="h-8 w-8 catalogue-media-dropzone-icon" aria-hidden />
        <p className="catalogue-media-dropzone-title">Drop images here</p>
        <p className="catalogue-media-dropzone-sub">or choose files from your device</p>
        <label className="mjms-btn mjms-btn-secondary mjms-btn-sm catalogue-media-dropzone-btn">
          Choose files
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="sr-only"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {photos.length > 0 && (
        <ul className="catalogue-media-grid">
          {photos.map((photo) => (
            <li key={photo.id} className="catalogue-media-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.previewUrl} alt="" className="catalogue-media-thumb" />
              <div className="catalogue-media-item-actions">
                <button
                  type="button"
                  className={cn(
                    "catalogue-media-primary-btn",
                    photo.id === primaryPhotoId && "catalogue-media-primary-btn--active"
                  )}
                  onClick={() => onPrimaryChange(photo.id)}
                  aria-pressed={photo.id === primaryPhotoId}
                >
                  <Star className="h-3.5 w-3.5" aria-hidden />
                  Primary
                </button>
                <button
                  type="button"
                  className="catalogue-media-remove-btn"
                  onClick={() => removePhoto(photo.id)}
                  aria-label="Remove image"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
