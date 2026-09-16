"use client";

import {
  buildExclusionMask,
  rectsRelativeToContainer,
} from "@/lib/login/buildSafeZoneMask";
import { useCallback, useLayoutEffect, useState } from "react";

type LoginGeometryMasks = {
  shell: string;
  brand: string;
};

const EMPTY_MASKS: LoginGeometryMasks = { shell: "none", brand: "none" };

export function useLoginGeometryMasks(
  shellRef: React.RefObject<HTMLElement | null>,
  enabled: boolean
): LoginGeometryMasks {
  const [masks, setMasks] = useState<LoginGeometryMasks>(EMPTY_MASKS);

  const update = useCallback(() => {
    const shell = shellRef.current;
    if (!shell || !enabled) {
      setMasks(EMPTY_MASKS);
      return;
    }

    const brand = shell.querySelector<HTMLElement>(".login-brand");
    const logo = shell.querySelector('[data-login-safe="logo"]');
    const heading = shell.querySelector('[data-login-safe="heading"]');
    const card = shell.querySelector('[data-login-safe="card"]');

    const shellW = shell.clientWidth;
    const shellH = shell.clientHeight;

    const shellZones = [logo, heading, card].filter(Boolean) as Element[];
    const shellMask =
      shellZones.length > 0
        ? buildExclusionMask(
            shellW,
            shellH,
            rectsRelativeToContainer(shell, shellZones)
          )
        : "none";

    let brandMask = "none";
    if (brand) {
      const brandZones = [logo, heading].filter(
        (el) => el && brand.contains(el)
      ) as Element[];
      if (brandZones.length > 0) {
        brandMask = buildExclusionMask(
          brand.clientWidth,
          brand.clientHeight,
          rectsRelativeToContainer(brand, brandZones)
        );
      }
    }

    setMasks({ shell: shellMask, brand: brandMask });
  }, [shellRef, enabled]);

  useLayoutEffect(() => {
    if (!enabled) {
      setMasks(EMPTY_MASKS);
      return;
    }

    update();

    const shell = shellRef.current;
    if (!shell) return;

    const resizeObserver = new ResizeObserver(() => update());
    resizeObserver.observe(shell);

    const brand = shell.querySelector(".login-brand");
    if (brand) resizeObserver.observe(brand);

    for (const el of shell.querySelectorAll(
      '[data-login-safe="logo"], [data-login-safe="heading"], [data-login-safe="card"]'
    )) {
      resizeObserver.observe(el);
    }

    window.addEventListener("resize", update);

    const logoImg = shell.querySelector('[data-login-safe="logo"]');
    logoImg?.addEventListener("load", update);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", update);
      logoImg?.removeEventListener("load", update);
    };
  }, [enabled, shellRef, update]);

  return masks;
}
