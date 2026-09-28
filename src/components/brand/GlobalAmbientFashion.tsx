"use client";

import FashionImageMarqueeLayer from "@/components/brand/FashionImageMarqueeLayer";

type GlobalAmbientFashionProps = {
  productMarqueeUrls?: string[];
};

/** Global fixed fashion image marquee (two rows) on `document.body`. */
export function GlobalAmbientFashion({ productMarqueeUrls = [] }: GlobalAmbientFashionProps) {
  return <FashionImageMarqueeLayer productMarqueeUrls={productMarqueeUrls} />;
}
