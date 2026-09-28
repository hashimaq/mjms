"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const PORTAL_ID = "mjms-ambient-fashion-root";

function ensurePortalHost(): HTMLElement | null {
  if (typeof document === "undefined") return null;

  const existing = document.getElementById(PORTAL_ID);
  if (existing?.parentElement === document.body) {
    return existing;
  }

  // SSR/hydrate fallback may have claimed this id inside page content — never reuse it.
  if (existing) {
    existing.removeAttribute("id");
  }

  const host = document.createElement("div");
  host.id = PORTAL_ID;
  host.setAttribute("aria-hidden", "true");
  host.style.position = "fixed";
  host.style.inset = "0";
  host.style.width = "100%";
  host.style.height = "100%";
  host.style.margin = "0";
  host.style.padding = "0";
  host.style.pointerEvents = "none";
  host.style.overflow = "hidden";
  host.style.zIndex = "0";
  host.style.transform = "none";
  document.body.prepend(host);
  return host;
}

/** Fixed viewport backdrop on `document.body` — never scrolls with page content. */
export function MjmsAmbientFashionPortal({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setHost(ensurePortalHost());
  }, []);

  if (!host) {
    return null;
  }

  return createPortal(children, host);
}
