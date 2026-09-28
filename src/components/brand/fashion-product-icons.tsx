import {
  assetForProduct,
  assetForSketch,
  FASHION_ASSET_SRC,
  type FashionAssetKey,
  type FashionProductId,
  type FashionSketchId,
} from "@/components/brand/fashion-asset-catalog";
import { cn } from "@/lib/utils";
import type { ImgHTMLAttributes } from "react";

export type { FashionAssetKey, FashionProductId, FashionSketchId } from "@/components/brand/fashion-asset-catalog";
export {
  FASHION_MARQUEE_SEQUENCE,
  SKETCH_TO_ASSET,
  assetForSketch,
  assetForProduct,
} from "@/components/brand/fashion-asset-catalog";

export function sketchIdToProductId(id: FashionSketchId): FashionProductId {
  if (id === "stiletto") return "heel";
  return id;
}

type IconProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
  className?: string;
};

export function FashionProductIcon({
  id,
  asset,
  className,
  ...rest
}: IconProps & ({ id: FashionProductId; asset?: never } | { asset: FashionAssetKey; id?: never })) {
  const src = FASHION_ASSET_SRC[asset ?? assetForProduct(id)];
  return (
    // eslint-disable-next-line @next/next/no-img-element -- project-owned static SVG assets
    <img
      src={src}
      alt=""
      aria-hidden={rest["aria-label"] ? undefined : true}
      className={cn("mjms-fashion-product-icon", "mjms-fashion-product-icon--asset", className)}
      loading="lazy"
      decoding="async"
      draggable={false}
      {...rest}
    />
  );
}

export function FashionSketch({
  id,
  className,
  title,
}: {
  id: FashionSketchId;
  className?: string;
  title?: string;
}) {
  return (
    <FashionProductIcon
      asset={assetForSketch(id)}
      className={className}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      role={title ? "img" : undefined}
    />
  );
}
