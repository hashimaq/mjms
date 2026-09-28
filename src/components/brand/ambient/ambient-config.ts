import type { FashionAssetKey } from "@/components/brand/fashion-asset-catalog";
import type { CollectionSeasonAccent } from "@/components/brand/fashion-silhouette-registry";

export type AmbientVariant = "home" | "catalogue" | "auth" | "workspace";

export type AmbientTravel = "ltr" | "rtl";

export type AmbientMotionProfile = {
  floatY: number;
  driftX: number;
  rotateZ: number;
  rotateX: number;
  rotateY: number;
  scaleMin: number;
  scaleMax: number;
  opacityMin: number;
  opacityMax: number;
};

export type AmbientSize = "lg" | "md" | "sm";

export type AmbientItemConfig = {
  asset: FashionAssetKey;
  slot: string;
  size: AmbientSize;
  side: "left" | "right";
  travel: AmbientTravel;
  duration: number;
  delay: number;
  motion: AmbientMotionProfile;
};

const MOTION_HERO: AmbientMotionProfile = {
  floatY: 18,
  driftX: 10,
  rotateZ: 4,
  rotateX: 6,
  rotateY: 10,
  scaleMin: 0.97,
  scaleMax: 1.05,
  opacityMin: 0.18,
  opacityMax: 0.3,
};

const MOTION_A: AmbientMotionProfile = {
  floatY: 20,
  driftX: 12,
  rotateZ: 3,
  rotateX: 5,
  rotateY: 9,
  scaleMin: 0.96,
  scaleMax: 1.05,
  opacityMin: 0.16,
  opacityMax: 0.28,
};

const MOTION_B: AmbientMotionProfile = {
  floatY: 24,
  driftX: 8,
  rotateZ: 4,
  rotateX: 4,
  rotateY: 11,
  scaleMin: 0.94,
  scaleMax: 1.06,
  opacityMin: 0.17,
  opacityMax: 0.29,
};

const MOTION_C: AmbientMotionProfile = {
  floatY: 16,
  driftX: 14,
  rotateZ: 2,
  rotateX: 6,
  rotateY: 7,
  scaleMin: 0.97,
  scaleMax: 1.04,
  opacityMin: 0.15,
  opacityMax: 0.26,
};

const MOTION_D: AmbientMotionProfile = {
  floatY: 22,
  driftX: 9,
  rotateZ: 3,
  rotateX: 4,
  rotateY: 8,
  scaleMin: 0.95,
  scaleMax: 1.05,
  opacityMin: 0.15,
  opacityMax: 0.25,
};

/** Edge-only slots — alternating travel direction, 35–58s cycles. */
const HERO_FRAME: AmbientItemConfig[] = [
  { asset: "stiletto", slot: "h1", size: "lg", side: "right", travel: "ltr", duration: 48, delay: 0, motion: MOTION_HERO },
  { asset: "handbag-tote", slot: "h2", size: "lg", side: "left", travel: "rtl", duration: 52, delay: 2.2, motion: MOTION_B },
  { asset: "pump-ankle", slot: "h3", size: "md", side: "right", travel: "rtl", duration: 44, delay: 1.1, motion: MOTION_HERO },
  { asset: "sneaker-running", slot: "h4", size: "lg", side: "left", travel: "ltr", duration: 56, delay: 3.4, motion: MOTION_C },
  { asset: "sandal", slot: "h5", size: "sm", side: "right", travel: "ltr", duration: 38, delay: 0.6, motion: MOTION_A },
  { asset: "handbag-shoulder", slot: "h6", size: "md", side: "left", travel: "rtl", duration: 46, delay: 4.8, motion: MOTION_B },
];

const VIEWPORT_BAND: AmbientItemConfig[] = [
  { asset: "loafer", slot: "m1", size: "lg", side: "right", travel: "rtl", duration: 54, delay: 1.5, motion: MOTION_C },
  { asset: "boot", slot: "m2", size: "md", side: "left", travel: "ltr", duration: 42, delay: 2.8, motion: MOTION_A },
  { asset: "handbag-clutch", slot: "m3", size: "sm", side: "right", travel: "ltr", duration: 40, delay: 5.2, motion: MOTION_D },
  { asset: "pump-alt", slot: "m4", size: "sm", side: "left", travel: "rtl", duration: 36, delay: 0.3, motion: MOTION_A },
  { asset: "flat", slot: "m5", size: "md", side: "right", travel: "rtl", duration: 50, delay: 3.9, motion: MOTION_B },
  { asset: "handbag-tote", slot: "m6", size: "md", side: "left", travel: "ltr", duration: 58, delay: 6.1, motion: MOTION_D },
  { asset: "stiletto", slot: "b1", size: "sm", side: "right", travel: "ltr", duration: 45, delay: 2.1, motion: MOTION_C },
  { asset: "sneaker-running", slot: "b2", size: "md", side: "left", travel: "rtl", duration: 47, delay: 4.4, motion: MOTION_A },
  { asset: "sandal", slot: "b3", size: "sm", side: "right", travel: "rtl", duration: 39, delay: 1.8, motion: MOTION_B },
  { asset: "handbag-shoulder", slot: "b4", size: "lg", side: "left", travel: "ltr", duration: 55, delay: 7.2, motion: MOTION_D },
  { asset: "pump-ankle", slot: "b5", size: "sm", side: "right", travel: "ltr", duration: 41, delay: 3.1, motion: MOTION_C },
  { asset: "handbag-clutch", slot: "b6", size: "md", side: "left", travel: "rtl", duration: 53, delay: 5.6, motion: MOTION_B },
];

const AUTH_FRAME: AmbientItemConfig[] = HERO_FRAME.slice(0, 5);

const WORKSPACE_FRAME: AmbientItemConfig[] = [
  HERO_FRAME[0],
  HERO_FRAME[1],
  HERO_FRAME[2],
  HERO_FRAME[4],
  VIEWPORT_BAND[0],
  VIEWPORT_BAND[2],
];

function applySeason(items: AmbientItemConfig[], season: CollectionSeasonAccent): AmbientItemConfig[] {
  if (season === "neutral") return items;
  if (season === "winter") {
    return items.map((item) =>
      item.asset === "sandal" || item.asset === "flat"
        ? { ...item, asset: "boot" as const }
        : item
    );
  }
  return items.map((item) =>
    item.asset === "boot" ? { ...item, asset: "sandal" as const } : item
  );
}

export function ambientItemsFor(
  variant: AmbientVariant,
  season: CollectionSeasonAccent
): AmbientItemConfig[] {
  switch (variant) {
    case "home":
      return applySeason([...HERO_FRAME, ...VIEWPORT_BAND], season);
    case "auth":
      return applySeason([...AUTH_FRAME, ...VIEWPORT_BAND.slice(0, 4)], season);
    case "workspace":
      return applySeason(WORKSPACE_FRAME, season);
    case "catalogue":
    default:
      return applySeason([...HERO_FRAME, ...VIEWPORT_BAND.slice(0, 8)], season);
  }
}
