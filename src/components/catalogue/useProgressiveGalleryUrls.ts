"use client";

import { fetchSignedCatalogueImageUrls } from "@/lib/catalogue/sign-image-urls-client";
import type { CatalogueGalleryItemMeta } from "@/lib/catalogue/types";
import { useCallback, useEffect, useRef, useState } from "react";

const INITIAL_GRID = 6;

type UrlMaps = {
  grid: Record<string, string>;
  full: Record<string, string>;
};

export function useProgressiveGalleryUrls(
  articleId: string,
  items: CatalogueGalleryItemMeta[]
) {
  const [urls, setUrls] = useState<UrlMaps>({ grid: {}, full: {} });
  const urlsRef = useRef(urls);
  urlsRef.current = urls;
  const inFlight = useRef(new Set<string>());

  const mergeUrls = useCallback((variant: "grid" | "full", patch: Record<string, string>) => {
    if (Object.keys(patch).length === 0) return;
    setUrls((prev) => {
      const next = {
        ...prev,
        [variant]: { ...prev[variant], ...patch },
      };
      urlsRef.current = next;
      return next;
    });
  }, []);

  const signPaths = useCallback(
    async (paths: string[], variant: "grid" | "full") => {
      const missing = paths.filter((p) => {
        if (!p) return false;
        if (urlsRef.current[variant][p]) return false;
        return !inFlight.current.has(`${variant}:${p}`);
      });
      if (missing.length === 0) return;

      for (const p of missing) inFlight.current.add(`${variant}:${p}`);

      try {
        const signed = await fetchSignedCatalogueImageUrls(articleId, missing, variant);
        mergeUrls(variant, signed);
      } finally {
        for (const p of missing) inFlight.current.delete(`${variant}:${p}`);
      }
    },
    [articleId, mergeUrls]
  );

  useEffect(() => {
    if (items.length === 0) return;
    const initial = items.slice(0, INITIAL_GRID).map((i) => i.storagePath);
    void signPaths(initial, "grid");
  }, [articleId, items, signPaths]);

  const requestGrid = useCallback(
    (paths: string[]) => {
      void signPaths(paths, "grid");
    },
    [signPaths]
  );

  const ensureFullForIndices = useCallback(
    (indices: number[]) => {
      const paths = indices
        .map((i) => items[i]?.storagePath)
        .filter((p): p is string => Boolean(p));
      void signPaths(paths, "full");
    },
    [items, signPaths]
  );

  return { urls, requestGrid, ensureFullForIndices };
}
