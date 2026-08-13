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
 * Both are far above what a real visitor does and far below what would cost the
 * client their mail service.
 */
const PER_IP_LIMIT = 5;
const PER_IP_WINDOW = "10 minutes";

const GLOBAL_LIMIT = 60;
const GLOBAL_WINDOW = "1 hour";

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
 * outcome than the spam it would have stopped, and the two other defences (the
 * honeypot and the field caps) are unaffected either way.
 */
export async function allowEnquiry(
  token: string,
  locale: string,
): Promise<RateVerdict> {
  if (!adminClientConfigured) return { allowed: true };

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc("record_enquiry_attempt", {
      hash: token,
      market: locale,
      ip_limit: PER_IP_LIMIT,
      ip_window: PER_IP_WINDOW,
      global_limit: GLOBAL_LIMIT,
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
