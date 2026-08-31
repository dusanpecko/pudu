/**
 * Decides whether a contact-form submission is spam.
 *
 * Written after a flood that walked straight through the two defences that were
 * here before it. The honeypot missed it because the bot fills only the fields it
 * can see; the rate limit did fire, and that was the problem — pinned at the
 * global cap, it turned into a 60-an-hour valve that ran for two days and starved
 * real customers of the same allowance.
 *
 * What that wave *did* have was a signature. Every message carried a link, and
 * nearly every one was written in Cyrillic — an OZON prize scam aimed at Russian
 * readers, sent through the contact form of a Slovak robotics distributor. The
 * markets this site serves are SK, CZ, EN and DE. A script none of those four
 * languages is written in, arriving together with a link, is not a customer.
 *
 * ## Why a score rather than rules
 *
 * Every single signal here has an innocent explanation. A customer pastes a link
 * to their own site. A token fetch fails on a train. Somebody types fast. Any one
 * of them as a hard rule would silently drop real enquiries, which for a business
 * site is a worse failure than the spam it prevents — the sender gets a success
 * message and never learns their message went nowhere.
 *
 * So signals accumulate and only their sum decides. The weights are set so that
 * no single ordinary-looking signal reaches {@link THRESHOLD}, while the
 * combinations that have no innocent reading — a URL in the *name* field, a
 * mail-merge `[url=]` template — clear it on their own.
 *
 * ## Nothing here is deleted
 *
 * A verdict of spam means no mail is sent, which is what stops both the inbox
 * noise and the relay. The submission is still written down and flagged, so a
 * false positive is visible in the administration and can be rescued, and
 * {@link scoreOf} keeps its reasons for exactly that conversation.
 */

/** Everything the classifier looks at. All of it is visitor-supplied. */
export type SpamInput = {
  name: string;
  company: string;
  email: string;
  phone: string;
  message: string;
  /**
   * Whether the submission carried a valid, freshly-issued form token. Absent
   * means the request never rendered the form — or that the token fetch failed,
   * which is why this is a signal and not a gate.
   */
  tokenValid: boolean;
  /**
   * How long the visitor had the form open before submitting, in milliseconds,
   * or null when unknown. Taken from the signed token, so a bot cannot choose it.
   */
  fillMs: number | null;
  /**
   * Whether the request carried an `Origin` header naming one of this site's own
   * hosts.
   *
   * A browser sends `Origin` on every POST — it is not optional and not something
   * a privacy setting strips. Its absence therefore means the request did not come
   * from a form in a browser at all, which is as close to a direct statement of
   * "this is a script" as anything here gets.
   */
  originOk: boolean;
};

export type SpamVerdict = {
  spam: boolean;
  score: number;
  /** Which signals fired, in the order they are weighted. For the admin list. */
  reasons: string[];
};

/**
 * At or above this, the submission is treated as spam.
 *
 * Six, because it takes two independent signals to get there and no ordinary
 * enquiry produces two. The current wave scores 8.
 */
export const THRESHOLD = 6;

/**
 * Nobody fills this form in under a second and a half.
 *
 * Deliberately below what a human needs and above what browser autofill takes:
 * autofill still fires per-field events and a click, which lands around a second
 * on a slow machine. Set any tighter and a customer using a password manager
 * becomes a suspect.
 */
export const MIN_FILL_MS = 1500;

/** A link, in any of the shapes one arrives in. */
const LINK = /(https?:\/\/|www\.[a-z0-9-]+\.[a-z]{2,}|[a-z0-9-]+\.(?:ru|su|cn|xyz|top|click|loan|tk)\b)/i;

/** Mail-merge markup. A person writing prose never produces this. */
const LINK_MARKUP = /(\[url[=\]]|\[link[=\]]|<a\s+[^>]*href|\[\/url\]|\{link\})/i;

/**
 * Shorteners and redirectors, which exist in this context to hide a destination.
 * `share.google` is what the OZON wave used.
 */
const SHORTENER =
  /\b(bit\.ly|tinyurl\.com|goo\.gl|share\.google|t\.me|is\.gd|cutt\.ly|rb\.gy|shorturl\.at|clck\.ru|vk\.cc|surl\.li|tiny\.cc)\b/i;

/**
 * Scripts none of this site's four languages is written in.
 *
 * Slovak, Czech and German are Latin with diacritics, so accented characters are
 * not foreign here — only a different writing system is. Listed explicitly rather
 * than as "not Latin", because a `\P{Script=Latin}` test would fire on an em dash
 * or an emoji.
 */
const FOREIGN_SCRIPT =
  /[\p{Script=Cyrillic}\p{Script=Han}\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Thai}\p{Script=Hangul}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Devanagari}]/u;

/** Counts distinct-looking links, which is a different signal from having one. */
function linkCount(text: string): number {
  return (text.match(/https?:\/\/|www\./gi) ?? []).length;
}

/**
 * The weighted signals, in one table so the arithmetic is auditable.
 *
 * Read the weights against {@link THRESHOLD}: 2 is "worth noticing, innocent on
 * its own", 3 is "unusual", 6 is "there is no innocent reading of this".
 */
const SIGNALS: {
  key: string;
  weight: number;
  test: (input: SpamInput) => boolean;
}[] = [
  {
    // Decisive. These fields hold a person's name and their employer. A URL in
    // one is a bot filling every input with its payload, every time.
    key: "link-in-identity",
    weight: 6,
    test: ({ name, company, phone }) =>
      LINK.test(name) || LINK.test(company) || LINK.test(phone),
  },
  {
    // Decisive. The submission came out of a template engine.
    key: "link-markup",
    weight: 6,
    test: ({ message, name }) => LINK_MARKUP.test(message) || LINK_MARKUP.test(name),
  },
  {
    // The strongest honest signal available to this particular site, for the
    // reason given at the top: none of its four markets writes in these scripts.
    key: "foreign-script",
    weight: 4,
    test: ({ message, name, company }) =>
      FOREIGN_SCRIPT.test(message) ||
      FOREIGN_SCRIPT.test(name) ||
      FOREIGN_SCRIPT.test(company),
  },
  {
    // Submitted faster than a person can read the labels.
    key: "too-fast",
    weight: 3,
    test: ({ fillMs }) => fillMs !== null && fillMs < MIN_FILL_MS,
  },
  {
    // Weighted low on purpose: a customer linking their own company site is
    // ordinary, so this only matters next to something else.
    key: "link",
    weight: 2,
    test: ({ message }) => LINK.test(message),
  },
  {
    key: "many-links",
    weight: 2,
    test: ({ message }) => linkCount(message) >= 2,
  },
  {
    key: "shortener",
    weight: 2,
    test: ({ message }) => SHORTENER.test(message),
  },
  {
    // The request never went through the rendered form, or its token expired.
    // Two, not more: a failed fetch has to stay survivable for a real visitor.
    key: "no-token",
    weight: 2,
    test: ({ tokenValid }) => !tokenValid,
  },
  {
    // No `Origin` naming one of our hosts.
    //
    // The most specific signal here, and it was found by reading the logs rather
    // than by reasoning: Next.js warns about a Server Action request with no
    // `Origin` and lets it through, and every one of the flood's submissions
    // carried that warning while the one real submission in the same minute did
    // not. A mismatched `Origin` never reaches this code — the framework rejects
    // those as CSRF — so in practice the header is either ours or absent.
    //
    // Three rather than six despite that, for the same reason as `no-token`:
    // there is one path to a false positive here, an unforeseen proxy that
    // rewrites headers, and it would be silent. Three lets a clean submission
    // through alone and settles it in company.
    key: "no-origin",
    weight: 3,
    test: ({ originOk }) => !originOk,
  },
];

/** The score and its reasons, without the verdict. Useful for tuning. */
export function scoreOf(input: SpamInput): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  for (const signal of SIGNALS) {
    if (!signal.test(input)) continue;
    score += signal.weight;
    reasons.push(signal.key);
  }

  return { score, reasons };
}

/**
 * The verdict the contact action acts on.
 *
 * Spam means: no notification, no acknowledgement, nothing sent anywhere — and
 * the visitor is told it succeeded, so a bot learns nothing from the difference.
 */
export function classifyEnquiry(input: SpamInput): SpamVerdict {
  const { score, reasons } = scoreOf(input);
  return { spam: score >= THRESHOLD, score, reasons };
}

/**
 * A short, storable summary of why. Kept to one line and capped, because it goes
 * in a column somebody reads in a table.
 */
export function spamReason(verdict: SpamVerdict): string {
  return `${verdict.score}: ${verdict.reasons.join(", ")}`.slice(0, 200);
}
