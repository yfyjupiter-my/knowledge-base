import "server-only";
import { createClient } from "@supabase/supabase-js";

// Server-only client. SUPABASE_API_KEY must be the SECRET (service_role) key,
// never the publishable/anon key, and is never bundled for the browser. The
// kb_* tables have RLS enabled with no anon policies (see migration
// sec2_lock_down_kb_rls); only the secret key — which bypasses RLS — can reach
// them. Authorization is enforced in the app layer (auth.ts / actions.ts).
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_API_KEY;

if (!url || !key) {
  throw new Error("SUPABASE_URL and SUPABASE_API_KEY must be set in .env.local");
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});
