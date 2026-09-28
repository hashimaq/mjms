import { splitMarqueeTwoRows } from "@/lib/catalogue/marquee-two-rows";

/** Distinct fashion illustration assets — `public/brand/illustrations/` */
export type FashionAssetKey =
  | "stiletto"
  | "pump-ankle"
  | "pump-alt"
  | "flat"
  | "sandal"
  | "loafer"
  | "sneaker-running"
  | "boot"
  | "handbag-tote"
  | "handbag-shoulder"
  | "handbag-clutch";

export const FASHION_ASSET_SRC: Record<FashionAssetKey, string> = {
  stiletto: "/brand/illustrations/stiletto.svg",
  "pump-ankle": "/brand/illustrations/pump-shoe.svg",
  "pump-alt": "/brand/illustrations/high-heel-alt.svg",
  flat: "/brand/illustrations/flat-shoe.svg",
  sandal: "/brand/illustrations/sandal.svg",
  loafer: "/brand/illustrations/loafer.svg",
  "sneaker-running": "/brand/illustrations/sneaker.svg",
  boot: "/brand/illustrations/ankle-boot.svg",
  "handbag-tote": "/brand/illustrations/handbag-tote.svg",
  "handbag-shoulder": "/brand/illustrations/handbag-shoulder.svg",
  "handbag-clutch": "/brand/illustrations/handbag-clutch.svg",
};

export type FashionProductId =
  | "heel"
  | "pump"
  | "flat"
  | "sandal"
  | "loafer"
  | "handbag"
  | "sneaker"
  | "boot";

export type FashionSketchId =
  | "stiletto"
  | "pump"
  | "flat"
  | "sandal"
  | "loafer"
  | "handbag"
  | "sneaker"
  | "boot";

export const SKETCH_TO_ASSET: Record<FashionSketchId, FashionAssetKey> = {
  stiletto: "stiletto",
  pump: "pump-ankle",
  flat: "flat",
  sandal: "sandal",
  loafer: "loafer",
  handbag: "handbag-tote",
  sneaker: "sneaker-running",
  boot: "boot",
};

export const PRODUCT_TO_ASSET: Record<FashionProductId, FashionAssetKey> = {
  heel: "stiletto",
  pump: "pump-ankle",
  flat: "flat",
  sandal: "sandal",
  loafer: "loafer",
  handbag: "handbag-tote",
  sneaker: "sneaker-running",
  boot: "boot",
};

/** Marquee strip — varied footwear, bags, and studio labels (no adjacent duplicate asset). */
export const FASHION_MARQUEE_SEQUENCE: { asset: FashionAssetKey; label: string }[] = [
  { asset: "stiletto", label: "Heels" },
  { asset: "handbag-tote", label: "Handbags" },
  { asset: "pump-ankle", label: "Pumps" },
  { asset: "flat", label: "Flats" },
  { asset: "handbag-shoulder", label: "Shoulder bags" },
  { asset: "sandal", label: "Sandals" },
  { asset: "loafer", label: "Loafers" },
  { asset: "handbag-clutch", label: "Clutches" },
  { asset: "sneaker-running", label: "Sneakers" },
  { asset: "boot", label: "Boots" },
  { asset: "pump-alt", label: "Fashion" },
  { asset: "stiletto", label: "Footwear" },
  { asset: "flat", label: "Design" },
  { asset: "handbag-tote", label: "Craft" },
  { asset: "sandal", label: "Product Development" },
  { asset: "loafer", label: "MJMS" },
];

export function assetForSketch(id: FashionSketchId): FashionAssetKey {
  return SKETCH_TO_ASSET[id];
}

export function assetForProduct(id: FashionProductId): FashionAssetKey {
  return PRODUCT_TO_ASSET[id];
}

/** All fashion illustration keys used by the home fashion marquee (source of truth). */
export function getFashionMarqueeImageAssets(): FashionAssetKey[] {
  return FASHION_MARQUEE_SEQUENCE.map((item) => item.asset);
}

/** Even split across two marquee rows with row 2 rotated for visual variety. */
export function getFashionMarqueeTwoRows(): {
  row1: FashionAssetKey[];
  row2: FashionAssetKey[];
} {
  return splitMarqueeTwoRows(getFashionMarqueeImageAssets());
}
