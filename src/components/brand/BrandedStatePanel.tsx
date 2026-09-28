import { FashionSketch, type FashionSketchId } from "@/components/brand/fashion-silhouettes";
import type { ReactNode } from "react";

type BrandedStatePanelProps = {
  title: string;
  children: ReactNode;
  sketch?: FashionSketchId;
  role?: "status" | "alert";
  className?: string;
};

/** Empty, error, and not-found panels — faint sketch + MJMS typography. */
export function BrandedStatePanel({
  title,
  children,
  sketch = "flat",
  role = "status",
  className,
}: BrandedStatePanelProps) {
  return (
    <div className={`mjms-branded-state ${className ?? ""}`.trim()} role={role}>
      <FashionSketch id={sketch} className="mjms-branded-state-sketch" aria-hidden />
      <div className="mjms-branded-state-body">
        <h2 className="mjms-branded-state-title">{title}</h2>
        <div className="mjms-branded-state-content">{children}</div>
      </div>
    </div>
  );
}
