"use client";

import type { ProjectPhoto } from "@/lib/projects/types";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

type LightboxProps = {
  photos: ProjectPhoto[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

export function Lightbox({ photos, index, onClose, onNavigate }: LightboxProps) {
  const photo = photos[index];
  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onNavigate(index - 1);
      if (e.key === "ArrowRight" && hasNext) onNavigate(index + 1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, hasPrev, hasNext, onClose, onNavigate]);

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="truncate text-sm text-white/80">
          {photo.originalFilename ?? `Photo ${photo.imageOrder}`} · {index + 1} of{" "}
          {photos.length}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white hover:bg-white/10"
          aria-label="Close preview"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4 pb-4">
        {hasPrev && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(index - 1)}
            className="absolute left-2 z-10 hidden h-10 w-10 rounded-full text-white hover:bg-white/10 sm:flex"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}

        <div className={cn("relative h-full w-full max-h-[calc(100vh-8rem)] max-w-5xl")}>
          {photo.imageUrl && (
            <Image
              src={photo.imageUrl}
              alt={photo.originalFilename ?? `Photo ${photo.imageOrder}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          )}
        </div>

        {hasNext && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(index + 1)}
            className="absolute right-2 z-10 hidden h-10 w-10 rounded-full text-white hover:bg-white/10 sm:flex"
            aria-label="Next photo"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        )}
      </div>
    </div>
  );
}
