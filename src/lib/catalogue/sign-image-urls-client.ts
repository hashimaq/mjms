import type { CatalogueImageVariant } from "@/lib/catalogue/images";

export async function fetchSignedCatalogueImageUrls(
  articleId: string,
  paths: string[],
  variant: CatalogueImageVariant
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};

  const res = await fetch("/api/catalogue/sign-image-urls", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ articleId, paths, variant }),
  });

  if (!res.ok) return {};

  const json = (await res.json()) as { ok?: boolean; urls?: Record<string, string> };
  if (!json.ok || !json.urls) return {};
  return json.urls;
}
