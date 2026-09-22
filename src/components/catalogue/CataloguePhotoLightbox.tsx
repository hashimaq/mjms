"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect } from "react";

type CataloguePhotoLightboxProps = {
  index: number;
  totalCount: number;
  alt: string;
  onClose: () => void;
  onNavigate: (index: number) => void;
  resolveUrl: (index: number) => string | null;
  onRequestFull: (index: number) => void;
};

export function CataloguePhotoLightbox({
  index,
  totalCount,
  alt,
  onClose,
  onNavigate,
  resolveUrl,
  onRequestFull,
}: CataloguePhotoLightboxProps) {
  const imageUrl = resolveUrl(index);
  const hasPrev = index > 0;
  const hasNext = index < totalCount - 1;

  useEffect(() => {
    onRequestFull(index);
    if (hasPrev) onRequestFull(index - 1);
    if (hasNext) onRequestFull(index + 1);
  }, [index, hasPrev, hasNext, onRequestFull]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onNavigate(index - 1);
      if (e.key === "ArrowRight" && hasNext) onNavigate(index + 1);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [index, hasPrev, hasNext, onClose, onNavigate]);

  useEffect(() => {
    let touchStartX = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0]?.clientX ?? 0;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0]?.clientX ?? 0;
      const delta = endX - touchStartX;
      if (Math.abs(delta) < 48) return;
      if (delta > 0 && hasPrev) onNavigate(index - 1);
      if (delta < 0 && hasNext) onNavigate(index + 1);
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [index, hasPrev, hasNext, onNavigate]);

  return (
    <div
      className="catalogue-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onClick={handleBackdropClick}
    >
      <div className="catalogue-lightbox-toolbar">
        <p className="catalogue-lightbox-counter" aria-live="polite">
          {index + 1} / {totalCount}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="catalogue-lightbox-close"
          aria-label="Close photo viewer"
        >
          <X className="h-5 w-5" aria-hidden />
          <span className="catalogue-lightbox-close-label">Close</span>
        </Button>
      </div>

      <div className="catalogue-lightbox-stage" onClick={handleBackdropClick}>
        {hasPrev && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(index - 1)}
            className={cn("catalogue-lightbox-nav", "catalogue-lightbox-nav--prev")}
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden />
          </Button>
        )}

        <div
          className="catalogue-lightbox-image-wrap"
          onClick={(e) => e.stopPropagation()}
        >
          {imageUrl ? (
            <Image
              key={imageUrl}
              src={imageUrl}
              alt={alt}
              fill
              className="catalogue-lightbox-image"
              sizes="100vw"
              priority
            />
          ) : (
            <span className="catalogue-lightbox-loading" role="status">
              Loading photo…
            </span>
          )}
        </div>

        {hasNext && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(index + 1)}
            className={cn("catalogue-lightbox-nav", "catalogue-lightbox-nav--next")}
            aria-label="Next photo"
          >
            <ChevronRight className="h-6 w-6" aria-hidden />
          </Button>
        )}
      </div>
    </div>
  );
}
