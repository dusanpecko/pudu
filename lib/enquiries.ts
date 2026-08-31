import "server-only";

import { isLocale, type Locale } from "@/lib/i18n";
import { adminClientConfigured, createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * The enquiries the contact form collects.
 *
 * Written down before the mail is attempted, so a mail server that is down or
 * has had its password changed cannot lose a customer's message. `mailSent` then
 * makes that failure visible in the administration rather than only in a log
 * line nobody reads.
 *
 * This table holds personal data. Nothing here is cached and nothing reaches the
 * public site — the admin list is the only reader.
 *
 * Two kinds of deletion, for two different obligations. {@link deleteEnquiry}
 * answers a person who asks to be erased. {@link purgeExpiredEnquiries} enforces
 * the retention period, so the data does not simply accumulate for ever.
 *
 * Not everything stored here is an enquiry. A submission the classifier in
 * lib/spam.ts rejects is written down too, flagged and never mailed, so that a
 * wrong verdict is something an editor can find rather than something a customer
 * silently loses. Those rows are kept for a fortnight, not five years, and the
 * two reading functions are separate — see {@link loadEnquiries}.
 */

/**
 * How long an enquiry is kept.
 *
 * **This has to match what the privacy notice says.** Keeping data longer than
 * the notice promises is the breach; keeping it shorter throws away a lead the
 * sales side still expected.
 */
// Annotated as `number` rather than left as the literal 5, so the plural below
// stays a general rule instead of dead branches the compiler rejects.
export const RETENTION_YEARS: number = 5;

/** Months are what the arithmetic needs; years are what people say. */
const RETENTION_MONTHS = RETENTION_YEARS * 12;

/**
 * "5 rokov". Slovak counts in three forms, and a label reading "5 rok" in the
 * administration would look like a bug in the very screen that explains a legal
 * obligation.
 */
export function retentionLabel(): string {
  const unit =
    RETENTION_YEARS === 1 ? "rok" : RETENTION_YEARS < 5 ? "roky" : "rokov";
  return `${RETENTION_YEARS} ${unit}`;
}

/** Enquiries created before this moment are past their retention period. */
export function retentionCutoff(): Date {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - RETENTION_MONTHS);
  return cutoff;
}

/**
 * How long a blocked submission is kept.
 *
 * Days, not years, and for a different reason than the retention period above.
 * A flagged row exists so a misjudgement by lib/spam.ts can be spotted and
 * rescued; two weeks is longer than anyone takes to notice a missing enquiry, and
 * after that the row is neither useful nor ours to keep. The privacy notice
 * promises five years to *customers* — it does not oblige us to archive what a
 * bot typed into the form.
 */
export const SPAM_RETENTION_DAYS = 14;

/** Blocked submissions created before this moment are swept. */
export function spamCutoff(): Date {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - SPAM_RETENTION_DAYS);
  return cutoff;
}

export type Enquiry = {
  id: string;
  locale: Locale;
  name: string;
  company: string;
  email: string;
  phone: string;
  /** Product slug, or empty for a general enquiry. */
  product: string;
  message: string;
  consentAt: string;
  mailSent: boolean;
  mailError: string | null;
  copySent: boolean;
  handled: boolean;
  handledBy: string | null;
  handledAt: string | null;
  createdAt: string;
  /** Blocked by lib/spam.ts. Nothing was sent, for this row or about it. */
  spam: boolean;
  /** The score and signals behind the verdict, for arguing with it. */
  spamReason: string | null;
};

export type NewEnquiry = {
  locale: Locale;
  name: string;
  company: string;
  email: string;
  phone: string;
  product: string;
  message: string;
  /**
   * The classifier's verdict, decided before this is called. Required rather
   * than defaulted: a caller that forgets it would silently store a blocked
   * submission as a real enquiry and mail it onward, which is the one mistake
   * this whole mechanism exists to prevent.
   */
  spam: boolean;
  spamReason: string | null;
};

const TABLE = "enquiries";

type Row = {
  id: string;
  locale: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  product: string | null;
  message: string;
  consent_at: string;
  mail_sent: boolean | null;
  mail_error: string | null;
  copy_sent: boolean | null;
  handled: boolean | null;
  handled_by: string | null;
  handled_at: string | null;
  created_at: string;
  spam: boolean | null;
  spam_reason: string | null;
};

function fromRow(row: Row): Enquiry {
  return {
    id: row.id,
    // A row for a language this build no longer knows still has to be readable,
    // so it is shown under the primary market rather than dropped.
    locale: isLocale(row.locale) ? row.locale : "sk",
    name: row.name,
    company: row.company ?? "",
    email: row.email,
    phone: row.phone ?? "",
    product: row.product ?? "",
    message: row.message,
    consentAt: row.consent_at,
    mailSent: row.mail_sent ?? false,
    mailError: row.mail_error,
    copySent: row.copy_sent ?? false,
    handled: row.handled ?? false,
    handledBy: row.handled_by,
    handledAt: row.handled_at,
    createdAt: row.created_at,
    spam: row.spam ?? false,
    spamReason: row.spam_reason,
  };
}

export type EnquiryResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

/**
 * Records the enquiry and returns its id.
 *
 * The caller sends the mail afterwards and reports the outcome with
 * {@link markDelivery}, so the order is: write it down, then try to deliver.
 */
export async function createEnquiry(
  input: NewEnquiry,
): Promise<EnquiryResult<{ id: string }>> {
  if (!adminClientConfigured) return { ok: false, message: "Chýba SUPABASE_SECRET_KEY." };

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      locale: input.locale,
      name: input.name,
      company: input.company,
      email: input.email,
      phone: input.phone,
      product: input.product,
      message: input.message,
      spam: input.spam,
      spam_reason: input.spamReason,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) return { ok: false, message: error.message };

  // Swept here because this is a write path and the sweep is idempotent. It is
  // not the only trigger — the administration offers it as a button — because a
  // quiet form would otherwise let expired rows sit indefinitely.
  await purgeExpiredEnquiries();

  return { ok: true, data: { id: data.id } };
}

/**
 * How many real enquiries are past their retention period.
 *
 * Blocked submissions are excluded on purpose: they are swept on their own
 * fortnightly schedule, and counting them here would put a number next to a
 * label that says "older than five years" and mean something else entirely.
 */
export async function countExpired(): Promise<number> {
  if (!adminClientConfigured) return 0;

  try {
    const supabase = createSupabaseAdminClient();
    const { count, error } = await supabase
      .from(TABLE)
      .select("id", { count: "exact", head: true })
      .eq("spam", false)
      .lt("created_at", retentionCutoff().toISOString());

    if (error) {
      console.warn(`expired enquiries not counted: ${error.message}`);
      return 0;
    }
    return count ?? 0;
  } catch {
    return 0;
  }
}

export type PurgeCounts = {
  /** Real enquiries past the period the privacy notice states. */
  expired: number;
  /** Blocked submissions past their much shorter window. */
  spam: number;
};

/**
 * Deletes everything past its retention period. Returns how many of each went.
 *
 * Two sweeps rather than one, because the two populations are kept for
 * unrelated reasons and therefore for unrelated lengths of time: a customer's
 * enquiry is kept because the privacy notice promises it, a blocked submission
 * only long enough for a misjudgement to be noticed. One cutoff could not honour
 * both.
 *
 * Never throws: this runs alongside storing a new enquiry, and a failed sweep
 * must not cost the customer their message.
 */
export async function purgeExpiredEnquiries(): Promise<PurgeCounts> {
  const none: PurgeCounts = { expired: 0, spam: 0 };
  if (!adminClientConfigured) return none;

  try {
    const supabase = createSupabaseAdminClient();

    const expired = await supabase
      .from(TABLE)
      .delete()
      .eq("spam", false)
      .lt("created_at", retentionCutoff().toISOString())
      .select("id");

    const spam = await supabase
      .from(TABLE)
      .delete()
      .eq("spam", true)
      .lt("created_at", spamCutoff().toISOString())
      .select("id");

    // Reported separately: one sweep failing is no reason to hide what the other
    // managed, and the two errors have different causes worth reading apart.
    if (expired.error) {
      console.warn(`expired enquiries not purged: ${expired.error.message}`);
    }
    if (spam.error) {
      console.warn(`blocked submissions not purged: ${spam.error.message}`);
    }

    return {
      expired: (expired.data ?? []).length,
      spam: (spam.data ?? []).length,
    };
  } catch (error) {
    console.warn(
      `enquiries not purged: ${error instanceof Error ? error.message : error}`,
    );
    return none;
  }
}

/**
 * Deletes one enquiry outright.
 *
 * This is what answers a request for erasure, so it removes the row rather than
 * flagging it — a "deleted" marker would still be personal data.
 */
export async function deleteEnquiry(
  id: string,
): Promise<EnquiryResult<{ id: string }>> {
  if (!adminClientConfigured) return { ok: false, message: "Chýba SUPABASE_SECRET_KEY." };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);

  if (error) return { ok: false, message: error.message };
  return { ok: true, data: { id } };
}

/** Records what happened to the two messages. Never throws. */
export async function markDelivery(
  id: string,
  delivery: { mailSent: boolean; mailError?: string | null; copySent: boolean },
): Promise<void> {
  if (!adminClientConfigured) return;

  try {
    const supabase = createSupabaseAdminClient();
    await supabase
      .from(TABLE)
      .update({
        mail_sent: delivery.mailSent,
        // Truncated: a provider's failure can run to paragraphs, and the first
        // line is what identifies the problem.
        mail_error: delivery.mailError ? delivery.mailError.slice(0, 500) : null,
        copy_sent: delivery.copySent,
      })
      .eq("id", id);
  } catch (error) {
    // The enquiry is already stored; failing to annotate it is not worth
    // reporting to the visitor.
    console.warn(
      `enquiry delivery not recorded: ${error instanceof Error ? error.message : error}`,
    );
  }
}

/**
 * Newest first. Read uncached — the admin must see the current state.
 *
 * Blocked submissions are filtered out in the query rather than in the table
 * component, and that is the load-bearing part: a flood can outnumber the real
 * enquiries by two orders of magnitude, so a client-side filter over the newest
 * two hundred rows would show an empty list while four customers waited.
 */
export async function loadEnquiries(limit = 200): Promise<Enquiry[]> {
  return read(limit, false);
}

/**
 * The blocked submissions, for checking what the classifier has been doing.
 *
 * A shorter default than the real list: this is read to sample the verdicts and
 * spot a wrong one, not to work through.
 */
export async function loadSpamEnquiries(limit = 50): Promise<Enquiry[]> {
  return read(limit, true);
}

async function read(limit: number, spam: boolean): Promise<Enquiry[]> {
  if (!adminClientConfigured) return [];

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("spam", spam)
      .order("created_at", { ascending: false })
      .limit(limit)
      .returns<Row[]>();

    if (error) {
      console.warn(`enquiries unavailable: ${error.message}`);
      return [];
    }
    return (data ?? []).map(fromRow);
  } catch (error) {
    console.warn(
      `enquiries unavailable: ${error instanceof Error ? error.message : error}`,
    );
    return [];
  }
}

/**
 * How many submissions have been blocked in the last day.
 *
 * A day rather than a total, because the number is there to answer "is something
 * happening right now" — the question nobody thought to ask for two days while a
 * flood ran.
 */
export async function countRecentSpam(): Promise<number> {
  if (!adminClientConfigured) return 0;

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const supabase = createSupabaseAdminClient();
    const { count, error } = await supabase
      .from(TABLE)
      .select("id", { count: "exact", head: true })
      .eq("spam", true)
      .gt("created_at", since);

    if (error) {
      console.warn(`blocked submissions not counted: ${error.message}`);
      return 0;
    }
    return count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * How long one blocked signature stands for all the others like it.
 *
 * An hour, because the reason these rows exist is to make a wrong verdict
 * findable, and one example of a verdict makes it exactly as findable as nine
 * hundred. Measured on the flood this was written against: 81 rows in under two
 * hours, every one of them `foreign-script, link, shortener, no-token` — the same
 * sentence, eighty-one times.
 */
export const SPAM_SAMPLE_WINDOW_MINUTES = 60;

/**
 * Whether a blocked submission with this exact signature was already stored
 * recently.
 *
 * Deduplicating on the *reason* rather than on the content is what makes this
 * safe. A bot has one signature and leaves one row an hour. A misjudged real
 * enquiry has a different signature — a lone `foreign-script`, say, where the
 * flood carries four signals — so it is stored whatever the bot is doing.
 *
 * The alternative, a lower storage cap, was rejected for being the same bug this
 * whole file has been fighting in miniature: the bot would spend the allowance in
 * the first quarter of an hour and the one submission worth keeping would arrive
 * after it was gone.
 *
 * **Fails towards storing.** An unreachable database answers "not seen", so a
 * failure here costs a duplicate row rather than the record of a mistake.
 */
export async function spamSignatureSeen(reason: string): Promise<boolean> {
  if (!adminClientConfigured) return false;

  try {
    const since = new Date(
      Date.now() - SPAM_SAMPLE_WINDOW_MINUTES * 60 * 1000,
    ).toISOString();

    const supabase = createSupabaseAdminClient();
    const { count, error } = await supabase
      .from(TABLE)
      .select("id", { count: "exact", head: true })
      .eq("spam", true)
      .eq("spam_reason", reason)
      .gt("created_at", since);

    if (error) {
      console.warn(`spam signature not checked: ${error.message}`);
      return false;
    }
    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}

/**
 * How many blocked submissions are stored, all told.
 *
 * Separate from {@link countRecentSpam} because the two answer different
 * questions and one must not be used for the other: that one says whether a
 * flood is running now, this one is the number on the button that deletes them,
 * and a button that promises to delete fifty when three hundred are stored is a
 * button nobody can trust. The list is read with a limit; this count is not.
 */
export async function countSpam(): Promise<number> {
  if (!adminClientConfigured) return 0;

  try {
    const supabase = createSupabaseAdminClient();
    const { count, error } = await supabase
      .from(TABLE)
      .select("id", { count: "exact", head: true })
      .eq("spam", true);

    if (error) {
      console.warn(`blocked submissions not counted: ${error.message}`);
      return 0;
    }
    return count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Deletes every blocked submission, now rather than in a fortnight.
 *
 * These rows are kept only so a misjudgement by lib/spam.ts can be spotted and
 * rescued, and the retention sweep already removes them on its own. This exists
 * for the case the sweep is too slow to be useful: a flood that puts hundreds of
 * rows between an editor and the enquiries they are looking for.
 *
 * Counted before deleting rather than by asking the delete what it removed. The
 * `select("id")` that {@link purgeExpiredEnquiries} uses to count would, on the
 * population this is aimed at, drag every deleted id back over the wire for no
 * reason but to measure them.
 *
 * Real enquiries are untouched: the filter is the flag, not a date, so nothing
 * here can reach a row somebody is waiting on. Unlike the sweeps this one *does*
 * report failure — it answers a button somebody pressed, and a button that
 * silently does nothing is worse than one that says it could not.
 */
export async function deleteAllSpam(): Promise<EnquiryResult<{ removed: number }>> {
  if (!adminClientConfigured) return { ok: false, message: "Chýba SUPABASE_SECRET_KEY." };

  const removed = await countSpam();
  if (removed === 0) return { ok: true, data: { removed: 0 } };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from(TABLE).delete().eq("spam", true);

  if (error) return { ok: false, message: error.message };
  return { ok: true, data: { removed } };
}

/**
 * Marks an enquiry handled, or puts it back.
 *
 * Who and when are recorded together with the flag, because "handled" without a
 * name is an argument waiting to happen.
 */
export async function setHandled(
  id: string,
  handled: boolean,
  editorEmail: string | null,
): Promise<EnquiryResult<{ id: string }>> {
  if (!adminClientConfigured) return { ok: false, message: "Chýba SUPABASE_SECRET_KEY." };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from(TABLE)
    .update({
      handled,
      handled_by: handled ? editorEmail : null,
      handled_at: handled ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) return { ok: false, message: error.message };
  return { ok: true, data: { id } };
}
