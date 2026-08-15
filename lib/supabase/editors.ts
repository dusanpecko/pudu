/**
 * The addresses configured in the environment, which are the way back in.
 *
 * A valid Supabase session is not enough on its own: it proves who somebody is,
 * not that they are allowed in. The allowlist is the second lock, and it lives
 * in a server-only variable so the browser never sees the list.
 *
 * Since the `editors` table exists this is no longer the whole allowlist — the
 * effective one is this plus the table, resolved in `lib/editors.ts`. What this
 * list still is, and the reason it stays, is the door that does not depend on
 * the database: a row deleted by mistake, or a database that cannot be reached,
 * would otherwise leave nobody able to fix it.
 *
 * Keep at least one address here. An empty list is not an error, but it removes
 * that door.
 */
export const envEditors = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((entry) => entry.trim().toLowerCase())
  .filter(Boolean);

/** True when the environment names at least one editor. */
export const editorsConfigured = envEditors.length > 0;

/** Whether the environment alone admits this address. */
export function isEnvEditor(email: string | null | undefined): boolean {
  if (!email) return false;
  return envEditors.includes(email.toLowerCase());
}
