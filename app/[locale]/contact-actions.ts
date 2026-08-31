"use server";

import { headers } from "next/headers";

import { products } from "@/data/products";
import { loadCompanyDetails } from "@/lib/company";
import { createEnquiry, markDelivery, spamSignatureSeen } from "@/lib/enquiries";
import { verifyFormToken } from "@/lib/form-token";
import { isLocale, localeNames, type Locale } from "@/lib/i18n";
import { recipientList, sendMail } from "@/lib/mailer";
import { allowEnquiry, visitorToken } from "@/lib/rate-limit";
import { siteHostnames } from "@/lib/site";
import { loadSmtpSettings } from "@/lib/smtp-settings";
import { classifyEnquiry, spamReason } from "@/lib/spam";
import { getProductTexts, getTranslations } from "@/lib/translations";
import {
  TURNSTILE_FIELD,
  turnstileConfigured,
  verifyTurnstile,
} from "@/lib/turnstile";

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
 *
 * ## What this endpoint was being used for
 *
 * Not, as it appeared, to fill an inbox. A distributed bot submitted an OZON
 * prize scam a minute for two days, putting a *stranger's* address in the e-mail
 * field each time — 627 different ones — and the acknowledgement below dutifully
 * forwarded the scam text and its link to every one of them, over the client's own
 * company mailbox and under the client's own domain. The inbox noise was the side
 * effect. The form was a relay, and the asset being spent was the domain's
 * standing with Gmail.
 *
 * That is why the order of the checks below is the substance of this file and not
 * an implementation detail. Reading downwards:
 *
 *   1. the honeypot, and the field validation — free, and no side effects;
 *   2. the form token, which dates the visitor's arrival (lib/form-token.ts);
 *   3. the classifier, which is pure regex and therefore *first* among the real
 *      defences (lib/spam.ts). A submission it rejects is stored, flagged, and
 *      mailed nowhere — which is what closes the relay;
 *   4. Turnstile, which asks whether a browser did real work (lib/turnstile.ts);
 *   5. the rate limit, last, because by now we know which budget to charge.
 *
 * The two cheap steps come before the two expensive ones for the usual reason.
 * Steps 3 and 4 come before step 5 for a much less obvious one: whatever they
 * reject must not consume the hourly allowance that real customers share. Getting
 * that ordering wrong is precisely how the previous version of this file, with a
 * rate limit that worked exactly as designed, spent two days answering customers
 * in Žilina with "too many attempts, try later".
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
  // What a bot is told, whatever the reason. Indistinguishable from a delivered
  // enquiry on purpose: a rejection that announces itself is a rejection somebody
  // tunes against.
  const silent = { status: "sent" as const, message: t.contact.success };

  // Hidden field, off-screen and unlabelled: a person never fills it, a naive
  // bot fills everything it finds. Answered as success, so the bot has nothing
  // to learn from the difference and stops rather than retrying.
  if (formData.get("website")) return silent;

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

  const company = field(formData, "company");
  const phone = field(formData, "phone");
  const productSlug = field(formData, "product");

  // How long this visitor had the form open, if they had it open at all.
  const token = verifyFormToken(formData.get("formToken"));

  const requestHeaders = await headers();

  /**
   * Whether the request announced itself as coming from one of our own pages.
   *
   * A browser attaches `Origin` to every POST, and Next.js rejects a *mismatched*
   * one as CSRF before this code runs — so what reaches here is either ours or
   * missing entirely, and missing means no browser was involved. The host set is
   * checked anyway rather than trusting the framework's check by implication:
   * `serverActions.allowedOrigins` could one day widen it, and this is cheap.
   *
   * Note for local work: `localhost` is genuinely not one of this site's hosts,
   * so a submission from `next dev` scores the three points too. Left truthful
   * rather than special-cased — a signal that means something different in
   * development is worse than one that costs a clean local test three points it
   * can afford. The reason appears in the log line, so it is never a mystery.
   */
  const origin = requestHeaders.get("origin");
  const originOk = (() => {
    if (!origin) return false;
    try {
      return siteHostnames.has(new URL(origin).hostname);
    } catch {
      return false;
    }
  })();

  const verdict = classifyEnquiry({
    name,
    company,
    email,
    phone,
    message,
    tokenValid: token.valid,
    fillMs: token.fillMs,
    originOk,
  });

  const forwarded = requestHeaders.get("x-forwarded-for");
  const visitor = visitorToken(forwarded);

  if (verdict.spam) {
    // Charged to the spam budget, which is a ceiling on storage and nothing more:
    // nothing is sent for these rows, so there is no mail account to protect
    // here. It bounds what a flood can write; the deduplication below decides
    // what is worth writing at all.
    const reason = spamReason(verdict);
    const room = await allowEnquiry(visitor, locale, "spam");

    // One row per signature per hour. The rows exist so a wrong verdict can be
    // found, and the ninetieth identical copy of a verdict makes it no easier to
    // find than the first — while a flood of them buries the enquiries somebody
    // opened the screen to read. See spamSignatureSeen for why this is keyed on
    // the reason and not on a lower cap.
    const stored = room.allowed && !(await spamSignatureSeen(reason));
    if (stored) {
      await createEnquiry({
        locale,
        name,
        company,
        email,
        phone,
        product: productSlug,
        message,
        spam: true,
        spamReason: reason,
      });
    }

    // Logged at warn with the score, because this is the number that says whether
    // the classifier is earning its place — and the one to look at first if a
    // customer ever reports an enquiry that vanished. Logged for every attempt,
    // stored or not, so the log stays the complete record of the rate even as the
    // table keeps only a sample.
    console.warn(`enquiry blocked (${locale}, ${reason}, stored=${stored})`);
    return silent;
  }

  // Asked before the rate limit, so that a submission failing the challenge never
  // spends any of the hourly allowance real customers share. Asked after
  // everything free, because a Turnstile token is single-use and a visitor who
  // mistyped their address should not be told their verification failed on the
  // second attempt.
  //
  // The visitor's address is deliberately *not* sent along. Cloudflare would then
  // require it to match the one that solved the challenge, and a proxy hop that
  // rewrites `x-forwarded-for` in a way we did not anticipate would fail
  // verification for every real visitor at once. Tokens are single-use and expire
  // in minutes, which bounds replay well enough to not be worth that risk.
  const challenge = await verifyTurnstile(formData.get(TURNSTILE_FIELD), null);
  if (!challenge.ok) {
    if (challenge.hard) {
      console.warn(`enquiry challenge failed (${locale}, ${challenge.reason})`);
      return { status: "error", message: t.contact.errors.verification };
    }
    // Inconclusive rather than negative — Cloudflare unreachable, or our own key
    // misconfigured. Shouted about here and allowed through: see the note in
    // lib/turnstile.ts on why a third party's downtime must not cost a customer
    // their enquiry.
    console.error(`enquiry challenge inconclusive (${locale}, ${challenge.reason})`);
  }

  // Whether we have a positive reason to believe a person sent this. It governs
  // the acknowledgement further down, and nothing else.
  const trusted = (turnstileConfigured && challenge.ok) || token.valid;

  // Checked after validation, so a malformed submission does not consume a
  // visitor's allowance — but before the mail server is contacted, which is the
  // resource being protected.
  const allowance = await allowEnquiry(visitor, locale, "clean");
  if (!allowance.allowed) {
    console.warn(`enquiry rate limited (${locale}, ${allowance.reason})`);
    // Said plainly: a real visitor who submitted twice deserves to know it is a
    // timing problem, not a mistake in their form.
    return { status: "error", message: t.contact.errors.tooMany };
  }

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
    spam: false,
    spamReason: null,
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

  // The name shown beside the sending address — on the notification, where it
  // sorts the enquiry at a glance, and on the customer's copy, where it is the
  // first thing they see.
  //
  // It is derived rather than configured. The product the visitor chose is the
  // most specific true thing about this enquiry, and the company that handles
  // their market is the right answer when they chose none: the form offers a
  // general enquiry as well. Both are data somebody already keeps current for
  // other reasons — the footer names the company, the form names the products —
  // whereas the sender name in the mail settings is one more field to remember,
  // and a stale one goes out to customers unnoticed.
  const ourCompany = await loadCompanyDetails(locale);
  const senderName = productName || ourCompany.companyName;

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
      fromName: senderName,
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

  /**
   * The acknowledgement, and the one piece of mail this site sends to an address
   * nobody has verified.
   *
   * Which makes it the relay, and why it is now conditional. The notification
   * above goes to a fixed recipient from the settings and can be sent freely; this
   * one goes wherever the form was told to send it, carrying whatever the form was
   * given to carry. Sending it to an unverified address on nothing but a
   * well-formed submission is what let a scam reach six hundred strangers under
   * the client's domain.
   *
   * `trusted` is a low bar deliberately — a solved challenge, or merely a token
   * proving the form was actually opened. A real customer clears it without
   * noticing. What it excludes is the case that matters: a request that arrived
   * from nowhere, addressed to somebody who never asked us for anything.
   *
   * Its failure is recorded rather than shown, as before: the enquiry did reach
   * the company, so telling the visitor it failed would be a lie.
   */
  let copySent = false;
  if (trusted) {
    const copy = await sendMail(
      {
        to: [email],
        subject: oneLine(
          senderName ? `${t.contact.copySubject} — ${senderName}` : t.contact.copySubject,
        ),
        text: [t.contact.copyIntro, "", ...lines].join("\n"),
        fromName: senderName,
      },
      locale,
    );
    copySent = copy.ok;
    if (!copy.ok) {
      console.warn(`enquiry copy not sent (${locale}): ${copy.message}`);
    }
  } else {
    // Worth a line, because a run of these means the token endpoint is failing
    // for real visitors and every one of them is missing their receipt.
    console.warn(`enquiry copy withheld (${locale}): submission not verified`);
  }

  if (stored.ok) {
    await markDelivery(stored.data.id, {
      mailSent: true,
      mailError: null,
      copySent,
    });
  }

  return { status: "sent", message: t.contact.success };
}
