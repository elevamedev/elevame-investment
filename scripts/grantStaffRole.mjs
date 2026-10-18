#!/usr/bin/env node
/**
 * Grant (or update) a staff role for an existing Supabase Auth user,
 * so they can sign into the admin review panel.
 *
 * Usage:
 *   node scripts/grantStaffRole.mjs --email you@elevame.es --role admin
 *   node scripts/grantStaffRole.mjs --email nutritionist@elevame.es --role clinician
 *
 * The person must already have a Supabase Auth account (sign up in
 * the app first, or create one with scripts/seed.mjs's pattern) —
 * this only adds the `staff` row that elevates them.
 */
import "dotenv/config";
import { parseArgs } from "node:util";
import { createClient } from "@supabase/supabase-js";

const { values: args } = parseArgs({ options: { email: { type: "string" }, role: { type: "string" } } });
if (!args.email || !args.role || !["clinician", "admin"].includes(args.role)) {
  console.error('Usage: node scripts/grantStaffRole.mjs --email you@example.com --role admin|clinician');
  process.exit(1);
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your environment (.env).");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

async function findUserByEmail(email) {
  const target = email.toLowerCase();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find(u => u.email?.toLowerCase() === target);
    if (match) return match;
    if (data.users.length < 200) break;
  }
  return null;
}

async function main() {
  const user = await findUserByEmail(args.email);
  if (!user) {
    console.error(`No Supabase Auth account found for ${args.email} — they need to sign up in the app first.`);
    process.exit(1);
  }
  const { error } = await supabase.from("staff").upsert({ user_id: user.id, role: args.role }, { onConflict: "user_id" });
  if (error) throw error;
  console.log(`✓ ${args.email} is now a "${args.role}" — they'll see the admin review panel next time they sign in.`);
}

main().catch(err => {
  console.error("grantStaffRole failed:", err.message || err);
  process.exit(1);
});
