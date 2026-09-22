/**
 * End-to-end smoke: create article, search (service role reader), upload path check, cleanup.
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
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const projectName = `P0 TEST ${randomUUID().slice(0, 8)}`;
const sourceSheet = "WINTER HEEL";

async function main() {
  const svc = createClient(url, service);
  const admin = createClient(url, anon);
  await admin.auth.signInWithPassword({
    email: process.env.MJMS_INITIAL_ADMIN_EMAIL!,
    password: process.env.MJMS_INITIAL_ADMIN_PASSWORD!,
  });

  const row = {
    project_raw: projectName,
    project_normalized: projectName.toUpperCase(),
    source_sheet: sourceSheet,
    source_row: 999990,
    source_key: `${sourceSheet}::manual-${randomUUID()}`,
    source_no: null,
    season_raw: "WINTER",
  };

  const { data: inserted, error: insErr } = await admin.from("articles").insert(row).select("id").single();
  if (insErr || !inserted?.id) {
    console.error("insert failed", insErr?.code, insErr?.message);
    process.exit(1);
  }
  const articleId = inserted.id as string;
  console.log("created", articleId, projectName);

  const { data: searchRows, error: searchErr } = await svc
    .from("articles")
    .select("id, project_raw")
    .or(`project_raw.ilike.%${projectName}%,source_no.ilike.%${projectName}%`)
    .limit(5);

  console.log(
    "search (service reader)",
    searchErr ? `${searchErr.code} ${searchErr.message}` : `hits=${searchRows?.length ?? 0}`
  );

  const storagePath = `products/${articleId}/01.jpeg`;
  const tiny = Buffer.from(
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDAQESEyUkUF5fYffh8f//AABEIAAEAAQMBIgACEQEDEQH/xABXAAADAQAAAAAAAAAAAAAAAAAAAwQFB//EACUQAAICAgEDBAMAAAAAAAAAAAECAAMEESExEiJBUfATYYH/xAAXAQADAQAAAAAAAAAAAAAAAAABAgMA/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEiEx/9oADAMBAAIRAxEAPwD3WiiigA//2Q==",
    "base64"
  );

  const { error: upErr } = await admin.storage.from("product-images").upload(storagePath, tiny, {
    contentType: "image/jpeg",
    upsert: false,
  });
  console.log("storage upload", upErr ? `${upErr.message}` : "ok");

  if (!upErr) {
    const { error: imgErr } = await admin.from("article_images").insert({
      article_id: articleId,
      storage_path: storagePath,
      original_filename: "test.jpg",
      mime_type: "image/jpeg",
      file_size: tiny.length,
      image_order: 1,
      is_primary: true,
      verification_status: "VERIFIED",
      manifest_confidence: "HIGH",
    });
    console.log("article_images insert", imgErr ? `${imgErr.code} ${imgErr.message}` : "ok");

    const { data: signed } = await svc.storage.from("product-images").createSignedUrls([storagePath], 3600);
    console.log("signed url", signed?.[0]?.signedUrl ? "ok" : "missing");
  }

  await svc.from("article_images").delete().eq("article_id", articleId);
  await svc.storage.from("product-images").remove([storagePath]);
  await svc.from("articles").delete().eq("id", articleId);
  console.log("cleanup done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
