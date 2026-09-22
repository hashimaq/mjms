import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

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

async function testDirect(label: string, email: string, password: string) {
  const supabase = createClient(url, anon);
  await supabase.auth.signInWithPassword({ email, password });

  const sourceSheet = "WINTER HEEL";
  const ts = Date.now();
  const { data, error } = await supabase
    .from("articles")
    .insert({
      project_raw: `DIRECT TEST ${ts}`,
      project_normalized: `DIRECT TEST ${ts}`,
      source_sheet: sourceSheet,
      source_row: 999999,
      source_key: `${sourceSheet}::direct-test-${ts}`,
      source_no: null,
    })
    .select("id")
    .single();

  console.log(`[${label}] direct insert`, error?.code ?? "ok", error?.message ?? data?.id);
  if (data?.id) {
    await createClient(url, service).from("articles").delete().eq("id", data.id);
  }
}

async function main() {
  await testDirect("admin", process.env.MJMS_INITIAL_ADMIN_EMAIL!, process.env.MJMS_INITIAL_ADMIN_PASSWORD!);
  await testDirect("employee", process.env.MJMS_INITIAL_EMPLOYEE_EMAIL!, process.env.MJMS_INITIAL_EMPLOYEE_PASSWORD!);
}

main();
