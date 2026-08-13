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

function sender(settings: SmtpSettings): string {
  return settings.fromName
    ? `${settings.fromName} <${settings.fromEmail}>`
    : settings.fromEmail;
}

type Message = {
  to: string[];
  subject: string;
  text: string;
  replyTo?: string;
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
      from: sender(settings.data),
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
