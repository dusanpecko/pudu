import "server-only";

import nodemailer from "nodemailer";

import { defaultLocale, type Locale } from "@/lib/i18n";
import { loadSmtpSettings, type SmtpSettings } from "@/lib/smtp-settings";

export type SendResult = { ok: true } | { ok: false; message: string };

/** Splits the stored recipient list into addresses. */
export function recipientList(settings: SmtpSettings): string[] {
  return settings.recipients
    .split(/[,;]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function missingFields(settings: SmtpSettings): string[] {
  const missing: string[] = [];
  if (!settings.host) missing.push("server");
  if (!settings.port) missing.push("port");
  if (!settings.fromEmail) missing.push("adresa odosielateľa");
  return missing;
}

function transportFor(settings: SmtpSettings) {
  return nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    // Implicit TLS on 465; STARTTLS otherwise.
    secure: settings.secure,
    auth: settings.username
      ? { user: settings.username, pass: settings.password }
      : undefined,
  });
}

/**
 * The address always comes from the settings — the mail server authenticates it,
 * so it is not ours to choose. Only the display name beside it can vary, and a
 * caller that knows something more useful than the configured name says so.
 */
function sender(settings: SmtpSettings, fromName?: string): string {
  // Quotes and backslashes are what a display name is escaped with, and a line
  // break is how a header is broken out of. Nodemailer re-encodes the name too,
  // so this is belt and braces — cheap, and it keeps the value readable rather
  // than escaped. Whitespace is collapsed so removing a character does not leave
  // a gap behind.
  const name = (fromName || settings.fromName)
    .replace(/["\\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return name ? `${name} <${settings.fromEmail}>` : settings.fromEmail;
}

type Message = {
  to: string[];
  subject: string;
  text: string;
  replyTo?: string;
  /**
   * Display name to show instead of the configured one. Falls back to the
   * settings when empty, so a caller may pass a value it did not manage to
   * resolve without having to decide what to do about it.
   */
  fromName?: string;
};

/**
 * Sends a message with the configuration stored for one language, falling back to
 * the primary market's when that language has none.
 *
 * Reports failures instead of throwing, so a broken mail server never takes a
 * page down with it.
 */
export async function sendMail(
  message: Message,
  locale: Locale = defaultLocale,
): Promise<SendResult> {
  const settings = await loadSmtpSettings(locale);
  if (!settings.ok) return { ok: false, message: settings.message };
  if (!settings.data.enabled) {
    return { ok: false, message: "Odosielanie e-mailov je vypnuté v nastaveniach." };
  }

  const missing = missingFields(settings.data);
  if (missing.length > 0) {
    return { ok: false, message: `Chýba: ${missing.join(", ")}.` };
  }
  if (message.to.length === 0) {
    return { ok: false, message: "Nie je nastavený žiadny príjemca." };
  }

  try {
    await transportFor(settings.data).sendMail({
      from: sender(settings.data, message.fromName),
      to: message.to,
      replyTo: message.replyTo || settings.data.replyTo || undefined,
      subject: message.subject,
      text: message.text,
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Neznáma chyba pri odosielaní.",
    };
  }
}

/**
 * Verifies one language's configuration by sending to a single address. Used by
 * the admin form, so a wrong password is discovered on the spot rather than by a
 * visitor whose enquiry silently vanishes.
 */
export async function sendTestMail(to: string, locale: Locale): Promise<SendResult> {
  return sendMail(
    {
      to: [to],
      subject: `PUDU — testovací e-mail (${locale.toUpperCase()})`,
      text:
        "Toto je testovací e-mail z administrácie webu PUDU Industrial.\n" +
        `Odoslaný nastavením pre jazyk ${locale.toUpperCase()}.\n` +
        "Ak ste ho dostali, nastavenie SMTP funguje.",
    },
    locale,
  );
}
