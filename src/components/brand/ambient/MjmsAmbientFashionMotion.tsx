"use client";

import type { AmbientVariant } from "@/components/brand/ambient/ambient-config";
import { MjmsAmbientFashionPortal } from "@/components/brand/ambient/MjmsAmbientFashionPortal";
import { MjmsBrandBackdropLayers } from "@/components/brand/ambient/MjmsBrandBackdropLayers";
import type { CollectionSeasonAccent } from "@/components/brand/fashion-silhouette-registry";
import { usePathname } from "next/navigation";

type MjmsAmbientFashionMotionProps = {
  variant: AmbientVariant;
  season?: CollectionSeasonAccent;
};

function seasonFromPath(pathname: string | null): CollectionSeasonAccent {
  if (!pathname) return "neutral";
  if (pathname.includes("/collections/winter")) return "winter";
  if (pathname.includes("/collections/summer")) return "summer";
  return "neutral";
}

export function MjmsAmbientFashionMotion({
  variant,
  season: seasonProp = "neutral",
}: MjmsAmbientFashionMotionProps) {
  const pathname = usePathname();
  const season = seasonProp !== "neutral" ? seasonProp : seasonFromPath(pathname);

  return (
    <MjmsAmbientFashionPortal>
      <MjmsBrandBackdropLayers variant={variant} season={season} />
    </MjmsAmbientFashionPortal>
  );
}

