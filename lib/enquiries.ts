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
};

export type NewEnquiry = {
  locale: Locale;
  name: string;
  company: string;
  email: string;
  phone: string;
  product: string;
  message: string;
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

/** How many enquiries are past their retention period. */
export async function countExpired(): Promise<number> {
  if (!adminClientConfigured) return 0;

  try {
    const supabase = createSupabaseAdminClient();
    const { count, error } = await supabase
      .from(TABLE)
      .select("id", { count: "exact", head: true })
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

/**
 * Deletes everything past the retention period. Returns how many went.
 *
 * Never throws: this runs alongside storing a new enquiry, and a failed sweep
 * must not cost the customer their message.
 */
export async function purgeExpiredEnquiries(): Promise<number> {
  if (!adminClientConfigured) return 0;

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .lt("created_at", retentionCutoff().toISOString())
      .select("id");

    if (error) {
      console.warn(`expired enquiries not purged: ${error.message}`);
      return 0;
    }
    return (data ?? []).length;
  } catch (error) {
    console.warn(
      `expired enquiries not purged: ${error instanceof Error ? error.message : error}`,
    );
    return 0;
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

/** Newest first. Read uncached — the admin must see the current state. */
export async function loadEnquiries(limit = 200): Promise<Enquiry[]> {
  if (!adminClientConfigured) return [];

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
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
