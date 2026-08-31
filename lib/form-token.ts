import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * A signed proof that somebody opened the contact form, and when.
 *
 * The form's pages are prerendered — `generateStaticParams` in the route means
 * the HTML is built once and served to everyone — so a timestamp baked into that
 * HTML would be the build time, identical for every visitor and useless as a
 * measure of how long anyone spent filling anything in. The token is therefore
 * minted on demand by `/api/form-token`, which the form asks for when the visitor
 * first touches a field.
 *
 * That timing is the point. The token dates the moment a person began, not the
 * moment a page was published, which gives the classifier two things it cannot
 * otherwise know: whether the request came through the rendered form at all, and
 * whether it was submitted faster than a human can read the labels.
 *
 * Signed rather than stored, because the alternative is a table of pending tokens
 * to insert into and sweep — a write per page view, to answer a question a
 * signature answers for free. Nothing here needs to be revoked, so there is
 * nothing worth keeping state for.
 *
 * **This is a signal, not a gate.** A missing or expired token adds to the spam
 * score and nothing more, because the honest reasons for one are real: a fetch
 * that failed on a train, a tab left open over lunch, JavaScript blocked
 * entirely. Refusing those outright would silently lose enquiries from people who
 * did nothing wrong, which is the failure this whole file exists to avoid making
 * worse.
 */

/**
 * How long a token stays good.
 *
 * Six hours is a form opened before lunch and sent after it. Past that the token
 * is treated as absent — which costs the visitor two points, not their message.
 */
const TOKEN_MAX_AGE_MS = 6 * 60 * 60 * 1000;

/**
 * Key for the signature.
 *
 * Same reasoning as the rate limiter's pepper, and the same fallback: a dedicated
 * variable if there is one, otherwise *derived* from the Supabase secret so the
 * two uses of that key material stay separated by a label. Deriving also means
 * this works with no extra configuration — including locally, where the fallback
 * hashes an empty string and is still perfectly self-consistent, which is all a
 * signature needs.
 */
function formSecret(): string {
  const dedicated = process.env.ENQUIRY_FORM_SECRET;
  if (dedicated) return dedicated;

  const secret = process.env.SUPABASE_SECRET_KEY ?? "";
  return createHash("sha256").update(`enquiry-form-secret:${secret}`).digest("hex");
}

function sign(issuedAt: string): string {
  return createHmac("sha256", formSecret()).update(issuedAt).digest("hex");
}

/** `<issuedAt>.<signature>`. Opaque to the client, which only echoes it back. */
export function issueFormToken(now: number = Date.now()): string {
  const issuedAt = String(now);
  return `${issuedAt}.${sign(issuedAt)}`;
}

export type FormTokenCheck = {
  valid: boolean;
  /**
   * Milliseconds between the token being issued and the submission arriving, or
   * null when there is no trustworthy answer. Only ever set for a valid
   * signature: an unsigned number is the bot's to choose.
   */
  fillMs: number | null;
};

/**
 * Checks a token and reports how long the visitor took.
 *
 * A token from the future fails: clocks skew by seconds, not minutes, and a
 * timestamp ahead of now is either a forgery attempt or a machine nobody should
 * be trusting arithmetic from.
 */
export function verifyFormToken(
  raw: unknown,
  now: number = Date.now(),
): FormTokenCheck {
  if (typeof raw !== "string" || raw.length > 200) return { valid: false, fillMs: null };

  const separator = raw.indexOf(".");
  if (separator <= 0) return { valid: false, fillMs: null };

  const issuedAt = raw.slice(0, separator);
  const provided = raw.slice(separator + 1);
  if (!/^\d{1,15}$/.test(issuedAt)) return { valid: false, fillMs: null };

  const expected = sign(issuedAt);
  // Compared byte-wise in constant time. The window this closes is narrow —
  // there is no secret to recover here beyond the key itself — but the cost of
  // doing it properly is one function call.
  if (provided.length !== expected.length) return { valid: false, fillMs: null };
  if (!timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) {
    return { valid: false, fillMs: null };
  }

  const age = now - Number(issuedAt);
  if (age < 0 || age > TOKEN_MAX_AGE_MS) return { valid: false, fillMs: null };

  return { valid: true, fillMs: age };
}
