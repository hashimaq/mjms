import { cn } from "@/lib/utils";

type ProductCardSkeletonProps = {
  className?: string;
};

export function ProductCardSkeleton({ className }: ProductCardSkeletonProps) {
  return (
    <div className={cn("catalogue-product-card catalogue-product-card--skeleton", className)} aria-hidden>
      <div className="catalogue-product-card-media catalogue-skeleton-shimmer" />
      <div className="catalogue-product-card-body">
        <div className="catalogue-skeleton-line catalogue-skeleton-line--title catalogue-skeleton-shimmer" />
        <div className="catalogue-skeleton-line catalogue-skeleton-line--meta catalogue-skeleton-shimmer" />
        <div className="catalogue-skeleton-line catalogue-skeleton-shimmer" />
        <div className="catalogue-skeleton-line catalogue-skeleton-shimmer" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="catalogue-product-grid" aria-busy="true" aria-label="Loading catalogue">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="catalogue-product-grid-item">
          <ProductCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
