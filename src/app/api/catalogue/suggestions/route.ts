import {
  isCategorySlug,
  isSeasonSlug,
  type CategorySlug,
  type SeasonSlug,
} from "@/lib/collections/config";
import { CATALOGUE_SUGGEST_MIN_CHARS } from "@/lib/catalogue/search-constants";
import { suggestCatalogue } from "@/lib/catalogue/search";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < CATALOGUE_SUGGEST_MIN_CHARS) {
    return NextResponse.json({ ok: true, suggestions: [] });
  }

  const seasonRaw = searchParams.get("season");
  const categoryRaw = searchParams.get("category");
  const season =
    seasonRaw && isSeasonSlug(seasonRaw) ? (seasonRaw as SeasonSlug) : undefined;
  const category =
    categoryRaw && isCategorySlug(categoryRaw) ? (categoryRaw as CategorySlug) : undefined;

  const result = await suggestCatalogue({ q, season, category });

  if (!result.ok) {
    return NextResponse.json({ ok: false, suggestions: [] }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    suggestions: result.suggestions,
    dataSource: result.dataSource,
  });
}
