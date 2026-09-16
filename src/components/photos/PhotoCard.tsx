"use client";

import type { ProjectPhoto } from "@/lib/projects/types";
import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";
import Image from "next/image";

type PhotoCardProps = {
  photo: ProjectPhoto;
  onClick: () => void;
  className?: string;
};

export function PhotoCard({ photo, onClick, className }: PhotoCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "mjms-photo-card group relative aspect-square overflow-hidden",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6a5f9a]/40 focus-visible:ring-offset-2",
        className
      )}
      aria-label={photo.originalFilename ?? `Photo ${photo.imageOrder}`}
    >
      {photo.imageUrl ? (
        <>
          <Image
            src={photo.imageUrl}
            alt={photo.originalFilename ?? `Project photo ${photo.imageOrder}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            className="object-cover transition-transform duration-400 ease-out group-hover:scale-[1.04]"
            loading="lazy"
          />
          <div className="mjms-photo-card-overlay" aria-hidden />
        </>
      ) : (
        <div className="flex h-full items-center justify-center bg-muted/50 text-muted-foreground">
          <ImageIcon className="h-7 w-7 opacity-30" />
        </div>
      )}
    </button>
  );
}
