"use client";

import { MjmsAmbientFashionMotion } from "@/components/brand/ambient/MjmsAmbientFashionMotion";
import type { AmbientVariant } from "@/components/brand/ambient/ambient-config";
import type { CollectionSeasonAccent } from "@/components/brand/fashion-silhouette-registry";

type MjmsAmbientBackgroundLoaderProps = {
  variant: AmbientVariant;
  season?: CollectionSeasonAccent;
};

/** Client motion layer (Framer). Renders on first paint — no empty SSR placeholder. */
export function MjmsAmbientBackgroundLoader({
  variant,
  season = "neutral",
}: MjmsAmbientBackgroundLoaderProps) {
  return <MjmsAmbientFashionMotion variant={variant} season={season} />;
}
