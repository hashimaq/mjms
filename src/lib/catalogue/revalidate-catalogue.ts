import "server-only";

import type { CategorySlug, SeasonSlug } from "@/lib/collections/config";
import { getCategorySourceSheet } from "@/lib/collections/config";
import { revalidatePath, updateTag } from "next/cache";

export const CATALOGUE_FACETS_TAG = "mjms-catalogue-filter-facets";

export function revalidateAfterCatalogueMutation(options?: {
  articleId?: string;
  season?: SeasonSlug;
  category?: CategorySlug;
}): void {
  updateTag(CATALOGUE_FACETS_TAG);

  revalidatePath("/search");
  revalidatePath("/admin/search");
  revalidatePath("/employee/search");
  revalidatePath("/admin/catalogue");
  revalidatePath("/employee/catalogue");
  revalidatePath("/collections");

  if (options?.season && options?.category) {
    const sheet = getCategorySourceSheet(options.season, options.category);
    revalidatePath(`/collections/${options.season}/${options.category}`);
    revalidatePath(`/admin/catalogue/${options.season}/${options.category}`);
    revalidatePath(`/employee/catalogue/${options.season}/${options.category}`);
    void sheet;
  }

  if (options?.articleId) {
    revalidatePath(`/products/${options.articleId}`);
  }
}
