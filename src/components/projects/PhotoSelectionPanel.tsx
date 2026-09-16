"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ImagePlus, Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef } from "react";

export type SelectedPhoto = {
  id: string;
  file: File;
  preview: string;
};

type PhotoSelectionPanelProps = {
  photos: SelectedPhoto[];
  onPhotosChange: (photos: SelectedPhoto[]) => void;
  disabled?: boolean;
};

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function PhotoSelectionPanel({
  photos,
  onPhotosChange,
  disabled = false,
}: PhotoSelectionPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const list = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
      const mapped = list.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
      }));

      onPhotosChange([
        ...photos,
        ...mapped.filter((m) => !photos.some((p) => p.id === m.id)),
      ]);
    },
    [onPhotosChange, photos]
  );

  function removePhoto(id: string) {
    const item = photos.find((p) => p.id === id);
    if (item) URL.revokeObjectURL(item.preview);
    onPhotosChange(photos.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (disabled) return;
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        className={cn("mjms-upload-zone", disabled && "pointer-events-none opacity-60")}
      >
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#6a5f9a]/8">
          <Upload className="h-5 w-5 text-[#6a5f9a]" />
        </div>
        <p className="text-sm font-medium text-foreground">Drag &amp; drop photos here</p>
        <p className="mjms-meta mt-1">or</p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-3"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="h-4 w-4" />
          Choose Photos
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          disabled={disabled}
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {photos.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            Selected Photos ({photos.length})
          </p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {photos.map((item) => (
              <div
                key={item.id}
                className="mjms-photo-card group relative aspect-square overflow-hidden rounded-[10px]"
              >
                <Image
                  src={item.preview}
                  alt={item.file.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removePhoto(item.id)}
                  className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                  aria-label={`Remove ${item.file.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
