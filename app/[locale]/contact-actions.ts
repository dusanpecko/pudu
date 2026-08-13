"use server";

import { headers } from "next/headers";

import { products } from "@/data/products";
import { createEnquiry, markDelivery } from "@/lib/enquiries";
import { isLocale, localeNames, type Locale } from "@/lib/i18n";
import { recipientList, sendMail } from "@/lib/mailer";
import { allowEnquiry, visitorToken } from "@/lib/rate-limit";
import { loadSmtpSettings } from "@/lib/smtp-settings";
import { getProductTexts, getTranslations } from "@/lib/translations";

/**
 * Delivers an enquiry from the contact form.
 *
 * This is the one server action on the public site, so it is also the one
 * unauthenticated endpoint that can send mail. Everything below treats the input
 * as hostile: fields are length-capped before they reach a mail body, a honeypot
 * catches the bots that fill every input they find, and a failure never reports
 * why in the visitor's language — the reason goes to the server log, because
 * "authentication failed" would tell an abuser what to try next.
 *
 * Which mailbox it reaches depends on the language: two companies stand behind
 * this site and each takes the enquiries from its own market.
 *
 * The enquiry is written to the database *before* the mail is attempted. Mail is
 * the least reliable link here — a changed password or a provider block would
 * otherwise lose a customer's message outright — so delivery is recorded as an
 * outcome rather than assumed.
 */

export type EnquiryState = {
  status: "idle" | "sent" | "error";
  /** Already translated; the form renders it as it is. */
  message: string;
};

/** Long enough for a real enquiry, short enough not to be a payload. */
const LIMITS = {
  name: 120,
  company: 160,
  email: 200,
  phone: 60,
  product: 80,
  message: 4000,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function field(data: FormData, name: keyof typeof LIMITS): string {
  const value = data.get(name);
  return (typeof value === "string" ? value : "").trim().slice(0, LIMITS[name]);
}

/** A single line, so a header cannot be injected through the subject. */
function oneLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export async function sendEnquiry(
  _previous: EnquiryState,
  formData: FormData,
): Promise<EnquiryState> {
  const rawLocale = formData.get("locale");
  const locale: Locale =
    typeof rawLocale === "string" && isLocale(rawLocale) ? rawLocale : "sk";

  const t = await getTranslations(locale);
  const failed = { status: "error" as const, message: t.contact.errors.summary };

  // Hidden field, off-screen and unlabelled: a person never fills it, a naive
  // bot fills everything it finds. Answered as success, so the bot has nothing
  // to learn from the difference and stops rather than retrying.
  if (formData.get("website")) {
    return { status: "sent", message: t.contact.success };
  }

  const name = field(formData, "name");
  const email = field(formData, "email");
  const message = field(formData, "message");

  // The browser validates too, for instant feedback; this is the check that
  // counts, since a request need not come from the form at all.
  if (!name || !email || !message || !EMAIL_PATTERN.test(email)) return failed;

  // Required, and enforced here rather than only in the browser: consent is the
  // basis for storing the personal data below, so a submission without it is
  // refused outright.
  if (!formData.get("consent")) {
    return { status: "error", message: t.contact.errors.consent };
  }

  // Checked after validation, so a malformed submission does not consume a
  // visitor's allowance — but before the mail server is contacted, which is the
  // resource being protected.
  const forwarded = (await headers()).get("x-forwarded-for");
  const verdict = await allowEnquiry(visitorToken(forwarded), locale);
  if (!verdict.allowed) {
    console.warn(`enquiry rate limited (${locale}, ${verdict.reason})`);
    // Said plainly: a real visitor who submitted twice deserves to know it is a
    // timing problem, not a mistake in their form.
    return { status: "error", message: t.contact.errors.tooMany };
  }

  const company = field(formData, "company");
  const phone = field(formData, "phone");
  const productSlug = field(formData, "product");

  // Written down first. Everything after this can fail without the enquiry
  // being lost, which is the whole point of the order.
  const stored = await createEnquiry({
    locale,
    name,
    company,
    email,
    phone,
    product: productSlug,
    message,
  });
  if (!stored.ok) {
    // Storage failing is not a reason to refuse the customer: the mail may still
    // get through, which is how this worked before the table existed.
    console.error(`enquiry not stored (${locale}): ${stored.message}`);
  }

  const settings = await loadSmtpSettings(locale);
  if (!settings.ok) {
    console.error(`enquiry not sent (${locale}): ${settings.message}`);
    return failed;
  }

  const recipients = recipientList(settings.data);
  if (recipients.length === 0) {
    console.error(`enquiry not sent (${locale}): no recipient configured`);
    return failed;
  }

  // Resolved to the name the visitor saw, rather than passing a slug on to
  // somebody who then has to look it up.
  const texts = await getProductTexts(locale);
  const productName = products.some((product) => product.slug === productSlug)
    ? texts[productSlug as (typeof products)[number]["slug"]].name
    : "";

  const lines = [
    `${t.contact.name}: ${name}`,
    company ? `${t.contact.company}: ${company}` : null,
    `${t.contact.email}: ${email}`,
    phone ? `${t.contact.phone}: ${phone}` : null,
    productName ? `${t.contact.product}: ${productName}` : null,
    `${t.contact.message}:`,
    message,
    "",
    `— ${localeNames[locale]} (${locale})`,
  ].filter((line): line is string => line !== null);

  const subject = oneLine(
    productName
      ? `${t.contact.submit}: ${productName} — ${name}`
      : `${t.contact.submit} — ${name}`,
  );

  const sent = await sendMail(
    {
      to: recipients,
      subject,
      text: lines.join("\n"),
      // So the recipient replies to the customer, not to the website.
      replyTo: email,
    },
    locale,
  );

  if (!sent.ok) {
    // The visitor is told it failed, never why: the reason can name the mail
    // host or the account.
    console.error(`enquiry not sent (${locale}): ${sent.message}`);
    if (stored.ok) {
      await markDelivery(stored.data.id, {
        mailSent: false,
        mailError: sent.message,
        copySent: false,
      });
    }
    return failed;
  }

  // The acknowledgement goes out after the notification, and its failure is
  // recorded rather than shown: the enquiry did reach the company, so telling the
  // visitor it failed would be a lie.
  const copy = await sendMail(
    {
      to: [email],
      subject: oneLine(`${t.contact.copySubject} — ${settings.data.fromName || "PUDU"}`),
      text: [t.contact.copyIntro, "", ...lines].join("\n"),
    },
    locale,
  );
  if (!copy.ok) {
    console.warn(`enquiry copy not sent (${locale}): ${copy.message}`);
  }

  if (stored.ok) {
    await markDelivery(stored.data.id, {
      mailSent: true,
      mailError: null,
      copySent: copy.ok,
    });
  }

  return { status: "sent", message: t.contact.success };
}
