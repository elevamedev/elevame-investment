// Brief 6.5/6.2: "Delete my account" (SettingsView, Phase P). Runs with
// the service key so it can call auth.admin.deleteUser — the client's
// own JWT can never do that. Deleting the auth user cascades to
// `clients` (FK `on delete cascade`, 20261024_privacy_integrity.sql)
// and from there to every table that references it, plus a trigger
// that removes the matching v1 `profiles` row. No storage buckets are
// in use yet (nothing to remove there today, but the step is kept so
// the day one exists this doesn't need rediscovering).
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), { status: 401, headers: CORS_HEADERS });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  // Identify the caller from their own JWT — never trust a client id passed in the body.
  const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userErr } = await callerClient.auth.getUser();
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: "Not signed in" }), { status: 401, headers: CORS_HEADERS });
  }
  const authUserId = userData.user.id;

  const admin = createClient(supabaseUrl, serviceKey);

  const { data: clientRow, error: clientErr } = await admin.from("clients").select("id").eq("auth_user_id", authUserId).maybeSingle();
  if (clientErr || !clientRow) {
    return new Response(JSON.stringify({ error: "No client account for this sign in" }), { status: 404, headers: CORS_HEADERS });
  }

  // No storage buckets are used by the app yet — nothing to remove there today.

  await admin.from("deletion_log").insert({ client_id: clientRow.id });

  const { error: deleteErr } = await admin.auth.admin.deleteUser(authUserId);
  if (deleteErr) {
    return new Response(JSON.stringify({ error: deleteErr.message }), { status: 500, headers: CORS_HEADERS });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
});
