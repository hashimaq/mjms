/**
 * Verifies complete gallery fetch returns all image rows (no preview limit).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    const p = resolve(process.cwd(), name);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
      if (!line || line.startsWith("#")) continue;
      const i = line.indexOf("=");
      if (i <= 0) continue;
      const key = line.slice(0, i).trim();
      const val = line.slice(i + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const svc = createClient(url, service);

const articleId = randomUUID();
const sourceSheet = "WINTER HEEL";
const ts = randomUUID().slice(0, 8);

await svc.from("articles").insert({
  id: articleId,
  project_raw: `GALLERY TEST ${ts}`,
  project_normalized: `GALLERY TEST ${ts}`,
  source_sheet: sourceSheet,
  source_row: 999991,
  source_key: `${sourceSheet}::manual-${ts}`,
  season_raw: "WINTER",
});

const rows = Array.from({ length: 12 }, (_, i) => ({
  article_id: articleId,
  storage_path: `products/${articleId}/${String(i + 1).padStart(2, "0")}.jpeg`,
  original_filename: `t${i + 1}.jpg`,
  mime_type: "image/jpeg",
  file_size: 100,
  image_order: i + 1,
  is_primary: i === 0,
  verification_status: "VERIFIED",
  manifest_confidence: "HIGH",
}));

const { error: insErr } = await svc.from("article_images").insert(rows);
if (insErr) {
  console.error("insert images failed", insErr.message);
  process.exit(1);
}

const { count } = await svc
  .from("article_images")
  .select("id", { count: "exact", head: true })
  .eq("article_id", articleId);

const { data: allRows } = await svc
  .from("article_images")
  .select("id")
  .eq("article_id", articleId);

console.log("db count", count, "select rows", allRows?.length ?? 0);

await svc.from("article_images").delete().eq("article_id", articleId);
await svc.from("articles").delete().eq("id", articleId);
console.log("cleanup ok — expect count=12 rows=12");
