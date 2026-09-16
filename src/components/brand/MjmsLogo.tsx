"use client";

import { cn } from "@/lib/utils";
import type { ImgHTMLAttributes } from "react";

const LOGO_SRC = "/brand/mjms-logo.jpg";

type MjmsLogoProps = {
  /** Base display height in pixels (overridden by responsive classes when provided) */
  height?: number;
  className?: string;
  priority?: boolean;
  /** Center the logo within its container */
  centered?: boolean;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "width" | "height">;

/**
 * Static brand logo — uses native img to preserve proportions and avoid
 * Next/Image layout issues with wide wordmarks that include whitespace.
 */
export function MjmsLogo({
  height = 28,
  className,
  priority = false,
  centered = false,
  ...rest
}: MjmsLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt="MJMS"
      width={Math.round(height * (480 / 140))}
      height={height}
      className={cn(
        "block w-auto max-w-[min(100%,320px)] object-contain",
        centered ? "mx-auto object-center" : "object-left",
        className
      )}
      style={
        className?.includes("login-brand-logo")
          ? undefined
          : className?.includes("catalog-header-logo")
            ? { width: "auto" }
            : { height: `${height}px`, width: "auto" }
      }
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      {...rest}
    />
  );
}
