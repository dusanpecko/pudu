/**
 * Who may use the content tooling.
 *
 * A valid Supabase session is not enough on its own: as long as sign-ups are
 * enabled, anyone can create an account with the publishable key, which is
 * public by design. This allowlist is the second lock, and it lives in a
 * server-only variable so the browser never sees the list.
 *
 * An empty or missing list denies everyone — the tooling fails closed.
 */
const allowlist = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((entry) => entry.trim().toLowerCase())
  .filter(Boolean);

export function isEditor(email: string | null | undefined): boolean {
  if (!email) return false;
  return allowlist.includes(email.toLowerCase());
}

/** True when at least one editor is configured. */
export const editorsConfigured = allowlist.length > 0;
