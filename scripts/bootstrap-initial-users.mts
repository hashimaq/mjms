import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvFile() {
  for (const name of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), name);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      if (!line || line.startsWith("#")) continue;
      const i = line.indexOf("=");
      if (i <= 0) continue;
      const key = line.slice(0, i).trim();
      const val = line.slice(i + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

loadEnvFile();

import { bootstrapInitialUsers } from "../src/lib/auth/bootstrap-initial-users";

const result = await bootstrapInitialUsers();

console.log("Bootstrap complete.");
if (result.created.length) console.log("Created:", result.created.join(", "));
if (result.skipped.length) console.log("Already existed (profile synced):", result.skipped.join(", "));
if (result.errors.length) {
  console.error("Errors:");
  for (const e of result.errors) console.error(`  ${e.email}: ${e.message}`);
  process.exit(1);
}
