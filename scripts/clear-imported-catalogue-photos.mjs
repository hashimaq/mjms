/**
 * Removes Excel-imported catalogue photos only (article_images + Storage objects).
 * Preserves articles and any image rows without import_ref (manual uploads).
 *
 * Usage:
 *   node scripts/clear-imported-catalogue-photos.mjs --dry-run
 *   node scripts/clear-imported-catalogue-photos.mjs --execute
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run") || !args.has("--execute");

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const STORAGE_CHUNK = 100;

async function fetchImportedImageRows() {
  const pageSize = 1000;
  let from = 0;
  const all = [];

  for (;;) {
    const { data, error } = await supabase
      .from("article_images")
      .select("id, storage_path, import_ref, article_id")
      .not("import_ref", "is", null)
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data?.length) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return all;
}

async function main() {
  const rows = await fetchImportedImageRows();
  const paths = [...new Set(rows.map((r) => r.storage_path).filter(Boolean))];
  const ids = rows.map((r) => r.id);

  console.log(
    JSON.stringify(
      {
        mode: dryRun ? "dry-run" : "execute",
        importedImageRows: rows.length,
        uniqueStoragePaths: paths.length,
        samplePaths: paths.slice(0, 5),
      },
      null,
      2
    )
  );

  if (dryRun) {
    console.log("\nRe-run with --execute to delete these rows and storage objects.");
    return;
  }

  if (ids.length) {
    for (let i = 0; i < ids.length; i += STORAGE_CHUNK) {
      const chunk = ids.slice(i, i + STORAGE_CHUNK);
      const { error } = await supabase.from("article_images").delete().in("id", chunk);
      if (error) throw error;
    }
  }

  if (paths.length) {
    for (let i = 0; i < paths.length; i += STORAGE_CHUNK) {
      const chunk = paths.slice(i, i + STORAGE_CHUNK);
      const { error } = await supabase.storage.from("product-images").remove(chunk);
      if (error) {
        console.warn("Storage remove warning:", error.message, "chunk", chunk.length);
      }
    }
  }

  const remaining = await fetchImportedImageRows();
  console.log(
    JSON.stringify(
      {
        deletedRows: ids.length,
        deletedStoragePaths: paths.length,
        remainingImportedRows: remaining.length,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
