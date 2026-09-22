import { getCatalogueReaderClient } from "@/lib/catalogue/catalogue-reader";
import type { CatalogueImageVariant } from "@/lib/catalogue/images";
import { signVerifiedArticleImagePaths } from "@/lib/catalogue/sign-article-image-urls";
import { NextResponse } from "next/server";

const MAX_PATHS = 40;

type Body = {
  articleId?: string;
  paths?: string[];
  variant?: CatalogueImageVariant;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON" }, { status: 400 });
  }

  const articleId = body.articleId?.trim();
  const paths = Array.isArray(body.paths) ? body.paths.filter((p) => typeof p === "string") : [];
  const variant: CatalogueImageVariant = body.variant === "full" ? "full" : "grid";

  if (!articleId || paths.length === 0) {
    return NextResponse.json({ ok: false, message: "Missing articleId or paths" }, { status: 400 });
  }

  if (paths.length > MAX_PATHS) {
    return NextResponse.json({ ok: false, message: "Too many paths" }, { status: 400 });
  }

  const client = await getCatalogueReaderClient();
  if (!client) {
    return NextResponse.json({ ok: false, message: "Unavailable" }, { status: 503 });
  }

  try {
    const urls = await signVerifiedArticleImagePaths(client, articleId, paths, variant);
    return NextResponse.json({ ok: true, urls });
  } catch {
    return NextResponse.json({ ok: false, message: "Signing failed" }, { status: 500 });
  }
}
