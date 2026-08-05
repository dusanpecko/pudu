import "server-only";

import { adminClientConfigured, createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Outgoing mail configuration, stored in Supabase so the editors can change it
 * without a deployment.
 *
 * The password never leaves the server: {@link loadSmtpSettings} is used by the
 * mailer, while the admin form receives {@link SmtpSettingsView}, which reports
 * only *whether* a password is stored.
 */
export type SmtpSettings = {
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
  updatedAt: string | null;
  updatedBy: string | null;
};

/** What the browser is allowed to see: everything except the password itself. */
export type SmtpSettingsView = Omit<SmtpSettings, "password"> & {
  hasPassword: boolean;
};

export type SmtpSettingsInput = Omit<
  SmtpSettings,
  "password" | "updatedAt" | "updatedBy"
> & {
  /** Empty means "keep the stored password". */
  password: string;
};

const TABLE = "smtp_settings";

const EMPTY: SmtpSettings = {
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
  updatedAt: null,
  updatedBy: null,
};

type Row = {
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
  updated_at: string | null;
  updated_by: string | null;
};

function fromRow(row: Row): SmtpSettings {
  return {
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
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

export type SettingsResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "unconfigured" | "missing-table" | "error"; message: string };

export async function loadSmtpSettings(): Promise<SettingsResult<SmtpSettings>> {
  if (!adminClientConfigured) {
    return {
      ok: false,
      reason: "unconfigured",
      message: "Chýba SUPABASE_SECRET_KEY v prostredí.",
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select(
      "enabled, host, port, secure, username, password, from_name, from_email, reply_to, recipients, updated_at, updated_by",
    )
    .limit(1)
    .maybeSingle<Row>();

  if (error) {
    // Before the migration runs, PostgREST answers PGRST205 ("Could not find the
    // table … in the schema cache"); Postgres itself would say 42P01.
    const missing =
      error.code === "PGRST205" ||
      error.code === "42P01" ||
      /could not find the table|does not exist/i.test(error.message);
    return {
      ok: false,
      reason: missing ? "missing-table" : "error",
      message: missing
        ? "Tabuľka smtp_settings neexistuje — spustite migráciu."
        : error.message,
    };
  }

  return { ok: true, data: data ? fromRow(data) : EMPTY };
}

/** The same settings with the password replaced by a flag. */
export function toView(settings: SmtpSettings): SmtpSettingsView {
  const { password, ...rest } = settings;
  return { ...rest, hasPassword: password.length > 0 };
}

export async function saveSmtpSettings(
  input: SmtpSettingsInput,
  editorEmail: string | null,
): Promise<SettingsResult<SmtpSettingsView>> {
  const current = await loadSmtpSettings();
  if (!current.ok) return current;

  const supabase = createSupabaseAdminClient();
  const password = input.password.length > 0 ? input.password : current.data.password;

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(
      {
        singleton: true,
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
        updated_at: new Date().toISOString(),
        updated_by: editorEmail,
      },
      { onConflict: "singleton" },
    )
    .select(
      "enabled, host, port, secure, username, password, from_name, from_email, reply_to, recipients, updated_at, updated_by",
    )
    .single<Row>();

  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true, data: toView(fromRow(data)) };
}
