import "server-only";

import { createClient } from "@supabase/supabase-js";

import { supabaseUrl } from "@/lib/supabase/env";

/**
 * Supabase client that bypasses row level security.
 *
 * This is the only place the secret key is read, and `server-only` makes the
 * build fail if a client component ever imports this module — a stronger
 * guarantee than remembering not to.
 *
 * It exists because `smtp_settings` holds a mail password. That table has RLS
 * enabled and no policies, so the publishable key cannot reach it at all; the
 * server reads and writes it with this client instead.
 */
const secretKey = process.env.SUPABASE_SECRET_KEY ?? "";

export const adminClientConfigured = Boolean(supabaseUrl && secretKey);

export function createSupabaseAdminClient() {
  if (!adminClientConfigured) {
    throw new Error(
      "SUPABASE_SECRET_KEY is not set — server-side settings access is unavailable.",
    );
  }

  return createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
