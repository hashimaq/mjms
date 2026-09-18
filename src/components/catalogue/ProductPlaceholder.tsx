import type { CategorySlug, SeasonSlug } from "@/lib/collections/config";
import { cn } from "@/lib/utils";

export type ProductPlaceholderSize = "card" | "detail";

type ProductPlaceholderProps = {
  category: CategorySlug;
  season: SeasonSlug;
  seasonLabel: string;
  categoryLabel: string;
  referenceLabel?: string | null;
  visualIndex?: number;
  size?: ProductPlaceholderSize;
  className?: string;
};

export function ProductPlaceholder({
  category,
  season,
  seasonLabel,
  categoryLabel,
  referenceLabel,
  visualIndex = 1,
  size = "card",
  className,
}: ProductPlaceholderProps) {
  const refText = referenceLabel ?? `REF ${String(visualIndex).padStart(2, "0")}`;
  const year = new Date().getFullYear();

  return (
    <div
      className={cn(
        "product-placeholder",
        `product-placeholder--${category}`,
        `product-placeholder--${size}`,
        `product-placeholder--${season}`,
        className
      )}
      aria-hidden={size === "card" ? true : undefined}
    >
      <div className="product-placeholder-sheet">
        <div className="product-placeholder-brand">
          <span className="product-placeholder-brand-mark">MJMS</span>
          <span className="product-placeholder-brand-sub">Product Development</span>
        </div>

        <svg
          className="product-placeholder-art"
          viewBox="0 0 320 200"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <PlaceholderArt category={category} index={visualIndex} />
        </svg>

        <div className="product-placeholder-tags">
          <span className="product-placeholder-tag product-placeholder-tag--category">
            {categoryLabel.toUpperCase()}
          </span>
          <span className="product-placeholder-tag product-placeholder-tag--season">
            {seasonLabel.toUpperCase()} / {year}
          </span>
        </div>
        <p className="product-placeholder-ref">{refText}</p>
      </div>
    </div>
  );
}

function PlaceholderArt({ category, index }: { category: CategorySlug; index: number }) {
  const n = ((index - 1) % 3) * 4;

  switch (category) {
    case "heel":
      return (
        <>
          <path
            fill="none"
            stroke="#5F4F92"
            strokeWidth="2.5"
            d={`M40 ${120 + n} a 55 55 0 0 1 110 0`}
            opacity="0.55"
          />
          <path
            fill="none"
            stroke="#6FB0B0"
            strokeWidth="2"
            d={`M200 ${90 + n} a 40 40 0 0 1 80 0`}
            opacity="0.5"
          />
          <circle cx="88" cy="72" r="18" fill="none" stroke="#1F5AA6" strokeWidth="2" opacity="0.45" />
          <rect fill="#E3B233" x="248" y="118" width="48" height="14" transform="skewX(-14)" opacity="0.4" />
        </>
      );
    case "flat":
      return (
        <>
          <path fill="#5F4F92" opacity="0.12" d="M32 140h256v12H32z" />
          <path fill="none" stroke="#6FB0B0" strokeWidth="2" d="M48 100h224" opacity="0.5" />
          <path fill="none" stroke="#1F5AA6" strokeWidth="2" d="M48 116h224" opacity="0.35" />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect
              key={i}
              x={56 + i * 44}
              y={72}
              width="28"
              height="28"
              fill="#1A1A1A"
              opacity="0.06"
            />
          ))}
          <rect fill="#CC2027" x="240" y="88" width="36" height="8" opacity="0.35" />
        </>
      );
    case "pu":
      return (
        <>
          <rect fill="#5F4F92" x="48" y="64" width="72" height="72" opacity="0.14" />
          <rect fill="#6FB0B0" x="136" y="80" width="56" height="56" opacity="0.12" />
          <rect fill="#1F5AA6" x="208" y="96" width="40" height="40" opacity="0.1" />
          <path fill="none" stroke="#E3B233" strokeWidth="2" d="M56 152h208" opacity="0.45" />
        </>
      );
    case "dip-pu":
      return (
        <>
          <rect fill="#5F4F92" x="40" y="70" width="80" height="48" opacity="0.15" transform="rotate(-6 80 94)" />
          <rect fill="#6FB0B0" x="120" y="82" width="72" height="44" opacity="0.12" transform="rotate(4 156 104)" />
          <rect fill="#1F5AA6" x="200" y="74" width="64" height="52" opacity="0.1" transform="rotate(-3 232 100)" />
          <path fill="none" stroke="#CC2027" strokeWidth="1.75" d="M48 148h224" opacity="0.4" />
        </>
      );
    case "dip-pvc":
      return (
        <>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <line
              key={`v${i}`}
              x1={48 + i * 40}
              y1="60"
              x2={48 + i * 40}
              y2="150"
              stroke="#1F5AA6"
              strokeWidth="0.75"
              opacity="0.2"
            />
          ))}
          {[0, 1, 2, 3].map((i) => (
            <line
              key={`h${i}`}
              x1="48"
              y1={80 + i * 24}
              x2="272"
              y2={80 + i * 24}
              stroke="#6FB0B0"
              strokeWidth="0.75"
              opacity="0.18"
            />
          ))}
          <rect fill="#5F4F92" x="108" y="92" width="104" height="36" opacity="0.12" />
          <circle cx="260" cy="72" r="14" fill="none" stroke="#E3B233" strokeWidth="2" opacity="0.45" />
        </>
      );
    default:
      return null;
  }
}
