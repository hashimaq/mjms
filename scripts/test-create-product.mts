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
const email = process.env.MJMS_INITIAL_ADMIN_EMAIL ?? "saad.manzoor@mjms.pk";
const password = process.env.MJMS_INITIAL_ADMIN_PASSWORD ?? "";

async function testAs(label: string, userEmail: string, userPassword: string) {
  const supabase = createClient(url, anon);
  const { data: signIn, error: signErr } = await supabase.auth.signInWithPassword({
    email: userEmail,
    password: userPassword,
  });
  if (signErr || !signIn.user) {
    console.error(`[${label}] signIn failed`, signErr);
    return;
  }
  console.log(`[${label}] signed in`, signIn.user.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", signIn.user.id)
    .maybeSingle();
  console.log(`[${label}] profile`, profile);

  const sourceSheet = "WINTER HEEL";
  const { count } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("source_sheet", sourceSheet);

  const nextRow = (count ?? 0) + 1;
  const sourceKey = `${sourceSheet}::manual-test-${Date.now()}`;

  const { error: appendTest } = await supabase.rpc("append_activity_log", {
    p_action: "LOGIN",
    p_entity_type: "session",
    p_entity_id: null,
    p_metadata: {},
  });
  console.log(`[${label}] append_activity_log`, appendTest?.code ?? "ok");

  const { data: articleId, error: rpcError } = await supabase.rpc("create_article_with_activity", {
    p_project_raw: `TEST CREATE ${Date.now()}`,
    p_source_sheet: sourceSheet,
    p_source_row: nextRow,
    p_source_key: sourceKey,
    p_source_no: null,
    p_season_raw: "WINTER",
    p_making_raw: null,
    p_type_raw: null,
    p_material_raw: null,
    p_colour_raw: null,
    p_size_range_raw: null,
    p_qty_raw: null,
    p_remarks_raw: null,
    p_metadata: { test: true },
  });

  console.log(`[${label}] rpc result`, { articleId, rpcError: rpcError ? JSON.stringify(rpcError, null, 2) : null });

  if (articleId) {
    await supabase.from("articles").delete().eq("id", articleId);
    console.log(`[${label}] cleaned up test row`);
  }
}

async function main() {
  await testAs("admin", email, password);
  const empEmail = process.env.MJMS_INITIAL_EMPLOYEE_EMAIL ?? "planner@mjms.pk";
  const empPass = process.env.MJMS_INITIAL_EMPLOYEE_PASSWORD ?? "";
  await testAs("employee", empEmail, empPass);
}

main().catch(console.error);
