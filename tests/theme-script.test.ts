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
