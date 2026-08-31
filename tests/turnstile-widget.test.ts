import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { ROOT } from "./helpers.ts";

/**
 * Guards against one specific mistake, because it has already been made and it
 * was expensive out of all proportion to its size.
 *
 * `turnstile.ready()` throws a TurnstileError when api.js carries `async` or
 * `defer`, and `next/script` always adds `async`. Called from the render effect
 * it reached React's error boundary — and because the contact form sits on every
 * page of this site, every page served Next's built-in "This page couldn't load"
 * after hydration. The HTML was correct throughout, so a status check and a
 * typecheck and a build all passed while the site showed nothing to anybody.
 *
 * It was added deliberately, as belt-and-braces, on the strength of a
 * documentation example that uses a plain script tag. That is what makes it worth
 * a test rather than a comment alone: the next person to read the same page will
 * reach for the same call for the same good reason.
 *
 * A grep over the source is a blunt instrument and this file is not pretending
 * otherwise. What it buys is that the failure cannot come back silently, which is
 * the only property that mattered here.
 */

const source = readFileSync(
  join(ROOT, "components/contact/Turnstile.tsx"),
  "utf8",
);

/**
 * The file with its comments removed.
 *
 * Necessary, and the first version of this test proved it by failing: the note in
 * Turnstile.tsx explaining why `turnstile.ready()` must not be called contains the
 * words `turnstile.ready()`, so a grep over the raw text finds the warning and
 * calls it the offence.
 *
 * `//` is only treated as a comment when it does not follow a colon, so the
 * `https://` inside the script URL survives.
 */
const code = source
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/(^|[^:])\/\/.*$/gm, "$1");

test("turnstile.ready() is never called", () => {
  // Any spelling, on any object. The script this component renders is loaded by
  // next/script, which makes the call a guaranteed throw rather than a risk.
  assert.doesNotMatch(
    code,
    /\.ready\s*\(/,
    "turnstile.ready() throws when api.js is async, and next/script always makes it async — " +
      "see the note in Turnstile.tsx",
  );
});

test("the stripper leaves the code it is supposed to check", () => {
  // Because a stripper that quietly emptied the string would make every
  // assertion above pass for the wrong reason.
  assert.match(code, /api\.render\(/);
  assert.match(code, /window\.turnstile\?\.reset\(/);
  assert.ok(code.length > source.length / 4, "too much was stripped");
});

test("the widget calls are wrapped, so the page survives them", () => {
  // Third-party code running inside an effect on every page. The specific throw
  // above is now impossible, but the general shape of that failure is not, and
  // the blast radius is the whole site.
  for (const call of ["api.render(", "reset("]) {
    const at = code.indexOf(call);
    assert.notEqual(at, -1, `${call} not found — did the widget change shape?`);

    // The nearest `try {` before the call, and no closing of that block between
    // them. Crude, and enough to catch an unwrapped call being added back.
    const before = code.slice(0, at);
    const tryAt = before.lastIndexOf("try {");
    assert.notEqual(tryAt, -1, `${call} is not inside a try block`);
    assert.doesNotMatch(
      code.slice(tryAt, at),
      /\n\s{4}\}/,
      `${call} sits after its try block closed`,
    );
  }
});

test("the script is loaded through next/script, which is why the above holds", () => {
  // The two tests above are only correct while this is true. If the component
  // ever switches to a bare <script> tag without async, `ready()` becomes legal
  // and this file should be revisited rather than worked around.
  assert.match(source, /from "next\/script"/);
  assert.match(source, /challenges\.cloudflare\.com\/turnstile\/v0\/api\.js/);
});
