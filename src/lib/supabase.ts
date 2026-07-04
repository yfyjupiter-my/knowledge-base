import { createClient } from "@supabase/supabase-js";

// Server-only client. The API key is a publishable (anon-role) key kept in
// server env — it is never bundled for the browser. RLS on the kb_* tables
// grants the anon role access for this prototype; swap to a secret key and
// tighten the policies before production.
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_API_KEY;

if (!url || !key) {
  throw new Error("SUPABASE_URL and SUPABASE_API_KEY must be set in .env.local");
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});
