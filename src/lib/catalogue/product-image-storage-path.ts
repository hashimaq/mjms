import { imageExtension } from "@/lib/projects/upload-utils";

/** Private bucket path: products/{article_id}/{order}{ext} — order is unbounded (not limited to 01–99). */
export function formatProductImageStoragePath(
  articleId: string,
  imageOrder: number,
  mimeTypeOrExt: string
): string {
  const ext = mimeTypeOrExt.startsWith(".")
    ? mimeTypeOrExt
    : imageExtension(mimeTypeOrExt);
  return `products/${articleId}/${imageOrder}${ext}`;
}
