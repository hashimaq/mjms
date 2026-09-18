import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Future: main image + thumbnails. Day 4: single placeholder slot only. */
export function ProductGalleryShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("product-gallery-shell", className)}>
      <div className="product-gallery-main">{children}</div>
      <ul className="product-gallery-thumbs" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <li key={i} className="product-gallery-thumb product-gallery-thumb--inactive" />
        ))}
      </ul>
    </div>
  );
}
