import { purgeExpiredEnquiries, retentionLabel } from "@/lib/enquiries";

/**
 * Deletes the enquiries that are past their retention period.
 *
 * The administration and the form both sweep opportunistically, but neither is a
 * guarantee: a quiet form and an unopened admin screen would let expired data sit
 * indefinitely. A retention period stated in a privacy notice is a promise, so
 * something has to run whether or not anybody visits — that is what this is for.
 * The schedule lives in vercel.json.
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET` when that variable is set.
 * Verifying it matters even though the endpoint only deletes what is already due:
 * an unauthenticated route that mutates data is worth nobody's time to reason
 * about later. Without the variable configured the route refuses outright rather
 * than running open — failing closed is right here, because the cost of not
 * deleting for a day is far below the cost of a public write endpoint.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("purge-enquiries: CRON_SECRET is not set, refusing to run");
    return new Response("Not configured", { status: 503 });
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const removed = await purgeExpiredEnquiries();
  // Logged rather than silent: on the day this finally deletes something, the
  // number is the only record that it did.
  console.log(`purge-enquiries: removed ${removed} older than ${retentionLabel()}`);

  return Response.json({ removed, retention: retentionLabel() });
}
