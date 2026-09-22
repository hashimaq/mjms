import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createServiceRoleClient } from "../src/lib/supabase/admin";

function loadEnvFile() {
  const path = resolve(process.cwd(), ".env");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i <= 0) continue;
    const key = line.slice(0, i).trim();
    const val = line.slice(i + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile();

const emails = ["saad.manzoor@mjms.pk", "planner@mjms.pk"];

const supabase = createServiceRoleClient();
const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

for (const email of emails) {
  const u = list?.users?.find((x) => x.email?.toLowerCase() === email);
  if (!u) {
    console.log(`${email}: NO AUTH USER`);
    continue;
  }
  const { data: p, error } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", u.id)
    .maybeSingle();
  console.log(`${email}: role=${p?.role ?? "MISSING"} name=${p?.full_name ?? "—"} err=${error?.message ?? "none"}`);
}
