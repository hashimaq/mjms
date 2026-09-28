import { MjmsAmbientBackgroundLoader } from "@/components/brand/ambient/MjmsAmbientBackgroundLoader";
import type { AmbientVariant } from "@/components/brand/ambient/ambient-config";
import type { CollectionSeasonAccent } from "@/components/brand/fashion-silhouette-registry";

export type MjmsBrandTone = "home" | "catalogue" | "auth" | "workspace";

type MjmsBrandAtmosphereProps = {
  tone?: MjmsBrandTone;
  season?: CollectionSeasonAccent;
};

function ambientVariantForTone(tone: MjmsBrandTone): AmbientVariant {
  if (tone === "home") return "home";
  if (tone === "auth") return "auth";
  if (tone === "workspace") return "workspace";
  return "catalogue";
}

/** Fixed portal backdrop: page wash + moving fashion illustrations (client). */
export function MjmsBrandAtmosphere({
  tone = "catalogue",
  season = "neutral",
}: MjmsBrandAtmosphereProps) {
  return (
    <MjmsAmbientBackgroundLoader variant={ambientVariantForTone(tone)} season={season} />
  );
}

/** @deprecated */
export function HomeHeroSketchBackdrop() {
  return null;
}
