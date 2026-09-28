import type { FashionAssetKey } from "@/components/brand/fashion-asset-catalog";
import type { FloatPathId } from "@/components/brand/ambient-fashion-paths";

export type AmbientTier = "xl" | "lg" | "md" | "sm";
export type AmbientDepth = "far" | "mid" | "near";

export type AmbientFashionItem = {
  id: string;
  asset: FashionAssetKey;
  xVw: number;
  yVh: number;
  tier: AmbientTier;
  depth: AmbientDepth;
  path: FloatPathId;
  duration: number;
  delay: number;
};

function f(partial: AmbientFashionItem): AmbientFashionItem {
  return partial;
}

/** Desktop — 4 spaced accents (heel, bag, flat, sandal). */
export const AMBIENT_FASHION_ITEMS: AmbientFashionItem[] = [
  f({
    id: "D01",
    asset: "stiletto",
    xVw: 17,
    yVh: 24,
    tier: "xl",
    depth: "mid",
    path: "gentle-float",
    duration: 26,
    delay: -3,
  }),
  f({
    id: "D02",
    asset: "handbag-shoulder",
    xVw: 83,
    yVh: 20,
    tier: "lg",
    depth: "mid",
    path: "gentle-drift-h",
    duration: 32,
    delay: -11,
  }),
  f({
    id: "D03",
    asset: "flat",
    xVw: 13,
    yVh: 70,
    tier: "lg",
    depth: "far",
    path: "gentle-drift-v",
    duration: 22,
    delay: -6,
  }),
  f({
    id: "D04",
    asset: "sandal",
    xVw: 79,
    yVh: 66,
    tier: "md",
    depth: "far",
    path: "gentle-orbit",
    duration: 18,
    delay: -14,
  }),
];

/** Tablet — 3 accents, mobile-first placement. */
export const AMBIENT_FASHION_ITEMS_COMPACT: AmbientFashionItem[] = [
  f({
    id: "T01",
    asset: "stiletto",
    xVw: 82,
    yVh: 13,
    tier: "lg",
    depth: "mid",
    path: "gentle-float",
    duration: 20,
    delay: -2,
  }),
  f({
    id: "T02",
    asset: "handbag-tote",
    xVw: 84,
    yVh: 64,
    tier: "md",
    depth: "mid",
    path: "gentle-drift-h",
    duration: 24,
    delay: -8,
  }),
  f({
    id: "T03",
    asset: "flat",
    xVw: 15,
    yVh: 76,
    tier: "md",
    depth: "mid",
    path: "gentle-drift-v",
    duration: 16,
    delay: -5,
  }),
];

/** Phone — 3 clear, readable accents behind hero safe zone. */
export const AMBIENT_FASHION_ITEMS_PHONE: AmbientFashionItem[] = [
  f({
    id: "M01",
    asset: "stiletto",
    xVw: 84,
    yVh: 12,
    tier: "lg",
    depth: "mid",
    path: "gentle-float",
    duration: 18,
    delay: -4,
  }),
  f({
    id: "M02",
    asset: "handbag-clutch",
    xVw: 86,
    yVh: 62,
    tier: "md",
    depth: "mid",
    path: "gentle-drift-h",
    duration: 22,
    delay: -9,
  }),
  f({
    id: "M03",
    asset: "sandal",
    xVw: 14,
    yVh: 78,
    tier: "md",
    depth: "mid",
    path: "gentle-drift-v",
    duration: 14,
    delay: -1,
  }),
];

export function contentBandPx(vw: number): { left: number; right: number } {
  const colHalf = vw <= 767 ? vw / 2 - 4.25 * 16 : Math.min(36 * 16, vw / 2 - 16);
  return { left: vw / 2 - colHalf, right: vw / 2 + colHalf };
}
