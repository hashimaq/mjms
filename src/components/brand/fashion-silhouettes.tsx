/** Re-exports product icons + registry (single visual system). */
export {
  FashionProductIcon,
  FashionSketch,
  sketchIdToProductId,
  type FashionProductId,
  type FashionSketchId,
} from "@/components/brand/fashion-product-icons";

export {
  FASHION_WORD_MARQUEE_ITEMS,
  sketchForCategorySlug,
  silhouetteForCategorySlug,
  sketchesForCollectionSeason,
  type CollectionSeasonAccent,
  type MarqueeStripItem,
} from "@/components/brand/fashion-silhouette-registry";

import { FashionSketch, type FashionSketchId } from "@/components/brand/fashion-product-icons";
import { sketchForCategorySlug } from "@/components/brand/fashion-silhouette-registry";

export function CategorySilhouette({
  categorySlug,
  className,
}: {
  categorySlug: string;
  className?: string;
}) {
  return <FashionSketch id={sketchForCategorySlug(categorySlug)} className={className} />;
}

/** @deprecated use HomeHeroSketchBackdrop */
export function HomeHeroFashionLayer() {
  return null;
}

export function LoginFashionDecor() {
  return (
    <div className="login-brand-fashion" aria-hidden>
      <svg className="login-brand-stitch-lines" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path
          fill="none"
          stroke="#6FB0B0"
          strokeWidth="1.5"
          strokeDasharray="5 8"
          d="M20 160c40-30 120-30 160 0"
          opacity="0.35"
        />
      </svg>
    </div>
  );
}
