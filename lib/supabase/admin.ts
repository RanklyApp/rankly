import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for privileged server-only operations (logo uploads to
 * Storage, admin mutations). NEVER import this into client components — the
 * service role key bypasses Row Level Security.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Storage bucket that holds uploaded app logos (public read). */
export const LOGO_BUCKET = "logos";
