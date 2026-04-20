import { createClient, SupabaseClient } from "@supabase/supabase-js";

/** Lazy server-side client. Prefers the service-role key when available
 *  (server-only routes / scripts). Falls back to the publishable/anon key.
 *  Env vars are read on first access so scripts that load dotenv after
 *  imports still work. */
let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL missing");
  const key = serviceKey || anonKey;
  _supabase = createClient(url, key, { auth: { persistSession: false } });
  return _supabase;
}

/** Proxy so existing `supabase.from(...)` call sites keep working. */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    const client = getSupabase() as unknown as Record<string | symbol, unknown>;
    const value = client[prop];
    return typeof value === "function" ? (value as Function).bind(client) : value;
  },
});

/** Service-role client. Server-only. Used by migration + ingest scripts and privileged routes. */
export function supabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL missing");
  if (!serviceKey)
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY missing — required for migrate/seed/admin ops"
    );
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
