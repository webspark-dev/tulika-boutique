import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";

const isConfigured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(SUPABASE_URL)
  && SUPABASE_ANON_KEY.length > 30
  && !SUPABASE_ANON_KEY.startsWith("YOUR_");

export const supabase = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Update SUPABASE_URL and SUPABASE_ANON_KEY in config.js.");
  }
  return supabase;
}

export function publicPhotoUrl(path) {
  const client = requireSupabase();
  return client.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}
