import { FashionSketch, type FashionSketchId } from "@/components/brand/fashion-silhouettes";
import type { CollectionSeasonAccent } from "@/components/brand/fashion-silhouette-registry";
import { cn } from "@/lib/utils";

export type FashionFieldVariant = "hero" | "page" | "catalogue" | "auth" | "workspace";

type PlacedItem = { id: FashionSketchId; slot: string };

const BASE_FIELD: PlacedItem[] = [
  { id: "stiletto", slot: "01" },
  { id: "handbag", slot: "02" },
  { id: "flat", slot: "03" },
  { id: "loafer", slot: "04" },
  { id: "sandal", slot: "05" },
  { id: "sneaker", slot: "06" },
  { id: "boot", slot: "07" },
  { id: "pump", slot: "08" },
  { id: "handbag", slot: "09" },
  { id: "flat", slot: "10" },
  { id: "loafer", slot: "11" },
  { id: "sandal", slot: "12" },
];

const HERO_EXTRA: PlacedItem[] = [
  { id: "boot", slot: "13" },
  { id: "sneaker", slot: "14" },
  { id: "handbag", slot: "15" },
];

const PAGE_SCROLL: PlacedItem[] = [
  { id: "loafer", slot: "p01" },
  { id: "sandal", slot: "p02" },
  { id: "stiletto", slot: "p03" },
  { id: "handbag", slot: "p04" },
  { id: "flat", slot: "p05" },
  { id: "boot", slot: "p06" },
];

const WINTER_SWAP: Partial<Record<string, FashionSketchId>> = {
  "07": "boot",
  "08": "boot",
  "13": "boot",
  p06: "boot",
};

const SUMMER_SWAP: Partial<Record<string, FashionSketchId>> = {
  "05": "sandal",
  "12": "sandal",
  "03": "flat",
  p02: "sandal",
  p05: "flat",
};

function resolveItems(
  items: PlacedItem[],
  season: CollectionSeasonAccent
): PlacedItem[] {
  const swap = season === "winter" ? WINTER_SWAP : season === "summer" ? SUMMER_SWAP : {};
  return items.map((item) => ({
    ...item,
    id: swap[item.slot] ?? item.id,
  }));
}

function itemsForVariant(variant: FashionFieldVariant, season: CollectionSeasonAccent): PlacedItem[] {
  switch (variant) {
    case "hero":
      return resolveItems([...BASE_FIELD, ...HERO_EXTRA], season);
    case "page":
      return resolveItems(PAGE_SCROLL, season);
    case "auth":
      return resolveItems(BASE_FIELD.slice(0, 10), season);
    case "workspace":
    case "catalogue":
    default:
      return resolveItems(BASE_FIELD, season);
  }
}

type FashionIllustrationFieldProps = {
  variant?: FashionFieldVariant;
  season?: CollectionSeasonAccent;
  className?: string;
};

/**
 * Dense layered footwear + handbag field (SVG Repo CC0 assets via FashionProductIcon).
 */
export function FashionIllustrationField({
  variant = "catalogue",
  season = "neutral",
  className,
}: FashionIllustrationFieldProps) {
  const items = itemsForVariant(variant, season);

  return (
    <div
      className={cn(
        "mjms-fashion-illustration-field",
        `mjms-fashion-illustration-field--${variant}`,
        season !== "neutral" && `mjms-fashion-illustration-field--${season}`,
        className
      )}
      aria-hidden
    >
      {items.map((item) => (
        <FashionSketch
          key={`${variant}-${item.slot}-${item.id}`}
          id={item.id}
          className={cn(
            "mjms-fashion-illustration-field-item",
            `mjms-fashion-illustration-field-item--${item.slot}`
          )}
        />
      ))}
    </div>
  );
}

/** Small repeating sketches overlaid on geometric marquee strips. */
export function MarqueeIllustrationAccentStrip() {
  const accents: FashionSketchId[] = [
    "stiletto",
    "pump",
    "flat",
    "handbag",
    "sandal",
    "loafer",
    "sneaker",
    "boot",
  ];

  return (
    <div className="home-marquee-illustration-accent" aria-hidden>
      {accents.map((id, index) => (
        <FashionSketch
          key={`${id}-${index}`}
          id={id}
          className={cn(
            "home-marquee-illustration-accent-item",
            `home-marquee-illustration-accent-item--${index + 1}`
          )}
        />
      ))}
    </div>
  );
}
