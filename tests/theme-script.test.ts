import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { ROOT } from "./helpers.ts";

/**
 * Runs the exact inline script ThemeScript ships — extracted from the shipped
 * template literal, not re-implemented — against a mocked browser.
 *
 * The seven cases are the contract: a stored choice beats the system either
 * way, nonsense in storage is ignored, and blocked storage still honours the
 * system preference. That last case is the one that regressed during
 * development (a single try/catch took the preference down with the storage
 * read), which is why it is pinned here.
 *
 * The script has a twin: `resolveTheme()`, the function ThemeScript runs on
 * every client mount, because a language switch re-creates `<html>` and an
 * inline script does not run twice. The last test runs both against the same
 * seven cases and requires them to agree — the two are written separately, and
 * this is what stops them drifting apart.
 */

function shippedScript(): string {
  const source = readFileSync(
    join(ROOT, "components/layout/ThemeScript.tsx"),
    "utf8",
  );
  const match = source.match(/const SCRIPT = `([\s\S]*?)`;/);
  if (!match) throw new Error("SCRIPT not found in ThemeScript.tsx");
  return match[1];
}

function run(options: {
  stored?: string | null;
  storageBlocked?: boolean;
  systemLight: boolean;
}): string | undefined {
  const documentElement: { dataset: { theme?: string } } = { dataset: {} };

  const localStorage = {
    getItem(): string | null {
      if (options.storageBlocked) throw new Error("blocked");
      return options.stored ?? null;
    },
  };
  const window = {
    matchMedia(query: string) {
      return { matches: query.includes("light") ? options.systemLight : !options.systemLight };
    },
  };

  new Function("localStorage", "window", "document", shippedScript())(
    localStorage,
    window,
    { documentElement },
  );
  return documentElement.dataset.theme;
}

type Case = {
  stored?: string | null;
  storageBlocked?: boolean;
  systemLight: boolean;
};

/**
 * Runs the body of `resolveTheme()` — cut from the shipped file like the script
 * is — against the same mocked browser. The body carries no type annotations for
 * exactly this reason.
 */
function runResolver(options: Case): string | undefined {
  const source = readFileSync(
    join(ROOT, "components/layout/ThemeScript.tsx"),
    "utf8",
  );
  const match = source.match(
    /function resolveTheme\(\): "light" \| "dark" \{([\s\S]*?)\n\}/,
  );
  if (!match) throw new Error("resolveTheme not found in ThemeScript.tsx");

  const localStorage = {
    getItem(): string | null {
      if (options.storageBlocked) throw new Error("blocked");
      return options.stored ?? null;
    },
  };
  const window = {
    matchMedia(query: string) {
      return { matches: query.includes("light") ? options.systemLight : !options.systemLight };
    },
  };

  return new Function("localStorage", "window", match[1])(localStorage, window);
}

const CASES: Case[] = [
  { stored: "light", systemLight: false },
  { stored: "dark", systemLight: true },
  { stored: null, systemLight: true },
  { stored: null, systemLight: false },
  { stored: "banana", systemLight: false },
  { storageBlocked: true, systemLight: true },
  { storageBlocked: true, systemLight: false },
];

test("stored light wins over a dark system", () => {
  assert.equal(run({ stored: "light", systemLight: false }), "light");
});

test("stored dark wins over a light system", () => {
  assert.equal(run({ stored: "dark", systemLight: true }), "dark");
});

test("nothing stored follows a light system", () => {
  assert.equal(run({ stored: null, systemLight: true }), "light");
});

test("nothing stored follows a dark system", () => {
  assert.equal(run({ stored: null, systemLight: false }), "dark");
});

test("nonsense in storage is ignored in favour of the system", () => {
  assert.equal(run({ stored: "banana", systemLight: false }), "dark");
});

test("blocked storage still honours a light system", () => {
  assert.equal(run({ storageBlocked: true, systemLight: true }), "light");
});

test("blocked storage still honours a dark system", () => {
  assert.equal(run({ storageBlocked: true, systemLight: false }), "dark");
});

test("the client-side resolver agrees with the script on every case", () => {
  for (const options of CASES) {
    assert.equal(runResolver(options), run(options), JSON.stringify(options));
  }
});
