/**
 * Verifies create fallback (no RPC) using the same insert path as create-article-server.
 * Loads .env locally; does not print secrets.
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

async function createLikeApp(label: string, email: string, password: string) {
  const userClient = createClient(url, anon);
  await userClient.auth.signInWithPassword({ email, password });
  const sourceSheet = "WINTER HEEL";
  const ts = randomUUID();
  const row = {
    project_raw: `FALLBACK TEST ${ts}`,
    project_normalized: `FALLBACK TEST ${ts}`,
    source_sheet: sourceSheet,
    source_row: 999998,
    source_key: `${sourceSheet}::manual-${ts}`,
    source_no: null,
    season_raw: "WINTER",
  };

  let { data, error } = await userClient.from("articles").insert(row).select("id").single();
  if (error?.code === "42501") {
    const svc = createClient(url, service);
    ({ data, error } = await svc.from("articles").insert(row).select("id").single());
  }

  console.log(`[${label}]`, error ? `${error.code} ${error.message}` : `ok ${data?.id}`);
  if (data?.id) {
    await createClient(url, service).from("articles").delete().eq("id", data.id);
  }
}

await createLikeApp("admin", process.env.MJMS_INITIAL_ADMIN_EMAIL!, process.env.MJMS_INITIAL_ADMIN_PASSWORD!);
await createLikeApp("employee", process.env.MJMS_INITIAL_EMPLOYEE_EMAIL!, process.env.MJMS_INITIAL_EMPLOYEE_PASSWORD!);
