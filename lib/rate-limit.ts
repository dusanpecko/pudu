import "server-only";

import { createHash } from "node:crypto";

import { adminClientConfigured, createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * How often the contact form may send.
 *
 * Two limits, because they stop different things. The per-address one stops a
 * single source hammering the form. The global one protects the sending account
 * even when the attempts come from many addresses, where a per-address limit
 * never fires — and that account is the client's own company mailbox, which a
 * provider can throttle or suspend for volume.
 *
 * ## What the numbers were, and why they moved
 *
 * They used to be five per address per ten minutes and sixty in total per hour.
 * A distributed bot then demonstrated the flaw in both at once: spread over
 * sixteen addresses it never troubled the per-address limit, while the global one
 * sat at its cap for two days — no longer a brake but a valve, admitting 1440
 * messages a day and leaving each hour's allowance already spent when a real
 * customer arrived. The limit was working. It was protecting the mail account by
 * spending the customers.
 *
 * What fixes that is not a smaller number but a separated one. Attempts are now
 * counted per {@link AttemptKind}, so traffic already judged to be spam is bounded
 * by its own budget and the customers' budget is theirs alone. Only then is it
 * safe for the clean limit to be small enough to mean something.
 */
const PER_IP_LIMIT = 4;
const PER_IP_WINDOW = "30 minutes";

/**
 * What the site will send in an hour.
 *
 * Twenty, for a business that receives a handful of enquiries a week. It is a
 * ceiling on the mail account's exposure, not a forecast — if it is ever reached
 * by genuine traffic, that is a good problem and a one-line change.
 */
const CLEAN_LIMIT = 20;

/**
 * How many blocked submissions are written down in an hour.
 *
 * Not a protection — nothing is sent for these — but a bound on how much storage
 * a flood can consume while remaining visible. Past it the submission is dropped
 * without a row, and the log line is the only trace.
 */
const SPAM_LIMIT = 200;

const GLOBAL_WINDOW = "1 hour";

/**
 * Which population an attempt belongs to.
 *
 * Decided by lib/spam.ts before the limiter is consulted, which is the ordering
 * that makes the separation work: classification is regex over a few hundred
 * characters, so it is cheap enough to happen first, and once it has happened the
 * limiter knows whose budget to charge.
 */
export type AttemptKind = "clean" | "spam";

const GLOBAL_LIMITS: Record<AttemptKind, number> = {
  clean: CLEAN_LIMIT,
  spam: SPAM_LIMIT,
};

/**
 * Salt for the address hash.
 *
 * Without one this offers nothing: an IPv4 address has four billion possible
 * values, so an unpeppered hash is reversed by trying all of them. A dedicated
 * variable is preferred; failing that the Supabase secret is *derived* from
 * rather than used directly, so the two purposes stay separated even though the
 * key material is shared.
 */
function pepper(): string {
  const dedicated = process.env.ENQUIRY_IP_PEPPER;
  if (dedicated) return dedicated;

  const secret = process.env.SUPABASE_SECRET_KEY ?? "";
  return createHash("sha256").update(`enquiry-ip-pepper:${secret}`).digest("hex");
}

/**
 * A stable token for one visitor, from which the address cannot be recovered.
 *
 * `x-forwarded-for` may carry a chain; the first entry is the client as the edge
 * saw it. Locally the header is absent and every request shares one bucket,
 * which is correct — there is one visitor.
 */
export function visitorToken(forwardedFor: string | null): string {
  const address = (forwardedFor ?? "").split(",")[0]?.trim() || "local";
  return createHash("sha256").update(`${pepper()}:${address}`).digest("hex");
}

export type RateVerdict =
  | { allowed: true }
  | { allowed: false; reason: "ip" | "global" };

/**
 * Records an attempt and says whether it may proceed.
 *
 * **Fails open.** If the ledger is unreachable — no secret key, migration not
 * run, database down — the enquiry is allowed through and the reason is logged.
 * Losing a customer's message because a rate-limit table is missing is a worse
 * outcome than the spam it would have stopped, and this is the only layer that
 * fails this way: the honeypot, the field caps, the classifier and the challenge
 * are all unaffected by the database being down, so failing open here degrades
 * the defence rather than removing it.
 */
export async function allowEnquiry(
  token: string,
  locale: string,
  kind: AttemptKind,
): Promise<RateVerdict> {
  if (!adminClientConfigured) return { allowed: true };

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc("record_enquiry_attempt", {
      hash: token,
      market: locale,
      attempt_kind: kind,
      ip_limit: PER_IP_LIMIT,
      ip_window: PER_IP_WINDOW,
      global_limit: GLOBAL_LIMITS[kind],
      global_window: GLOBAL_WINDOW,
    });

    if (error) {
      console.warn(`enquiry rate limit unavailable: ${error.message}`);
      return { allowed: true };
    }

    const verdict = data as { allowed?: unknown; reason?: unknown } | null;
    if (verdict?.allowed === false) {
      const reason = verdict.reason === "global" ? "global" : "ip";
      return { allowed: false, reason };
    }
    return { allowed: true };
  } catch (error) {
    console.warn(
      `enquiry rate limit unavailable: ${error instanceof Error ? error.message : error}`,
    );
    return { allowed: true };
  }
}
