import "server-only";

import { defaultLocale, isLocale, locales, type Locale } from "@/lib/i18n";
import { adminClientConfigured, createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Outgoing mail configuration, stored in Supabase so the editors can change it
 * without a deployment.
 *
 * One row per language: two companies stand behind this site and each wants the
 * enquiries from its own market on its own server. A language without a row
 * falls back to the primary one — an unconfigured market still gets its
 * enquiries delivered to somebody who can forward them, which beats losing a
 * customer's message.
 *
 * The password never leaves the server: {@link loadSmtpSettings} is used by the
 * mailer, while the admin form receives {@link SmtpSettingsView}, which reports
 * only *whether* a password is stored.
 */
export type SmtpSettings = {
  locale: Locale;
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  recipients: string;
  /** This market's privacy notice, linked from the form's consent checkbox. */
  privacyUrl: string;
  updatedAt: string | null;
  updatedBy: string | null;
};

/** What the browser is allowed to see: everything except the password itself. */
export type SmtpSettingsView = Omit<SmtpSettings, "password"> & {
  hasPassword: boolean;
  /**
   * True when this language has no configuration of its own and the primary
   * one is what would actually send. The admin says so rather than showing an
   * empty form that looks broken.
   */
  inherited: boolean;
};

export type SmtpSettingsInput = Omit<
  SmtpSettings,
  "locale" | "password" | "updatedAt" | "updatedBy"
> & {
  /** Empty means "keep the stored password". */
  password: string;
};

const TABLE = "smtp_settings";

/**
 * Every column, rather than a list of them.
 *
 * Migrations here are applied by hand while a push deploys on its own, so this
 * code can reach production before the `locale` column exists — and PostgREST
 * rejects a whole query for one unknown column, which would stop the contact
 * form from sending at all. With `*` the column simply arrives undefined, and
 * the row is read as the primary market's, which is exactly what migration 0006
 * is about to make it.
 */
const SELECT = "*";

function empty(locale: Locale): SmtpSettings {
  return {
    locale,
    enabled: false,
    host: "",
    port: 587,
    secure: false,
    username: "",
    password: "",
    fromName: "",
    fromEmail: "",
    replyTo: "",
    recipients: "",
    privacyUrl: "",
    updatedAt: null,
    updatedBy: null,
  };
}

type Row = {
  /** Absent until migration 0006 has run. */
  locale?: string;
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  from_name: string;
  from_email: string;
  reply_to: string;
  recipients: string;
  /** Absent until migration 0008 has run. */
  privacy_url?: string | null;
  updated_at: string | null;
  updated_by: string | null;
};

function fromRow(row: Row, locale: Locale): SmtpSettings {
  return {
    locale,
    enabled: row.enabled,
    host: row.host,
    port: row.port,
    secure: row.secure,
    username: row.username,
    password: row.password,
    fromName: row.from_name,
    fromEmail: row.from_email,
    replyTo: row.reply_to,
    recipients: row.recipients,
    privacyUrl: row.privacy_url ?? "",
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

export type SettingsResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "unconfigured" | "missing-table" | "error"; message: string };

function failure(error: { code?: string; message: string }): SettingsResult<never> {
  // Before the migration runs, PostgREST answers PGRST205 ("Could not find the
  // table … in the schema cache"); Postgres itself would say 42P01. A missing
  // `locale` column means migration 0006 has not run yet.
  const missing =
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    /could not find the table|does not exist/i.test(error.message);

  return {
    ok: false,
    reason: missing ? "missing-table" : "error",
    message: missing
      ? "Tabuľka smtp_settings nemá očakávaný tvar — spustite migrácie."
      : error.message,
  };
}

/** Every configured language, keyed by locale. Unconfigured ones are absent. */
async function fetchAll(): Promise<SettingsResult<Partial<Record<Locale, SmtpSettings>>>> {
  if (!adminClientConfigured) {
    return {
      ok: false,
      reason: "unconfigured",
      message: "Chýba SUPABASE_SECRET_KEY v prostredí.",
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from(TABLE).select(SELECT).returns<Row[]>();

  if (error) return failure(error);

  const result: Partial<Record<Locale, SmtpSettings>> = {};
  for (const row of data ?? []) {
    // No column yet means the single pre-migration row, which is the primary
    // market's configuration. A column holding a language this build does not
    // know is a different matter and is skipped rather than absorbed.
    const locale =
      row.locale === undefined || row.locale === null
        ? defaultLocale
        : isLocale(row.locale)
          ? row.locale
          : null;

    if (locale) result[locale] = fromRow(row, locale);
  }
  return { ok: true, data: result };
}

/**
 * The configuration that would actually send for one language: its own row, or
 * the primary language's when it has none.
 */
export async function loadSmtpSettings(
  locale: Locale = defaultLocale,
): Promise<SettingsResult<SmtpSettings>> {
  const all = await fetchAll();
  if (!all.ok) return all;

  const own = all.data[locale];
  if (own) return { ok: true, data: own };

  const primary = all.data[defaultLocale];
  if (primary) {
    // Reported under the language that asked, so a log line names the market
    // rather than the fallback.
    return { ok: true, data: { ...primary, locale } };
  }

  return { ok: true, data: empty(locale) };
}

/** All four languages as the admin form needs them, password replaced by a flag. */
export async function loadSmtpSettingsViews(): Promise<
  SettingsResult<Record<Locale, SmtpSettingsView>>
> {
  const all = await fetchAll();
  if (!all.ok) return all;

  const primary = all.data[defaultLocale];

  const views = Object.fromEntries(
    locales.map((locale) => {
      const own = all.data[locale];
      const effective = own ?? (locale === defaultLocale ? undefined : primary);
      const source = own ?? effective ?? empty(locale);
      return [locale, { ...toView(source), locale, inherited: !own }];
    }),
  ) as Record<Locale, SmtpSettingsView>;

  return { ok: true, data: views };
}

/** The same settings with the password replaced by a flag. */
export function toView(settings: SmtpSettings): SmtpSettingsView {
  const { password, ...rest } = settings;
  return { ...rest, hasPassword: password.length > 0, inherited: false };
}

export async function saveSmtpSettings(
  locale: Locale,
  input: SmtpSettingsInput,
  editorEmail: string | null,
): Promise<SettingsResult<SmtpSettingsView>> {
  const all = await fetchAll();
  if (!all.ok) return all;

  const supabase = createSupabaseAdminClient();
  // An empty password field keeps whatever is stored for *this* language — never
  // the fallback's, or saving German would quietly copy the Slovak password into
  // a row that is supposed to have its own.
  const password = input.password.length > 0 ? input.password : (all.data[locale]?.password ?? "");

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(
      {
        locale,
        enabled: input.enabled,
        host: input.host.trim(),
        port: input.port,
        secure: input.secure,
        username: input.username.trim(),
        password,
        from_name: input.fromName.trim(),
        from_email: input.fromEmail.trim(),
        reply_to: input.replyTo.trim(),
        recipients: input.recipients.trim(),
        privacy_url: input.privacyUrl.trim(),
        updated_at: new Date().toISOString(),
        updated_by: editorEmail,
      },
      { onConflict: "locale" },
    )
    .select(SELECT)
    .single<Row>();

  if (error) return failure(error);
  return { ok: true, data: toView(fromRow(data, locale)) };
}
