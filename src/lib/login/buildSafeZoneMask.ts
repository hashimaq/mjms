/** Minimum clear gap between decorative shapes and protected UI elements. */
export const LOGIN_SAFE_GAP_PX = 24;

/** Extra padding to cover shape drift / scale / rotation animation extremes. */
export const LOGIN_ANIM_BUFFER_PX = 16;

export type SafeZoneRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function buildExclusionMask(
  viewportW: number,
  viewportH: number,
  zones: SafeZoneRect[],
  gapPx = LOGIN_SAFE_GAP_PX,
  animBufferPx = LOGIN_ANIM_BUFFER_PX
): string {
  if (viewportW <= 0 || viewportH <= 0 || zones.length === 0) {
    return "none";
  }

  const pad = gapPx + animBufferPx;
  const exclusions = zones
    .map((zone) => {
      const x = Math.max(0, zone.left - pad);
      const y = Math.max(0, zone.top - pad);
      const w = Math.min(viewportW - x, zone.width + pad * 2);
      const h = Math.min(viewportH - y, zone.height + pad * 2);
      if (w <= 0 || h <= 0) return "";
      return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" fill="black"/>`;
    })
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${viewportW}" height="${viewportH}"><rect width="100%" height="100%" fill="white"/>${exclusions}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function rectsRelativeToContainer(
  container: HTMLElement,
  elements: Element[]
): SafeZoneRect[] {
  const containerRect = container.getBoundingClientRect();
  return elements.map((el) => {
    const r = el.getBoundingClientRect();
    return {
      left: r.left - containerRect.left,
      top: r.top - containerRect.top,
      width: r.width,
      height: r.height,
    };
  });
}
