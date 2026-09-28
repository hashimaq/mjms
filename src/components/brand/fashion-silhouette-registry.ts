import type { FashionSketchId } from "@/components/brand/fashion-product-icons";

export type { FashionSketchId };

/** @deprecated use FashionSketchId */
export type FashionSilhouetteKind = FashionSketchId | "fabric" | "sole" | "stitching" | "footwear";

const SLUG_TO_SKETCH: Record<string, FashionSketchId> = {
  heel: "stiletto",
  flat: "flat",
  pu: "sneaker",
  "dip-pu": "loafer",
  "dip-pvc": "sandal",
  loafer: "loafer",
  sandal: "sandal",
  sneaker: "sneaker",
  mule: "flat",
  boot: "boot",
  handbag: "handbag",
  bag: "handbag",
};

const SLUG_KEYWORD_RULES: { pattern: RegExp; kind: FashionSketchId }[] = [
  { pattern: /heel|stiletto|pump|wedge/i, kind: "stiletto" },
  { pattern: /flat|ballet|mule|slipper/i, kind: "flat" },
  { pattern: /loafer|oxford|mocc/i, kind: "loafer" },
  { pattern: /sandal|slide|flip/i, kind: "sandal" },
  { pattern: /sneaker|trainer|sport/i, kind: "sneaker" },
  { pattern: /boot|ankle-boot|knee/i, kind: "boot" },
  { pattern: /bag|handbag|tote|clutch|purse/i, kind: "handbag" },
];

export function sketchForCategorySlug(slug: string): FashionSketchId {
  const key = slug.trim().toLowerCase();
  const direct = SLUG_TO_SKETCH[key];
  if (direct) return direct;

  for (const rule of SLUG_KEYWORD_RULES) {
    if (rule.pattern.test(key)) return rule.kind;
  }

  return "flat";
}

/** @deprecated */
export function silhouetteForCategorySlug(slug: string): FashionSketchId {
  return sketchForCategorySlug(slug);
}

export type MarqueeStripItem = {
  sketch: FashionSketchId;
  label: string;
};

/** @deprecated Use FASHION_MARQUEE_SEQUENCE from fashion-asset-catalog */
export const FASHION_WORD_MARQUEE_ITEMS: MarqueeStripItem[] = [
  { sketch: "stiletto", label: "Heels" },
  { sketch: "pump", label: "Pumps" },
  { sketch: "flat", label: "Flats" },
  { sketch: "sandal", label: "Sandals" },
  { sketch: "loafer", label: "Loafers" },
  { sketch: "handbag", label: "Handbags" },
  { sketch: "sneaker", label: "Footwear" },
  { sketch: "boot", label: "Boots" },
  { sketch: "handbag", label: "Fashion" },
  { sketch: "loafer", label: "Design" },
  { sketch: "flat", label: "Craft" },
  { sketch: "pump", label: "MJMS" },
];

export type CollectionSeasonAccent = "winter" | "summer" | "neutral";

export function sketchesForCollectionSeason(
  season: CollectionSeasonAccent
): [FashionSketchId, FashionSketchId] {
  if (season === "winter") return ["boot", "stiletto"];
  if (season === "summer") return ["sandal", "flat"];
  return ["stiletto", "handbag"];
}
