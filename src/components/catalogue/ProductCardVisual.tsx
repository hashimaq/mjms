import { cn } from "@/lib/utils";

/** Image-ready frame — CSS-only MJMS tone; no photos until official HD assets exist. */
export function ProductCardVisual({ className }: { className?: string }) {
  return (
    <div className={cn("catalogue-product-visual", className)} aria-hidden="true">
      <span className="catalogue-product-visual-grid" />
      <span className="catalogue-product-visual-arc catalogue-product-visual-arc--teal" />
      <span className="catalogue-product-visual-arc catalogue-product-visual-arc--purple" />
      <span className="catalogue-product-visual-band" />
    </div>
  );
}
