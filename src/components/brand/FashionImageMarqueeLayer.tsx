"use client";

import { FASHION_ASSET_SRC, getFashionMarqueeTwoRows } from "@/components/brand/fashion-asset-catalog";
import { splitMarqueeTwoRows } from "@/lib/catalogue/marquee-two-rows";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import "./fashion-image-marquee-layer.css";

const PORTAL_ID = "fashion-image-marquee-root";

function ensurePortalHost(): HTMLElement | null {
  if (typeof document === "undefined") return null;

  const legacy = document.getElementById("ambient-fashion-root");
  if (legacy) legacy.remove();

  const existing = document.getElementById(PORTAL_ID);
  if (existing?.parentElement === document.body) return existing;

  if (existing) existing.removeAttribute("id");

  const host = document.createElement("div");
  host.id = PORTAL_ID;
  host.className = "fashion-image-marquee-root";
  host.setAttribute("aria-hidden", "true");
  document.body.prepend(host);
  return host;
}

function MarqueeImageRow({
  sources,
  rowClass,
  keyPrefix,
}: {
  sources: string[];
  rowClass: "fashion-marquee-row--1" | "fashion-marquee-row--2";
  keyPrefix: string;
}) {
  const track = useMemo(() => [...sources, ...sources], [sources]);

  return (
    <div className={`fashion-marquee-row ${rowClass}`}>
      <div className="fashion-marquee-row__track">
        {track.map((src, i) => (
          <div key={`${keyPrefix}-${i}-${src}`} className="fashion-marquee-item">
            <img
              src={src}
              className="fashion-marquee-item__img"
              alt=""
              decoding="async"
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

type FashionImageMarqueeLayerProps = {
  /** Signed hit-article photo URLs; falls back to brand illustrations when empty. */
  productMarqueeUrls?: string[];
};

/** Fixed two-row image marquee — portaled to `document.body`. */
export default function FashionImageMarqueeLayer({
  productMarqueeUrls = [],
}: FashionImageMarqueeLayerProps) {
  const [host, setHost] = useState<HTMLElement | null>(null);

  const { row1, row2, mode } = useMemo(() => {
    const urls = productMarqueeUrls.filter(Boolean);
    if (urls.length >= 1) {
      const split = splitMarqueeTwoRows(urls);
      return { ...split, mode: "product" as const };
    }
    const decorative = getFashionMarqueeTwoRows();
    return {
      row1: decorative.row1.map((a) => FASHION_ASSET_SRC[a]),
      row2: decorative.row2.map((a) => FASHION_ASSET_SRC[a]),
      mode: "decorative" as const,
    };
  }, [productMarqueeUrls]);

  useEffect(() => {
    setHost(ensurePortalHost());
  }, []);

  if (!host) return null;

  return createPortal(
    <div className="fashion-image-marquee-backdrop">
      <MarqueeImageRow sources={row1} rowClass="fashion-marquee-row--1" keyPrefix={mode} />
      <MarqueeImageRow sources={row2} rowClass="fashion-marquee-row--2" keyPrefix={mode} />
    </div>,
    host
  );
}
