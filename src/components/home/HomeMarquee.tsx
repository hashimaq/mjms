import { cn } from "@/lib/utils";

/** Hero band — flowing logo-inspired shapes (embedded in first viewport). */
function MarqueeTileHero() {
  return (
    <svg
      className="home-marquee-tile"
      viewBox="0 0 960 96"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect className="home-marquee-tile-bg" width="960" height="96" />
      <g className="home-marquee-shapes">
        <path fill="#5F4F92" d="M20 18h36v36H20V36a18 18 0 0 1 18-18Z" />
        <rect fill="#6FB0B0" x="84" y="30" width="52" height="20" transform="skewX(-18)" />
        <path fill="none" stroke="#1F5AA6" strokeWidth="2.5" d="M164 58a30 30 0 0 1 60 0" />
        <polygon fill="#E3B233" points="248,38 288,38 268,68" />
        <path fill="#CC2027" d="M328 34h26v26h-26z" />
        <path fill="#5F4F92" d="M388 50h30v30H388V65a15 15 0 0 1 15-15Z" opacity="0.88" />
        <rect fill="#1F5AA6" x="448" y="42" width="40" height="40" opacity="0.2" />
        <path fill="none" stroke="#6FB0B0" strokeWidth="2" d="M520 22v52M500 48h40" opacity="0.55" />
        <path fill="#6FB0B0" d="M572 54h38v38h-38V73a19 19 0 0 1 19-19Z" opacity="0.78" />
        <rect fill="#5F4F92" x="632" y="28" width="56" height="18" transform="skewX(-20)" opacity="0.82" />
        <circle cx="724" cy="46" r="22" fill="none" stroke="#1F5AA6" strokeWidth="2.5" />
        <polygon fill="#E3B233" points="776,30 816,30 796,58" opacity="0.9" />
        <path fill="none" stroke="#CC2027" strokeWidth="2" d="M848 62a26 26 0 0 1 52 0" opacity="0.75" />
        <rect fill="#1F5AA6" x="908" y="32" width="32" height="32" transform="rotate(22 924 48)" opacity="0.7" />
      </g>
    </svg>
  );
}

/** Section divider — grid tiles and thin parallelograms. */
function MarqueeTileStrip() {
  return (
    <svg
      className="home-marquee-tile home-marquee-tile--strip"
      viewBox="0 0 960 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect className="home-marquee-tile-bg" width="960" height="64" />
      <g opacity="0.92">
        <path fill="#5F4F92" d="M16 12h28v28H16V26a14 14 0 0 1 14-14Z" opacity="0.75" />
        <rect fill="#6FB0B0" x="64" y="22" width="44" height="14" transform="skewX(-16)" opacity="0.65" />
        <path fill="none" stroke="#1F5AA6" strokeWidth="2" d="M132 40a22 22 0 0 1 44 0" />
        <rect fill="#E3B233" x="200" y="18" width="36" height="36" opacity="0.35" />
        <path fill="#CC2027" d="M260 24h20v20h-20z" opacity="0.55" />
        <rect fill="#1A1A1A" x="300" y="26" width="8" height="8" opacity="0.12" />
        <rect fill="#1A1A1A" x="316" y="26" width="8" height="8" opacity="0.08" />
        <rect fill="#1A1A1A" x="332" y="26" width="8" height="8" opacity="0.12" />
        <rect fill="#5F4F92" x="380" y="20" width="48" height="16" transform="skewX(-18)" opacity="0.5" />
        <path fill="#6FB0B0" d="M460 36h32v32h-32V52a16 16 0 0 1 16-16Z" opacity="0.45" />
        <polygon fill="#E3B233" points="520,22 552,22 536,46" opacity="0.7" />
        <path fill="none" stroke="#CC2027" strokeWidth="1.75" d="M580 42a18 18 0 0 1 36 0" opacity="0.6" />
        <rect fill="#1F5AA6" x="640" y="24" width="28" height="28" opacity="0.25" />
        <rect fill="#6FB0B0" x="688" y="22" width="40" height="12" transform="skewX(-14)" opacity="0.55" />
        <circle cx="760" cy="32" r="16" fill="none" stroke="#5F4F92" strokeWidth="2" opacity="0.65" />
        <path fill="#CC2027" d="M808 28h24v24h-24V40a12 12 0 0 1 12-12Z" opacity="0.5" />
        <rect fill="#1A1A1A" x="860" y="28" width="6" height="6" opacity="0.1" />
        <rect fill="#1A1A1A" x="872" y="28" width="6" height="6" opacity="0.14" />
        <rect fill="#1A1A1A" x="884" y="28" width="6" height="6" opacity="0.1" />
        <path fill="none" stroke="#1F5AA6" strokeWidth="2" d="M920 44a16 16 0 0 1 32 0" opacity="0.55" />
      </g>
    </svg>
  );
}

/** Footer band — larger arcs and layered blocks, distinct from hero. */
function MarqueeTileFooter() {
  return (
    <svg
      className="home-marquee-tile home-marquee-tile--footer"
      viewBox="0 0 960 112"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect className="home-marquee-tile-bg" width="960" height="112" />
      <g className="home-marquee-shapes">
        <path fill="#5F4F92" d="M24 20h44v44H24V42a22 22 0 0 1 22-22Z" opacity="0.82" />
        <path
          fill="none"
          stroke="#6FB0B0"
          strokeWidth="3"
          d="M100 72a36 36 0 0 1 72 0"
          opacity="0.7"
        />
        <rect fill="#E3B233" x="200" y="36" width="64" height="22" transform="skewX(-18)" opacity="0.75" />
        <rect fill="#1F5AA6" x="288" y="28" width="48" height="48" opacity="0.18" />
        <path fill="#CC2027" d="M360 32h28v28h-28V46a14 14 0 0 1 14-14Z" opacity="0.65" />
        <path fill="#6FB0B0" d="M420 48h40v40h-40V68a20 20 0 0 1 20-20Z" opacity="0.55" />
        <path fill="none" stroke="#5F4F92" strokeWidth="2.5" d="M500 24v64M480 56h40" opacity="0.45" />
        <polygon fill="#E3B233" points="560,34 608,34 584,72" opacity="0.55" />
        <path fill="none" stroke="#1F5AA6" strokeWidth="2.5" d="M640 78a32 32 0 0 1 64 0" opacity="0.65" />
        <rect fill="#5F4F92" x="728" y="38" width="72" height="20" transform="skewX(-20)" opacity="0.6" />
        <circle cx="832" cy="52" r="26" fill="none" stroke="#CC2027" strokeWidth="2.5" opacity="0.55" />
        <path fill="#1F5AA6" d="M880 36h32v32h-32V52a16 16 0 0 1 16-16Z" opacity="0.5" />
      </g>
    </svg>
  );
}

export type HomeMarqueeVariant = "hero" | "strip" | "footer";

type HomeMarqueeProps = {
  /** @deprecated Use variant="hero" */
  embedded?: boolean;
  variant?: HomeMarqueeVariant;
};

function resolveVariant(embedded: boolean, variant?: HomeMarqueeVariant): HomeMarqueeVariant {
  if (variant) return variant;
  if (embedded) return "hero";
  return "strip";
}

export function HomeMarquee({ embedded = false, variant }: HomeMarqueeProps) {
  const resolved = resolveVariant(embedded, variant);

  const Tile =
    resolved === "hero"
      ? MarqueeTileHero
      : resolved === "footer"
        ? MarqueeTileFooter
        : MarqueeTileStrip;

  return (
    <div
      className={cn(
        "home-marquee",
        resolved === "hero" && "home-marquee--embedded",
        resolved === "strip" && "home-marquee--strip",
        resolved === "footer" && "home-marquee--footer"
      )}
      aria-hidden="true"
    >
      <div
        className={cn(
          "home-marquee-track",
          resolved === "footer" && "home-marquee-track--reverse"
        )}
      >
        <Tile />
        <Tile />
      </div>
    </div>
  );
}
