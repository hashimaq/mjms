/** Restrained hero decoration — scoped to the catalog hero safe zone only. */
export function CatalogHeroDecor() {
  return (
    <div className="catalog-hero-deco" aria-hidden>
      <svg
        className="catalog-hero-deco-svg catalog-hero-deco-svg--desktop"
        viewBox="0 0 280 200"
        preserveAspectRatio="xMaxYMin meet"
      >
        <g className="catalog-geo-anim catalog-geo-anim-1">
          <path fill="#5F4F92" d="M216 16h48v48h-48V40a24 24 0 0 1 24-24Z" />
        </g>
        <g className="catalog-geo-anim catalog-geo-anim-2">
          <circle cx="248" cy="108" r="26" fill="none" stroke="#6FB0B0" strokeWidth="3" />
        </g>
        <g className="catalog-geo-anim catalog-geo-anim-3">
          <rect fill="#E3B233" x="204" y="164" width="52" height="18" transform="skewX(-16)" />
        </g>
      </svg>
    </div>
  );
}
