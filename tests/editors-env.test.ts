import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "node:test";

import { ROOT } from "./helpers.ts";

/**
 * The environment half of the allowlist — the door that has to work when the
 * database does not. The module reads ADMIN_EMAILS once at load, so each case
 * sets the variable and imports a fresh copy via a cache-busting query string.
 */

async function load(adminEmails: string | undefined) {
  if (adminEmails === undefined) delete process.env.ADMIN_EMAILS;
  else process.env.ADMIN_EMAILS = adminEmails;

  const url = pathToFileURL(join(ROOT, "lib/supabase/editors.ts"));
  url.searchParams.set("case", JSON.stringify(adminEmails));
  return import(url.href);
}

test("addresses are trimmed, lower-cased and empties dropped", async () => {
  const mod = await load("  Dusan@Example.SK , ,second@example.sk,");

  assert.deepEqual(mod.envEditors, ["dusan@example.sk", "second@example.sk"]);
  assert.equal(mod.editorsConfigured, true);
});

test("matching is case-insensitive on the way in too", async () => {
  const mod = await load("owner@example.sk");

  assert.equal(mod.isEnvEditor("OWNER@example.sk"), true);
  assert.equal(mod.isEnvEditor("stranger@example.sk"), false);
});

test("a missing variable admits nobody and says so", async () => {
  const mod = await load(undefined);

  assert.deepEqual(mod.envEditors, []);
  assert.equal(mod.editorsConfigured, false);
  assert.equal(mod.isEnvEditor("anyone@example.sk"), false);
});

test("null and empty are refused without throwing", async () => {
  const mod = await load("owner@example.sk");

  assert.equal(mod.isEnvEditor(null), false);
  assert.equal(mod.isEnvEditor(undefined), false);
  assert.equal(mod.isEnvEditor(""), false);
});
