"use client";

import type { AmbientVariant } from "@/components/brand/ambient/ambient-config";
import { BrandGeometry } from "@/components/brand/BrandGeometry";
import { HomePageAtmosphere } from "@/components/home/HomeBackdrop";
import type { CollectionSeasonAccent } from "@/components/brand/fashion-silhouette-registry";
import { cn } from "@/lib/utils";

type GeometryVariant = "homepage" | "login";

function geometryForVariant(variant: AmbientVariant): GeometryVariant {
  return variant === "auth" ? "login" : "homepage";
}

/**
 * Fixed viewport backdrop — three parallel layers (never either/or):
 * 0 wash · 1 BrandGeometry (fashion: global AmbientFashionLayer on body)
 */
export function MjmsBrandBackdropLayers({
  variant,
}: {
  variant: AmbientVariant;
  season?: CollectionSeasonAccent;
}) {
  const geometryVariant = geometryForVariant(variant);

  return (
    <div className="mjms-fixed-brand-backdrop">
      <div className="mjms-backdrop-layer mjms-backdrop-layer--wash" data-mjms-layer="wash" aria-hidden>
        <HomePageAtmosphere />
      </div>
      <div
        className={cn(
          "mjms-backdrop-layer mjms-backdrop-layer--geometry",
          geometryVariant === "login" && "mjms-backdrop-layer--geometry-auth"
        )}
        data-mjms-layer="geometry"
        aria-hidden
      >
        <BrandGeometry variant={geometryVariant} />
      </div>
    </div>
  );
}
