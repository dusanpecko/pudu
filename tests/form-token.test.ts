import assert from "node:assert/strict";
import { test } from "node:test";

import { importSnippet } from "./helpers.ts";

/**
 * The signed timestamp the contact form carries.
 *
 * Extracted rather than imported: lib/form-token.ts sits behind `server-only`,
 * which Node refuses outside a bundler. The snippet is everything from the
 * max-age constant to the end of the file — which is why the two exported
 * functions live there, last and adjacent, with nothing after them.
 *
 * What is worth testing here is not the HMAC, which is Node's. It is the three
 * decisions layered on top: that a tampered token is refused, that an old one
 * expires, and that the elapsed time a caller gets back is only ever derived from
 * a signature that verified — because an unsigned duration is the bot's to choose,
 * and the classifier weights it as if it were not.
 */

type Module = {
  issueFormToken: (now?: number) => string;
  verifyFormToken: (
    raw: unknown,
    now?: number,
  ) => { valid: boolean; fillMs: number | null };
};

const HOUR = 60 * 60 * 1000;

async function load(): Promise<Module> {
  return importSnippet<Module>(
    "lib/form-token.ts",
    /const TOKEN_MAX_AGE_MS[\s\S]*$/,
    (snippet) =>
      `import { createHash, createHmac, timingSafeEqual } from "node:crypto";\n\n${snippet}`,
    "form-token",
  );
}

test("a token it just issued verifies", async () => {
  const { issueFormToken, verifyFormToken } = await load();

  const issued = 1_760_000_000_000;
  const check = verifyFormToken(issueFormToken(issued), issued + 30_000);

  assert.equal(check.valid, true);
  assert.equal(check.fillMs, 30_000);
});

test("the elapsed time is what the classifier needs it to be", async () => {
  const { issueFormToken, verifyFormToken } = await load();

  // Below MIN_FILL_MS in lib/spam.ts, which is the whole point of reporting it.
  const issued = Date.now();
  const check = verifyFormToken(issueFormToken(issued), issued + 400);

  assert.equal(check.valid, true);
  assert.equal(check.fillMs, 400);
});

test("a tampered signature is refused", async () => {
  const { issueFormToken, verifyFormToken } = await load();

  const token = issueFormToken();
  const [issuedAt, signature] = token.split(".");
  // One character, at the end, where a lazy comparison would never look.
  const forged = `${issuedAt}.${signature.slice(0, -1)}${signature.endsWith("a") ? "b" : "a"}`;

  assert.deepEqual(verifyFormToken(forged), { valid: false, fillMs: null });
});

test("a timestamp moved under its own signature is refused", async () => {
  const { issueFormToken, verifyFormToken } = await load();

  // The interesting forgery: a bot that wants to look slow, holding a real
  // signature and rewriting only the number it covers.
  const issued = Date.now();
  const token = issueFormToken(issued);
  const signature = token.slice(token.indexOf(".") + 1);
  const backdated = `${issued - 60_000}.${signature}`;

  assert.deepEqual(verifyFormToken(backdated), { valid: false, fillMs: null });
});

test("an expired token is refused, and quietly", async () => {
  const { issueFormToken, verifyFormToken } = await load();

  const issued = Date.now();
  const token = issueFormToken(issued);

  // Six hours is the limit: still good just inside it, gone just outside.
  assert.equal(verifyFormToken(token, issued + 6 * HOUR - 1000).valid, true);

  const stale = verifyFormToken(token, issued + 7 * HOUR);
  assert.equal(stale.valid, false);
  // No duration either. An expired token proves nothing about how long anybody
  // took, and reporting the six hours would read as a very patient human.
  assert.equal(stale.fillMs, null);
});

test("a token from the future is refused", async () => {
  const { issueFormToken, verifyFormToken } = await load();

  const issued = Date.now();
  assert.equal(verifyFormToken(issueFormToken(issued + 60_000), issued).valid, false);
});

test("nothing that is not a token gets in", async () => {
  const { verifyFormToken } = await load();

  for (const raw of [
    undefined,
    null,
    42,
    {},
    [],
    "",
    ".",
    "abc",
    ".deadbeef",
    "1760000000000",
    "1760000000000.",
    "notanumber.deadbeef",
    // A timestamp long enough to overflow the format, in case the regex ever
    // loses its length bound.
    `${"9".repeat(20)}.deadbeef`,
    // Longer than the cap, which exists so a signature comparison is never
    // handed a megabyte.
    `1760000000000.${"a".repeat(500)}`,
  ]) {
    assert.deepEqual(
      verifyFormToken(raw),
      { valid: false, fillMs: null },
      JSON.stringify(raw),
    );
  }
});

test("two tokens issued a moment apart are different", async () => {
  const { issueFormToken } = await load();

  // Not a cryptographic claim — just that the timestamp is real rather than a
  // constant baked in at module load, which is exactly the bug this file exists
  // to avoid on a prerendered page.
  assert.notEqual(issueFormToken(1_000), issueFormToken(2_000));
});
