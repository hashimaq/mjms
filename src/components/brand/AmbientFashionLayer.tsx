"use client";

import {
  AMBIENT_FASHION_ITEMS,
  AMBIENT_FASHION_ITEMS_COMPACT,
  AMBIENT_FASHION_ITEMS_PHONE,
  type AmbientFashionItem,
} from "@/components/brand/ambient-fashion-items";
import { FASHION_ASSET_SRC } from "@/components/brand/fashion-asset-catalog";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import "./ambient-fashion-layer.css";

const PORTAL_ID = "ambient-fashion-root";

function ensurePortalHost(): HTMLElement | null {
  if (typeof document === "undefined") return null;

  const existing = document.getElementById(PORTAL_ID);
  if (existing?.parentElement === document.body) {
    return existing;
  }

  if (existing) {
    existing.removeAttribute("id");
  }

  const host = document.createElement("div");
  host.id = PORTAL_ID;
  host.className = "ambient-fashion-root";
  host.setAttribute("aria-hidden", "true");
  host.style.position = "fixed";
  host.style.inset = "0";
  host.style.pointerEvents = "none";
  host.style.zIndex = "1";
  document.body.prepend(host);
  return host;
}

function useViewportBucket(): "desktop" | "compact" | "phone" {
  const [bucket, setBucket] = useState<"desktop" | "compact" | "phone">("desktop");

  useEffect(() => {
    const sync = () => {
      const w = window.innerWidth;
      if (w <= 430) setBucket("phone");
      else if (w <= 767) setBucket("compact");
      else setBucket("desktop");
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  return bucket;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

/** Stagger phase along the track (xVw) without changing lane layout. */
function marqueeDelay(item: AmbientFashionItem): number {
  return item.delay - item.xVw * 0.08;
}

function FloatingFigure({
  item,
  reducedMotion,
}: {
  item: AmbientFashionItem;
  reducedMotion: boolean;
}) {
  const style: CSSProperties = {
    ["--lane-y" as string]: `${item.yVh}vh`,
    ["--marquee-duration" as string]: `${item.duration}s`,
    ["--marquee-delay" as string]: `${marqueeDelay(item).toFixed(2)}s`,
  };

  return (
    <div
      className={cn(
        "ambient-float-figure",
        "ambient-float-figure--marquee",
        `ambient-float-figure--tier-${item.tier}`,
        `ambient-float-figure--depth-${item.depth}`,
        reducedMotion && "ambient-float-figure--marquee-static"
      )}
      style={style}
    >
      <div className="ambient-float-figure-sprite-wrap">
        <img
          src={FASHION_ASSET_SRC[item.asset]}
          className="ambient-float-figure-sprite"
          alt=""
          decoding="async"
          draggable={false}
        />
      </div>
    </div>
  );
}

/** Viewport-fixed fashion marquee — portaled to `document.body`. */
export default function AmbientFashionLayer() {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const bucket = useViewportBucket();
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    setHost(ensurePortalHost());
  }, []);

  const items = useMemo(() => {
    if (bucket === "phone") return AMBIENT_FASHION_ITEMS_PHONE;
    if (bucket === "compact") return AMBIENT_FASHION_ITEMS_COMPACT;
    return AMBIENT_FASHION_ITEMS;
  }, [bucket]);

  if (!host) {
    return null;
  }

  return createPortal(
    <>
      {items.map((item) => (
        <FloatingFigure key={item.id} item={item} reducedMotion={reducedMotion} />
      ))}
    </>,
    host
  );
}
