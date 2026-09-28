import type { CollectionSeasonAccent } from "@/components/brand/fashion-silhouette-registry";
import { cn } from "@/lib/utils";

type CollectionPageDecorProps = {
  season?: CollectionSeasonAccent;
};

/** Geometric accents only — footwear/handbag art lives in the fixed ambient portal. */
export function CollectionPageDecor({ season = "neutral" }: CollectionPageDecorProps) {
  return (
    <div
      className={cn(
        "collection-page-decor",
        season !== "neutral" && `collection-page-decor--${season}`
      )}
      aria-hidden="true"
    >
      <svg
        className="collection-page-decor-svg"
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid slice"
      >
        <path fill="#5F4F92" d="M320 24h56v56h-56V52a28 28 0 0 1 28-28Z" opacity="0.35" />
        <path
          fill="none"
          stroke="#6FB0B0"
          strokeWidth="2"
          d="M40 360a48 48 0 0 1 96 0"
          opacity="0.4"
        />
        <rect fill="#E3B233" x="280" y="300" width="64" height="18" transform="skewX(-16)" opacity="0.3" />
      </svg>
    </div>
  );
}
