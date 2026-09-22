import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchCollagesByArticleId } from "./images";
import type { CatalogueProduct } from "./types";

/** Batched collage previews for listing grids — one image query + one sign batch per chunk. */
export async function attachCollageToProducts(
  supabase: SupabaseClient,
  products: CatalogueProduct[]
): Promise<void> {
  const ids = products.filter((p) => !p.isDemo).map((p) => p.id);
  if (ids.length === 0) return;

  const byId = new Map(products.map((p) => [p.id, p]));
  const collages = await fetchCollagesByArticleId(supabase, ids, (articleId) => {
    const product = byId.get(articleId);
    if (!product) return "MJMS product";
    const name = product.projectName.trim() || "Untitled";
    return `${name} — ${product.seasonLabel} ${product.categoryLabel}`;
  });

  for (const product of products) {
    if (product.isDemo) {
      product.photoCount = 0;
      product.collageImages = [];
      continue;
    }
    const data = collages.get(product.id);
    if (!data) {
      product.photoCount = 0;
      product.collageImages = [];
      product.imageUrl = null;
      product.images = [];
      continue;
    }
    product.photoCount = data.totalCount;
    product.collageImages = data.previews;
    product.imageUrl = data.previews[0]?.url ?? null;
    // Listing cards use collageImages only — never treat previews as the full gallery.
    product.images = [];
  }
}
