import { issueFormToken } from "@/lib/form-token";

/**
 * Mints the signed timestamp the contact form submits alongside the enquiry.
 *
 * A POST rather than a GET, and not for the usual REST reasons: a GET is
 * cacheable, and a cached response here would hand every visitor the same
 * timestamp — which is precisely the failure the token exists to avoid, since the
 * page it belongs to is prerendered for exactly that reason. A POST cannot be
 * served from a CDN by accident.
 *
 * Deliberately not rate limited. Issuing a token is one HMAC and no storage, and
 * holding one is worth two points off a spam score — there is nothing here worth
 * a bot's time and nothing worth ours protecting. See lib/form-token.ts.
 */
export async function POST() {
  return Response.json(
    { token: issueFormToken() },
    { headers: { "cache-control": "no-store" } },
  );
}
