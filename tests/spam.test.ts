import assert from "node:assert/strict";
import { test } from "node:test";

import { classifyEnquiry, MIN_FILL_MS, spamReason, THRESHOLD } from "../lib/spam.ts";

/**
 * The contact form's spam classifier.
 *
 * Imported whole rather than cut out of the file, because lib/spam.ts is
 * deliberately dependency-free — no `server-only`, no path aliases, nothing to
 * stub. That property is what these tests are protecting as much as the
 * arithmetic: a classifier that cannot be run in isolation is one whose weights
 * get tuned by guesswork.
 *
 * Two things are asserted throughout, and they pull in opposite directions:
 *
 *   * the wave that prompted this is caught — and it was measured, not imagined:
 *     the sample below is a real stored submission, and the live table held 643
 *     of them scoring exactly 8 against 2 genuine messages scoring 0;
 *   * no *single* ordinary-looking signal can block anything on its own, because
 *     the visitor is told their message was sent either way. A false positive is
 *     silent, which makes it the more expensive mistake.
 */

/** A real enquiry, of the kind this site exists to receive. */
const GENUINE = {
  name: "Peter Hraško",
  company: "Kysucká logistika s.r.o.",
  email: "hrasko@kysuckalogistika.sk",
  phone: "+421 905 123 456",
  message:
    "Dobrý deň, zaujíma nás nasadenie AMR do nášho skladu v Kysuckom Novom Meste. " +
    "Máme dve haly, prevoz paliet medzi nimi po vonkajšej rampe. Radi by sme ukážku.",
  tokenValid: true,
  fillMs: 45_000,
  originOk: true,
};

test("a genuine enquiry scores nothing at all", () => {
  const verdict = classifyEnquiry(GENUINE);
  assert.equal(verdict.spam, false);
  assert.equal(verdict.score, 0);
  assert.deepEqual(verdict.reasons, []);
});

test("the wave this was written for is caught", () => {
  // Verbatim from the stored rows, truncated. Cyrillic prose, one link, and that
  // link on a redirector: 4 + 2 + 2.
  const verdict = classifyEnquiry({
    ...GENUINE,
    name: "Ирина Соколова",
    company: "",
    email: "irina.sokolova.1987@gmail.com",
    message:
      "Компания OZON рада пригласить вас на нашу новую беспроигрышную-захватывающую " +
      "акцию. В которой вы можете выиграть гарантированные денежные призы до " +
      "1.000.000 рублей: https://share.google/0gTK1uQbWflbqoSmQ",
  });

  assert.equal(verdict.spam, true);
  assert.equal(verdict.score, 8);
  assert.deepEqual(verdict.reasons, ["foreign-script", "link", "shortener"]);
});

test("a customer linking their own site is not spam", () => {
  // The single most likely false positive, and the reason `link` is weighted 2.
  const verdict = classifyEnquiry({
    ...GENUINE,
    message: `${GENUINE.message} Naša stránka je https://kysuckalogistika.sk`,
  });

  assert.equal(verdict.spam, false);
  assert.deepEqual(verdict.reasons, ["link"]);
});

test("German and Czech diacritics are not a foreign script", () => {
  for (const message of [
    "Guten Tag, wir möchten die Möglichkeiten für autonome Fördertechnik prüfen — " +
      "größere Halle, zwei Ebenen. Können Sie eine Vorführung anbieten?",
    "Dobrý den, měli bychom zájem o představení robotů ve výrobním areálu v Přerově.",
  ]) {
    const verdict = classifyEnquiry({ ...GENUINE, message });
    assert.equal(verdict.spam, false, message.slice(0, 30));
    assert.equal(verdict.score, 0);
  }
});

test("foreign-script prose alone is let through", () => {
  // Four points, and deliberately below the line: a Chinese-speaking supplier
  // writing without a link is unusual for this site, not fraudulent.
  const verdict = classifyEnquiry({
    ...GENUINE,
    name: "李伟",
    message: "您好，我们想了解贵公司的自主移动机器人在欧洲的部署情况。",
  });

  assert.equal(verdict.spam, false);
  assert.equal(verdict.score, 4);
  assert.deepEqual(verdict.reasons, ["foreign-script"]);
});

test("a URL in the name field is decisive on its own", () => {
  const verdict = classifyEnquiry({ ...GENUINE, name: "check www.cheap-seo.top now" });

  assert.equal(verdict.spam, true);
  assert.ok(verdict.reasons.includes("link-in-identity"));
});

test("mail-merge markup is decisive on its own", () => {
  const verdict = classifyEnquiry({
    ...GENUINE,
    message: "Great site! [url=http://example.com]click here[/url]",
  });

  assert.equal(verdict.spam, true);
  assert.ok(verdict.reasons.includes("link-markup"));
});

test("a failed token fetch does not cost a visitor their enquiry", () => {
  // The guarantee lib/form-token.ts makes in prose, asserted in arithmetic: a
  // missing token is a signal, never a gate.
  const verdict = classifyEnquiry({ ...GENUINE, tokenValid: false, fillMs: null });

  assert.equal(verdict.spam, false);
  assert.deepEqual(verdict.reasons, ["no-token"]);
});

test("the two mechanical signals together still do not block", () => {
  // No token and submitted instantly — five points, one short. Somebody on a
  // blocked-JavaScript browser with a password manager looks exactly like this,
  // and they are not the problem this file was written for.
  const verdict = classifyEnquiry({
    ...GENUINE,
    tokenValid: false,
    fillMs: MIN_FILL_MS - 1,
  });

  assert.equal(verdict.score, 5);
  assert.equal(verdict.score < THRESHOLD, true);
  assert.equal(verdict.spam, false);
});

test("mechanics plus content does block", () => {
  // The same visitor, now with Cyrillic: nine. What the score is for.
  const verdict = classifyEnquiry({
    ...GENUINE,
    tokenValid: false,
    fillMs: MIN_FILL_MS - 1,
    message: "Здравствуйте, отличное предложение для вас.",
  });

  assert.equal(verdict.spam, true);
});

test("a duration at the threshold is not too fast", () => {
  // Boundary check, because MIN_FILL_MS is a `<` and somebody will one day make
  // it a `<=` and wonder why autofill users started disappearing.
  const verdict = classifyEnquiry({ ...GENUINE, fillMs: MIN_FILL_MS });
  assert.deepEqual(verdict.reasons, []);
});

test("an unknown duration is not held against anybody", () => {
  const verdict = classifyEnquiry({ ...GENUINE, fillMs: null });
  assert.deepEqual(verdict.reasons, []);
});

test("empty fields score nothing", () => {
  // The action validates before classifying, so this shape never reaches it in
  // practice — but a regex that matches emptiness would be a very quiet disaster.
  const verdict = classifyEnquiry({
    name: "",
    company: "",
    email: "",
    phone: "",
    message: "",
    tokenValid: true,
    fillMs: 10_000,
    originOk: true,
  });

  assert.equal(verdict.score, 0);
});

test("a missing Origin alone is not enough", () => {
  // Three points. The signal is as close to proof of a script as this file has —
  // a browser always sends `Origin` on a POST — and it still does not decide on
  // its own, because the one route to a false positive here is an unforeseen
  // proxy rewriting headers, and that failure would be silent.
  const verdict = classifyEnquiry({ ...GENUINE, originOk: false });

  assert.equal(verdict.spam, false);
  assert.equal(verdict.score, 3);
  assert.deepEqual(verdict.reasons, ["no-origin"]);
});

test("all three mechanical signals together do block", () => {
  // No token, submitted instantly, no Origin: eight. Nothing is claimed about
  // what the visitor wrote — only that no browser form produced this.
  const verdict = classifyEnquiry({
    ...GENUINE,
    tokenValid: false,
    fillMs: MIN_FILL_MS - 1,
    originOk: false,
  });

  assert.equal(verdict.score, 8);
  assert.equal(verdict.spam, true);
});

test("the wave as it actually arrives scores thirteen", () => {
  // The same submission as above, judged with the two mechanical facts the
  // production logs showed for every one of them: no form token, no Origin. Worth
  // asserting separately from the content-only case, because this is the number
  // the running site sees.
  const verdict = classifyEnquiry({
    ...GENUINE,
    name: "Ирина Соколова",
    company: "",
    message:
      "Компания OZON рада пригласить вас на нашу новую акцию: " +
      "https://share.google/0gTK1uQbWflbqoSmQ",
    tokenValid: false,
    fillMs: null,
    originOk: false,
  });

  assert.equal(verdict.spam, true);
  assert.equal(verdict.score, 13);
  assert.deepEqual(verdict.reasons, [
    "foreign-script",
    "link",
    "shortener",
    "no-token",
    "no-origin",
  ]);
});

test("identical signatures produce an identical reason string", () => {
  // Load-bearing for storage, not for classification. Blocked submissions are
  // deduplicated on this string — see spamSignatureSeen in lib/enquiries.ts — so
  // if two submissions with the same signals ever produced different text, the
  // table would fill up with rows nobody needs. Different bodies, same signals.
  const first = classifyEnquiry({
    ...GENUINE,
    message: "Поздравляем! https://share.google/aaaa",
    tokenValid: false,
    fillMs: null,
    originOk: false,
  });
  const second = classifyEnquiry({
    ...GENUINE,
    name: "Другое Имя",
    message: "Вы стали победителем: https://share.google/bbbb",
    tokenValid: false,
    fillMs: null,
    originOk: false,
  });

  assert.equal(spamReason(first), spamReason(second));
  assert.equal(spamReason(first), "13: foreign-script, link, shortener, no-token, no-origin");
});

test("a different signature is a different string, so it is stored anyway", () => {
  // The other half of the deduplication contract: a misjudged real enquiry does
  // not share the flood's signature, so it is never suppressed by it.
  const flood = classifyEnquiry({
    ...GENUINE,
    message: "Акция: https://share.google/aaaa",
    tokenValid: false,
    fillMs: null,
    originOk: false,
  });
  const other = classifyEnquiry({ ...GENUINE, name: "李伟", message: "您好。" });

  assert.notEqual(spamReason(flood), spamReason(other));
});
