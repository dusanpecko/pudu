/**
 * Supabase connection details. Only the publishable key is used anywhere in
 * this project — it is safe in the browser because sign-ups are disabled and
 * every table is protected by row level security. The secret (service role) key
 * is deliberately not read here; nothing in the app needs it.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/** False when the project has no Supabase configuration yet. */
export const supabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);
