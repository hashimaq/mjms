import {
  AssistantAgentError,
  runAssistantAgent,
} from "@/lib/catalogue/assistant-agent";
import { sanitizeAssistantContext } from "@/lib/catalogue/assistant-context";
import { NextResponse } from "next/server";

type AssistantRequestBody = {
  query?: unknown;
  page?: unknown;
  context?: unknown;
};

function parsePage(value: unknown): number {
  if (value === undefined || value === null) return 1;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

export async function POST(request: Request) {
  let body: AssistantRequestBody;
  try {
    body = (await request.json()) as AssistantRequestBody;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body.query !== "string") {
    return NextResponse.json({ ok: false, message: "Field \"query\" must be a string." }, { status: 400 });
  }

  const originalQuery = body.query.trim();
  if (!originalQuery) {
    return NextResponse.json({ ok: false, message: "Query must not be empty." }, { status: 400 });
  }

  const page = parsePage(body.page);
  const context = sanitizeAssistantContext(body.context);

  try {
    const result = await runAssistantAgent(originalQuery, page, context);

    return NextResponse.json({
      ok: true,
      query: originalQuery,
      message: result.message,
      filters: result.filters,
      products: result.products,
      pagination: result.pagination,
      facets: result.facets,
    });
  } catch (err) {
    if (err instanceof AssistantAgentError) {
      const status =
        err.code === "VALIDATION"
          ? 400
          : err.code === "CONFIG"
            ? 503
            : err.code === "TOOL"
              ? 502
              : 502;
      return NextResponse.json({ ok: false, message: err.message }, { status });
    }
    return NextResponse.json(
      { ok: false, message: "Unable to process this request." },
      { status: 502 }
    );
  }
}
