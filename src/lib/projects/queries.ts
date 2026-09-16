import type { SupabaseClient } from "@supabase/supabase-js";
import { projectSlug } from "@/lib/utils";
import type {
  ArticleImageRow,
  ArticleRow,
  ProjectPhoto,
  ProjectSummary,
} from "./types";

const SIGNED_URL_TTL = 3600;

function projectKey(article: ArticleRow): string {
  return (article.project_normalized || article.project_raw).trim().toLowerCase();
}

function displayName(articles: ArticleRow[]): string {
  const counts = new Map<string, number>();
  for (const a of articles) {
    const name = a.project_raw.trim();
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  let best = articles[0]?.project_raw.trim() ?? "Untitled";
  let bestCount = 0;
  for (const [name, count] of counts) {
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

async function signUrls(
  supabase: SupabaseClient,
  paths: string[]
): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter(Boolean))];
  const map = new Map<string, string>();
  if (unique.length === 0) return map;

  const { data, error } = await supabase.storage
    .from("product-images")
    .createSignedUrls(unique, SIGNED_URL_TTL);

  if (error || !data) return map;

  for (const item of data) {
    if (item.path && item.signedUrl) {
      map.set(item.path, item.signedUrl);
    }
  }
  return map;
}

export async function fetchArticles(
  supabase: SupabaseClient
): Promise<ArticleRow[]> {
  const rows: ArticleRow[] = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("articles")
      .select("id, project_raw, project_normalized, created_at")
      .order("project_raw")
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data?.length) break;
    rows.push(...(data as ArticleRow[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

export async function fetchAllImageCounts(
  supabase: SupabaseClient,
  articleIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (articleIds.length === 0) return counts;

  const chunkSize = 200;
  for (let i = 0; i < articleIds.length; i += chunkSize) {
    const chunk = articleIds.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from("article_images")
      .select("article_id")
      .in("article_id", chunk);

    if (error) throw error;
    for (const row of data ?? []) {
      counts.set(row.article_id, (counts.get(row.article_id) ?? 0) + 1);
    }
  }

  return counts;
}

export async function fetchPrimaryImages(
  supabase: SupabaseClient,
  articleIds: string[]
): Promise<Map<string, ArticleImageRow>> {
  const map = new Map<string, ArticleImageRow>();
  if (articleIds.length === 0) return map;

  const chunkSize = 200;
  for (let i = 0; i < articleIds.length; i += chunkSize) {
    const chunk = articleIds.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from("article_images")
      .select(
        "id, article_id, storage_path, image_order, is_primary, width, height, original_filename"
      )
      .in("article_id", chunk)
      .eq("is_primary", true);

    if (error) throw error;
    for (const row of (data ?? []) as ArticleImageRow[]) {
      map.set(row.article_id, row);
    }
  }

  return map;
}

export async function buildProjectSummaries(
  supabase: SupabaseClient,
  searchQuery?: string
): Promise<ProjectSummary[]> {
  const articles = await fetchArticles(supabase);
  const grouped = new Map<string, ArticleRow[]>();

  for (const article of articles) {
    const key = projectKey(article);
    if (!key) continue;
    const list = grouped.get(key) ?? [];
    list.push(article);
    grouped.set(key, list);
  }

  const allArticleIds = articles.map((a) => a.id);
  const [imageCounts, primaryImages] = await Promise.all([
    fetchAllImageCounts(supabase, allArticleIds),
    fetchPrimaryImages(supabase, allArticleIds),
  ]);

  const summaries: ProjectSummary[] = [];

  for (const [, group] of grouped) {
    const name = displayName(group);
    const slug = projectSlug(name);
    const articleIds = group.map((a) => a.id);
    let photoCount = 0;
    let cover: ArticleImageRow | undefined;

    for (const id of articleIds) {
      photoCount += imageCounts.get(id) ?? 0;
      const primary = primaryImages.get(id);
      if (primary && (!cover || primary.image_order < cover.image_order)) {
        cover = primary;
      }
    }

    summaries.push({
      slug,
      name,
      photoCount,
      coverStoragePath: cover?.storage_path ?? null,
      coverImageUrl: null,
      articleIds,
    });
  }

  summaries.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  const normalizedSearch = searchQuery?.trim().toLowerCase();
  const filtered = normalizedSearch
    ? summaries.filter((p) => p.name.toLowerCase().includes(normalizedSearch))
    : summaries;

  const coverPaths = filtered
    .map((p) => p.coverStoragePath)
    .filter((p): p is string => Boolean(p));
  const signed = await signUrls(supabase, coverPaths);

  return filtered.map((p) => ({
    ...p,
    coverImageUrl: p.coverStoragePath ? signed.get(p.coverStoragePath) ?? null : null,
  }));
}

export async function fetchProjectBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<ProjectSummary | null> {
  const projects = await buildProjectSummaries(supabase);
  return projects.find((p) => p.slug === slug) ?? null;
}

export async function fetchProjectPhotos(
  supabase: SupabaseClient,
  articleIds: string[],
  options: { offset?: number; limit?: number } = {}
): Promise<{ photos: ProjectPhoto[]; total: number }> {
  const { offset = 0, limit = 24 } = options;
  if (articleIds.length === 0) {
    return { photos: [], total: 0 };
  }

  const { count, error: countError } = await supabase
    .from("article_images")
    .select("id", { count: "exact", head: true })
    .in("article_id", articleIds);

  if (countError) throw countError;

  const { data, error } = await supabase
    .from("article_images")
    .select(
      "id, article_id, storage_path, image_order, is_primary, width, height, original_filename"
    )
    .in("article_id", articleIds)
    .order("image_order", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  const rows = (data ?? []) as ArticleImageRow[];
  const signed = await signUrls(
    supabase,
    rows.map((r) => r.storage_path)
  );

  const photos: ProjectPhoto[] = rows.map((row) => ({
    id: row.id,
    articleId: row.article_id,
    storagePath: row.storage_path,
    imageUrl: signed.get(row.storage_path) ?? null,
    imageOrder: row.image_order,
    isPrimary: row.is_primary,
    width: row.width,
    height: row.height,
    originalFilename: row.original_filename,
  }));

  return { photos, total: count ?? 0 };
}

export async function fetchUserProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<{ role: "staff" | "admin"; fullName: string | null } | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    role: data.role as "staff" | "admin",
    fullName: data.full_name,
  };
}
