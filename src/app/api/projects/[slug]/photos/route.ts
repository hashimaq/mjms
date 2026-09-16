import { getSessionUser } from "@/lib/auth/session";
import {
  fetchProjectBySlug,
  fetchProjectPhotos,
} from "@/lib/projects/queries";
import { createRequestClient } from "@/lib/supabase/request";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  const { searchParams } = new URL(request.url);
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10));
  const limit = Math.min(48, Math.max(1, parseInt(searchParams.get("limit") ?? "24", 10)));

  try {
    const supabase = await createRequestClient();
    const project = await fetchProjectBySlug(supabase, slug);
    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const result = await fetchProjectPhotos(supabase, project.articleIds, {
      offset,
      limit,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to load photos" },
      { status: 500 }
    );
  }
}
