import { MjmsBrandAtmosphere } from "@/components/brand/MjmsBrandAtmosphere";

/** Staff projects chrome — same brand atmosphere as public catalogue. */
export function CatalogBackground() {
  return (
    <div className="catalog-bg mjms-public-brand" aria-hidden>
      <MjmsBrandAtmosphere tone="workspace" />
      <div className="catalog-bg-paper" />
    </div>
  );
}
