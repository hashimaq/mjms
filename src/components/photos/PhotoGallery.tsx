"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { PhotoGallerySkeleton } from "@/components/ui/LoadingSkeleton";
import type { ProjectPhoto } from "@/lib/projects/types";
import { ImageIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Lightbox } from "./Lightbox";
import { PhotoCard } from "./PhotoCard";

type PhotoGalleryProps = {
  slug: string;
  initialPhotos: ProjectPhoto[];
  initialTotal: number;
  pageSize?: number;
};

export function PhotoGallery({
  slug,
  initialPhotos,
  initialTotal,
  pageSize = 24,
}: PhotoGalleryProps) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const hasMore = photos.length < total;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/projects/${slug}/photos?offset=${photos.length}&limit=${pageSize}`
      );
      if (!res.ok) throw new Error("Failed to load photos");
      const data = await res.json();
      setPhotos((prev) => [...prev, ...data.photos]);
      setTotal(data.total);
    } catch {
      setError("Something went wrong while loading photos. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [slug, photos.length, pageSize, loading, hasMore]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  if (total === 0 && !loading) {
    return (
      <EmptyState
        icon={ImageIcon}
        title="No photos have been added to this project yet."
        description="Upload photos to build your project gallery."
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {photos.map((photo, i) => (
          <PhotoCard key={photo.id} photo={photo} onClick={() => setLightboxIndex(i)} />
        ))}
      </div>

      {loading && <PhotoGallerySkeleton count={6} />}

      {error && (
        <div className="mjms-alert mjms-alert-error mt-5">
          {error}
          <button type="button" onClick={loadMore} className="ml-2 font-medium underline underline-offset-2">
            Retry
          </button>
        </div>
      )}

      <div ref={sentinelRef} className="h-4" aria-hidden />

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
