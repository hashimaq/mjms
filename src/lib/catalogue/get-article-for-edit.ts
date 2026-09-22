import "server-only";

import { getCatalogueMutationClient } from "@/lib/auth/guards";
import { inferCategoryFromSheet, inferSeasonFromSheet } from "@/lib/catalogue/article-map";
import { fetchCompleteGalleryForArticle } from "@/lib/catalogue/images";
import type { CategorySlug, SeasonSlug } from "@/lib/collections/config";
import type { CatalogueProductImage } from "@/lib/catalogue/types";

export type ArticleEditRecord = {
  id: string;
  projectName: string;
  articleReference: string | null;
  season: SeasonSlug;
  category: CategorySlug;
  making: string | null;
  type: string | null;
  material: string | null;
  colour: string | null;
  sizeRange: string | null;
  qty: string | null;
  remarks: string | null;
  images: CatalogueProductImage[];
  photoCount: number;
};

export async function getArticleForEdit(
  articleId: string
): Promise<{ ok: true; article: ArticleEditRecord } | { ok: false; message: string }> {
  const { supabase } = await getCatalogueMutationClient();

  const { data, error } = await supabase
    .from("articles")
    .select(
      "id, project_raw, source_no, source_sheet, making_raw, type_raw, material_raw, colour_raw, size_range_raw, qty_raw, remarks_raw"
    )
    .eq("id", articleId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, message: "Product not found or you cannot edit it." };
  }

  const season = inferSeasonFromSheet(data.source_sheet as string);
  const category = inferCategoryFromSheet(data.source_sheet as string);
  if (!season || !category) {
    return { ok: false, message: "This product category is not supported for editing." };
  }

  const projectName = (data.project_raw as string)?.trim() || "";
  const altBase = projectName;
  const gallery = await fetchCompleteGalleryForArticle(supabase, articleId, altBase);

  return {
    ok: true,
    article: {
      id: data.id as string,
      projectName,
      articleReference: (data.source_no as string | null)?.trim() || null,
      season,
      category,
      making: (data.making_raw as string | null)?.trim() || null,
      type: (data.type_raw as string | null)?.trim() || null,
      material: (data.material_raw as string | null)?.trim() || null,
      colour: (data.colour_raw as string | null)?.trim() || null,
      sizeRange: (data.size_range_raw as string | null)?.trim() || null,
      qty: (data.qty_raw as string | null)?.trim() || null,
      remarks: (data.remarks_raw as string | null)?.trim() || null,
      images: gallery.images,
      photoCount: gallery.totalCount,
    },
  };
}
