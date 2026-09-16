import { cn } from "@/lib/utils";

type BrandGeometryProps = {
  variant?: "login" | "hero" | "empty" | "homepage";
  className?: string;
};

const BRAND = {
  purple: "#5F4F92",
  teal: "#6FB0B0",
  yellow: "#E3B233",
  red: "#CC2027",
  blue: "#1F5AA6",
} as const;

/** Desktop login shapes — corners/edges only, kept away from left hero block. */
function LoginGeometryDesktop({ className }: { className?: string }) {
  return (
    <svg
      className={cn(
        "brand-geometry-svg brand-geometry-svg--login brand-geometry-svg--login-desktop",
        className
      )}
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <g className="brand-geo-anim brand-geo-anim-1">
        <path fill={BRAND.purple} d="M1230 48h140v140h-140V118a70 70 0 0 1 70-70Z" />
      </g>
      <g className="brand-geo-anim brand-geo-anim-2">
        <path fill={BRAND.teal} d="M1340 860h-96v-96h96V812a48 48 0 0 0-48 48Z" />
        <circle cx="1320" cy="360" r="40" fill="none" stroke={BRAND.teal} strokeWidth="5" />
      </g>
      <g className="brand-geo-anim brand-geo-anim-3">
        <path fill={BRAND.blue} d="M1296 56a72 72 0 0 1 72 72v0H1296V56Z" />
        <rect fill={BRAND.yellow} x="1260" y="820" width="88" height="32" transform="rotate(-18 1304 836)" />
      </g>
      <g className="brand-geo-anim brand-geo-anim-4">
        <path fill={BRAND.red} d="M48 852h40v40H48z" />
        <path fill={BRAND.teal} d="M980 72a48 48 0 0 1 48 48H980V72Z" />
      </g>
      <g className="brand-geo-anim brand-geo-anim-5">
        <path
          fill="none"
          stroke={BRAND.blue}
          strokeWidth="4"
          d="M48 868a44 44 0 0 1 88 0"
        />
        <rect fill={BRAND.purple} x="1180" y="220" width="100" height="32" transform="skewX(-20)" />
      </g>
      <g className="brand-geo-anim brand-geo-anim-6">
        <rect fill={BRAND.yellow} x="1080" y="108" width="72" height="24" transform="skewX(-18)" />
        <circle cx="1310" cy="780" r="36" fill="none" stroke={BRAND.red} strokeWidth="4" strokeDasharray="80 120" />
      </g>
    </svg>
  );
}

/** Mobile/tablet login shapes — 4 corner accents, kept outside centered hero. */
function LoginGeometryMobile({ className }: { className?: string }) {
  return (
    <svg
      className={cn(
        "brand-geometry-svg brand-geometry-svg--login brand-geometry-svg--login-mobile",
        className
      )}
      viewBox="0 0 400 320"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <g className="brand-geo-anim brand-geo-anim-1 brand-geo-anim--subtle">
        <path fill={BRAND.purple} d="M20 20h52v52H20V46a26 26 0 0 1 26-26Z" />
      </g>
      <g className="brand-geo-anim brand-geo-anim-2 brand-geo-anim--subtle">
        <path fill={BRAND.teal} d="M328 20h52v52H328V46a26 26 0 0 0-26-26Z" />
      </g>
      <g className="brand-geo-anim brand-geo-anim-3 brand-geo-anim--subtle">
        <rect fill={BRAND.yellow} x="20" y="268" width="48" height="18" transform="skewX(-16)" />
      </g>
      <g className="brand-geo-anim brand-geo-anim-4 brand-geo-anim--subtle">
        <path fill={BRAND.red} d="M332 276h32v32h-32z" />
      </g>
      <g className="brand-geo-anim brand-geo-anim-5 brand-geo-anim--subtle">
        <path fill={BRAND.blue} d="M360 268a28 28 0 0 1 28 28v0H360V268Z" />
      </g>
    </svg>
  );
}

/** Unified SVG geometric system — brand zone only on login. */
export function BrandGeometry({ variant = "login", className }: BrandGeometryProps) {
  if (variant === "login") {
    return (
      <div className="brand-geometry-login-wrap login-geometry-masked" aria-hidden>
        <LoginGeometryDesktop className={className} />
        <LoginGeometryMobile className={className} />
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <svg
        className={cn("brand-geometry-svg brand-geometry-svg--hero", className)}
        viewBox="0 0 1200 400"
        preserveAspectRatio="xMaxYMin slice"
        aria-hidden
      >
        <path fill={BRAND.purple} d="M1080 0h80v80H1080V40a40 40 0 0 1 40-40Z" />
        <rect fill={BRAND.teal} x="40" y="60" width="64" height="24" transform="skewX(-18)" />
      </svg>
    );
  }

  if (variant === "homepage") {
    return (
      <div className={cn("brand-geometry-homepage-wrap", className)} aria-hidden>
        <svg
          className="brand-geometry-svg brand-geometry-svg--homepage"
          viewBox="0 0 1440 720"
          preserveAspectRatio="xMidYMid slice"
        >
          <g className="brand-geo-anim brand-geo-anim--subtle brand-geo-anim-1">
            <path fill={BRAND.purple} d="M1180 40h100v100h-100V90a50 50 0 0 1 50-50Z" opacity="0.85" />
          </g>
          <g className="brand-geo-anim brand-geo-anim--subtle brand-geo-anim-2">
            <path fill={BRAND.teal} d="M40 520h72v72H40V556a36 36 0 0 1 36-36Z" opacity="0.75" />
          </g>
          <g className="brand-geo-anim brand-geo-anim--subtle brand-geo-anim-3">
            <rect fill={BRAND.yellow} x="1280" y="480" width="72" height="22" transform="skewX(-16)" opacity="0.7" />
          </g>
          <g className="brand-geo-anim brand-geo-anim--subtle brand-geo-anim-4">
            <path
              fill="none"
              stroke={BRAND.blue}
              strokeWidth="3"
              d="M60 120a48 48 0 0 1 96 0"
              opacity="0.65"
            />
          </g>
          <g className="brand-geo-anim brand-geo-anim--subtle brand-geo-anim-5">
            <path fill={BRAND.red} d="M1320 620h36v36h-36z" opacity="0.55" />
            <polygon fill={BRAND.yellow} points="200,200 240,200 220,240" opacity="0.45" />
          </g>
          <g className="brand-geo-anim brand-geo-anim--subtle brand-geo-anim-6">
            <rect fill={BRAND.purple} x="680" y="40" width="88" height="24" transform="skewX(-16)" opacity="0.35" />
            <path
              fill="none"
              stroke={BRAND.teal}
              strokeWidth="2.5"
              d="M720 580a60 60 0 0 1 120 0"
              opacity="0.4"
            />
          </g>
          <g className="brand-geo-anim brand-geo-anim--subtle brand-geo-anim-2">
            <path fill={BRAND.blue} d="M0 280h56v56H0V308a28 28 0 0 1 28-28Z" opacity="0.55" />
            <rect fill={BRAND.red} x="1380" y="280" width="40" height="40" opacity="0.4" />
          </g>
          <g className="brand-geo-anim brand-geo-anim--subtle brand-geo-anim-4">
            <path
              fill="none"
              stroke={BRAND.yellow}
              strokeWidth="2.5"
              d="M1200 180a40 40 0 0 1 80 0"
              opacity="0.55"
            />
            <polygon fill={BRAND.teal} points="80,600 120,600 100,640" opacity="0.5" />
          </g>
        </svg>
      </div>
    );
  }

  return (
    <svg
      className={cn("brand-geometry-svg brand-geometry-svg--empty", className)}
      viewBox="0 0 200 120"
      aria-hidden
    >
      <path fill={BRAND.purple} d="M150 0h40v40H150V20a20 20 0 0 1 20-20Z" />
      <path fill={BRAND.teal} d="M0 120h40v-40H0V100a20 20 0 0 0 20 20Z" />
    </svg>
  );
}
