import "server-only";

import { siteHostnames } from "@/lib/site";

/**
 * Cloudflare Turnstile, the one defence here that a distributed bot cannot
 * simply comply with.
 *
 * Everything else on this form reasons about the *content* of a submission:
 * the honeypot asks whether a hidden field was filled, the classifier asks what
 * language the message is in, the token asks how long it took. All three can in
 * principle be satisfied by a bot that tries hard enough — the flood that
 * prompted this work had already learned to skip the hidden field. Turnstile asks
 * something different: whether a real browser did real work, attested by somebody
 * other than us. That question has no cheap answer at scale.
 *
 * Turnstile rather than reCAPTCHA because this site serves the EU and its privacy
 * notice has to survive being read: Cloudflare's challenge sets no tracking
 * cookie and does not exist to profile the visitor, and in managed mode most
 * people never see a puzzle at all.
 *
 * ## Optional on purpose
 *
 * With no keys configured this module reports itself unconfigured and the action
 * skips it. The site therefore keeps working before the keys exist, and the other
 * layers carry the load in the meantime — which is exactly the state this was
 * written in. Configuring it later is two environment variables and nothing else.
 */

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** The field the widget writes into the form. Cloudflare's default name. */
export const TURNSTILE_FIELD = "cf-turnstile-response";

/**
 * The action the contact form's widget declares, checked on the way back.
 *
 * A Turnstile widget is an account-level object, and a token solved for one
 * surface is a token. Without this, a challenge solved on any other page using
 * the same sitekey would be accepted here.
 */
export const TURNSTILE_ACTION = "enquiry";

/**
 * Hostnames a token may legitimately have been solved on.
 *
 * This is the check that makes the widget's own hostname list safe to be
 * generous with. Cloudflare's guidance — "do not allow local hostnames in
 * production" — is about exactly one attack: `localhost` on the widget lets
 * anybody who reads the sitekey out of the page source solve a challenge on their
 * own machine and post the token here, and `success: true` would be the honest
 * answer, because a human really did solve it. What distinguishes that token from
 * a customer's is *where* it was solved, which siteverify reports and which only
 * we can judge.
 *
 * The set itself lives in lib/site.ts, because the same question — "is this host
 * ours?" — is now also asked of the `Origin` header on every submission.
 */
const expectedHostnames = siteHostnames;

/**
 * Whether to hold a token to where and what it was solved for.
 *
 * Only a real deployment has a real widget and real origins to check against;
 * see the note at the check itself for what a dummy token reports instead.
 */
const enforceOrigin = process.env.NODE_ENV === "production";

/** Public half of the pair. Empty means the widget is not rendered. */
export const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

/**
 * Whether to enforce at all. Both halves are required: a site key without a
 * secret would render a challenge nobody checks, which is worse than none —
 * it looks like protection in a screenshot and is not.
 */
export const turnstileConfigured = Boolean(
  turnstileSiteKey && process.env.TURNSTILE_SECRET_KEY,
);

export type TurnstileResult =
  | { ok: true }
  /** `hard` distinguishes "Cloudflare said no" from "Cloudflare did not answer". */
  | { ok: false; hard: boolean; reason: string };

/**
 * Asks Cloudflare whether this token is good.
 *
 * The two failure modes are answered differently, and the distinction is the
 * whole design of this function. A verdict of *no* is definitive and refuses the
 * submission. A network failure, a timeout, a 500 from Cloudflare — those are
 * inconclusive, and refusing on them would hand any customer's enquiry to the
 * reliability of a third party we do not run. Those pass, loudly logged, and the
 * classifier still sees the submission.
 *
 * Tokens are single-use, so the caller must not spend one until every cheaper
 * check has passed — otherwise a visitor who mistypes their e-mail gets a
 * verification failure on their second attempt for no reason they can see.
 */
export async function verifyTurnstile(
  token: unknown,
  remoteIp: string | null,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true };

  if (typeof token !== "string" || !token || token.length > 2048) {
    return { ok: false, hard: true, reason: "missing token" };
  }

  const body = new URLSearchParams({ secret, response: token });
  // Ties the token to the address that solved the challenge, so one solved
  // elsewhere cannot be replayed from a farm of other machines. Optional, and the
  // contact form declines it on purpose — see the note at its call site: a
  // mismatch caused by an unexpected proxy hop would fail verification for every
  // visitor, which is a worse risk than the replay it prevents.
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const response = await fetch(SITEVERIFY, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      // Bounded, because this sits in the path of a visitor waiting on a button.
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { ok: false, hard: false, reason: `siteverify HTTP ${response.status}` };
    }

    const data = (await response.json()) as {
      success?: unknown;
      action?: unknown;
      hostname?: unknown;
      "error-codes"?: unknown;
    };

    if (data.success === true) {
      // Solved, genuinely — but not necessarily here, and not necessarily for
      // this form. Both are refused hard: unlike a network failure, these are
      // deterministic facts about our own configuration, so letting them pass
      // would be accepting a token we have positive reason to distrust. The log
      // line carries both values, because the only innocent explanation is a
      // misconfiguration and that is what makes it diagnosable.
      //
      // Production only, and not as a convenience. Cloudflare's published testing
      // sitekeys — the ones development uses, because the real widget's hostnames
      // are the live domains — answer with `hostname: "example.com"` and no
      // `action` field at all. Enforced everywhere, these two checks would reject
      // every submission on a developer's machine while proving nothing: there is
      // no real widget behind a dummy token and no real site behind it either, so
      // neither claim is meaningful until both are real.
      if (!enforceOrigin) return { ok: true };

      if (data.action !== TURNSTILE_ACTION) {
        return {
          ok: false,
          hard: true,
          reason: `action ${JSON.stringify(data.action)}, expected ${TURNSTILE_ACTION}`,
        };
      }

      if (typeof data.hostname !== "string" || !expectedHostnames.has(data.hostname)) {
        return {
          ok: false,
          hard: true,
          reason: `hostname ${JSON.stringify(data.hostname)}, expected one of ${[...expectedHostnames].join(", ")}`,
        };
      }

      return { ok: true };
    }

    const codes = Array.isArray(data["error-codes"])
      ? data["error-codes"].join(",")
      : "unknown";

    // A broken or missing secret is our misconfiguration, not the visitor's
    // fault, so it must not cost them their enquiry — it is treated as
    // inconclusive and shouted about in the log instead.
    const ours = codes.includes("invalid-input-secret") || codes.includes("missing-input-secret");
    return { ok: false, hard: !ours, reason: codes };
  } catch (error) {
    return {
      ok: false,
      hard: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}
