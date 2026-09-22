import type { SupabaseClient } from "@supabase/supabase-js";
import type { CatalogueProductImage } from "./types";

const SIGNED_URL_TTL = 3600;
const ARTICLE_CHUNK = 200;
const SIGN_URL_CHUNK = 80;
export const COLLAGE_PREVIEW_LIMIT = 4;

type ImageRow = {
  id: string;
  article_id: string;
  storage_path: string;
  is_primary: boolean;
  image_order: number;
  width: number | null;
  height: number | null;
};

export type ArticleCollageData = {
  previews: CatalogueProductImage[];
  totalCount: number;
};

function sortImageRows<T extends Pick<ImageRow, "is_primary" | "image_order">>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return a.image_order - b.image_order;
  });
}

export type CatalogueImageVariant = "grid" | "full";

const GRID_IMAGE_TRANSFORM = {
  width: 960,
  quality: 82,
  resize: "contain" as const,
};

const SIGN_PARALLEL = 12;

export async function signStoragePaths(
  supabase: SupabaseClient,
  paths: string[]
): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter(Boolean))];
  const map = new Map<string, string>();
  if (unique.length === 0) return map;

  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += SIGN_URL_CHUNK) {
    chunks.push(unique.slice(i, i + SIGN_URL_CHUNK));
  }

  await Promise.all(
    chunks.map(async (chunk) => {
      const { data, error } = await supabase.storage
        .from("product-images")
        .createSignedUrls(chunk, SIGNED_URL_TTL);

      if (error || !data) return;

      for (const item of data) {
        if (item.path && item.signedUrl) {
          map.set(item.path, item.signedUrl);
        }
      }
    })
  );

  return map;
}

async function signSinglePath(
  supabase: SupabaseClient,
  path: string,
  variant: CatalogueImageVariant
): Promise<string | null> {
  if (variant === "full") {
    const { data, error } = await supabase.storage
      .from("product-images")
      .createSignedUrl(path, SIGNED_URL_TTL);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  }

  const { data, error } = await supabase.storage
    .from("product-images")
    .createSignedUrl(path, SIGNED_URL_TTL, { transform: GRID_IMAGE_TRANSFORM });

  if (!error && data?.signedUrl) return data.signedUrl;

  const fallback = await supabase.storage
    .from("product-images")
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (fallback.error || !fallback.data?.signedUrl) return null;
  return fallback.data.signedUrl;
}

/** Sign paths for grid (resized) or full (original) delivery. Grid uses parallel single-url signing with transform. */
export async function signStoragePathsForVariant(
  supabase: SupabaseClient,
  paths: string[],
  variant: CatalogueImageVariant
): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter(Boolean))];
  const map = new Map<string, string>();
  if (unique.length === 0) return map;

  if (variant === "full") {
    return signStoragePaths(supabase, unique);
  }

  for (let i = 0; i < unique.length; i += SIGN_PARALLEL) {
    const batch = unique.slice(i, i + SIGN_PARALLEL);
    const signed = await Promise.all(
      batch.map(async (path) => {
        const url = await signSinglePath(supabase, path, "grid");
        return url ? ([path, url] as const) : null;
      })
    );
    for (const entry of signed) {
      if (entry) map.set(entry[0], entry[1]);
    }
  }

  return map;
}

/**
 * Batched collage data: total count + up to COLLAGE_PREVIEW_LIMIT previews per article.
 * One `article_images` query per article-id chunk, one batched sign for all preview paths.
 */
export async function fetchCollagesByArticleId(
  supabase: SupabaseClient,
  articleIds: string[],
  altForArticle: (articleId: string) => string
): Promise<Map<string, ArticleCollageData>> {
  const result = new Map<string, ArticleCollageData>();
  if (articleIds.length === 0) return result;

  type MetaRow = Pick<ImageRow, "id" | "article_id" | "storage_path" | "is_primary" | "image_order" | "width" | "height">;
  const grouped = new Map<string, MetaRow[]>();

  for (let i = 0; i < articleIds.length; i += ARTICLE_CHUNK) {
    const chunk = articleIds.slice(i, i + ARTICLE_CHUNK);
    const { data, error } = await supabase
      .from("article_images")
      .select("id, article_id, storage_path, is_primary, image_order, width, height")
      .in("article_id", chunk);

    if (error || !data) continue;

    for (const row of data as MetaRow[]) {
      const list = grouped.get(row.article_id) ?? [];
      list.push(row);
      grouped.set(row.article_id, list);
    }
  }

  const pathsToSign: string[] = [];
  const previewMetaByArticle = new Map<
    string,
    { totalCount: number; rows: MetaRow[] }
  >();

  for (const [articleId, rows] of grouped) {
    const sorted = sortImageRows(rows);
    const previewRows = sorted.slice(0, COLLAGE_PREVIEW_LIMIT);
    previewMetaByArticle.set(articleId, { totalCount: sorted.length, rows: previewRows });
    for (const row of previewRows) {
      pathsToSign.push(row.storage_path);
    }
  }

  const signed = await signStoragePaths(supabase, pathsToSign);

  for (const [articleId, meta] of previewMetaByArticle) {
    const alt = altForArticle(articleId);
    const previews: CatalogueProductImage[] = [];
    for (const row of meta.rows) {
      const url = signed.get(row.storage_path);
      if (!url) continue;
      previews.push({
        id: row.id,
        url,
        isPrimary: row.is_primary,
        width: row.width,
        height: row.height,
        alt,
      });
    }
    result.set(articleId, { previews, totalCount: meta.totalCount });
  }

  return result;
}

/** @deprecated Use fetchCollagesByArticleId via attachCollageToProducts */
export async function fetchCoverImageUrlsByArticleId(
  supabase: SupabaseClient,
  articleIds: string[]
): Promise<Map<string, string>> {
  const collages = await fetchCollagesByArticleId(supabase, articleIds, () => "");
  const map = new Map<string, string>();
  for (const [id, data] of collages) {
    const url = data.previews[0]?.url;
    if (url) map.set(id, url);
  }
  return map;
}

const GALLERY_ROW_PAGE = 500;

/** All image rows for one article — no preview limit (paginated for PostgREST max rows). */
async function fetchAllImageRowsForArticle(
  supabase: SupabaseClient,
  articleId: string
): Promise<ImageRow[]> {
  const all: ImageRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("article_images")
      .select("id, article_id, storage_path, is_primary, image_order, width, height")
      .eq("article_id", articleId)
      .order("is_primary", { ascending: false })
      .order("image_order", { ascending: true })
      .range(from, from + GALLERY_ROW_PAGE - 1);

    if (error) {
      console.error("[fetchCompleteGalleryForArticle] select", {
        articleId,
        code: error.code,
        message: error.message,
      });
      break;
    }

    if (!data?.length) break;
    all.push(...(data as ImageRow[]));
    if (data.length < GALLERY_ROW_PAGE) break;
    from += GALLERY_ROW_PAGE;
  }

  return sortImageRows(all);
}

export type CompleteGalleryResult = {
  images: CatalogueProductImage[];
  /** Exact DB count (matches gallery length when every row signs successfully). */
  totalCount: number;
};

export type GalleryMetaResult = {
  items: Array<{
    id: string;
    storagePath: string;
    isPrimary: boolean;
    width: number | null;
    height: number | null;
  }>;
  totalCount: number;
};

/** Gallery rows only — no signed URLs (fast detail page shell). */
export async function fetchGalleryMetaForArticle(
  supabase: SupabaseClient,
  articleId: string
): Promise<GalleryMetaResult> {
  const [{ count, error: countError }, rows] = await Promise.all([
    supabase
      .from("article_images")
      .select("id", { count: "exact", head: true })
      .eq("article_id", articleId),
    fetchAllImageRowsForArticle(supabase, articleId),
  ]);

  if (countError) {
    console.error("[fetchGalleryMetaForArticle] count", countError);
  }

  const totalCount = count ?? rows.length;
  const items = rows.map((row) => ({
    id: row.id,
    storagePath: row.storage_path,
    isPrimary: row.is_primary,
    width: row.width,
    height: row.height,
  }));

  return { items, totalCount };
}

/**
 * Complete project gallery for detail/edit — every photo for the article, deterministic order.
 * Separate from collage preview queries used on listing cards.
 */
export async function fetchCompleteGalleryForArticle(
  supabase: SupabaseClient,
  articleId: string,
  altBase: string
): Promise<CompleteGalleryResult> {
  const [{ count, error: countError }, rows] = await Promise.all([
    supabase
      .from("article_images")
      .select("id", { count: "exact", head: true })
      .eq("article_id", articleId),
    fetchAllImageRowsForArticle(supabase, articleId),
  ]);

  if (countError) {
    console.error("[fetchCompleteGalleryForArticle] count", countError);
  }

  const totalCount = count ?? rows.length;
  if (rows.length === 0) {
    return { images: [], totalCount };
  }

  const signed = await signStoragePaths(
    supabase,
    rows.map((r) => r.storage_path)
  );

  const images: CatalogueProductImage[] = [];
  for (const row of rows) {
    const url = signed.get(row.storage_path);
    if (!url) {
      console.error("[fetchCompleteGalleryForArticle] missing signed url", {
        articleId,
        imageId: row.id,
        path: row.storage_path,
      });
      continue;
    }
    images.push({
      id: row.id,
      url,
      isPrimary: row.is_primary,
      width: row.width,
      height: row.height,
      alt: altBase,
    });
  }

  if (images.length < totalCount) {
    console.error("[fetchCompleteGalleryForArticle] signed fewer than db count", {
      articleId,
      totalCount,
      signedCount: images.length,
    });
  }

  return { images, totalCount };
}

/** @alias fetchCompleteGalleryForArticle — returns images only for callers that need the array. */
export async function fetchGalleryImagesForArticle(
  supabase: SupabaseClient,
  articleId: string,
  altBase: string
): Promise<CatalogueProductImage[]> {
  const { images } = await fetchCompleteGalleryForArticle(supabase, articleId, altBase);
  return images;
}
