import assert from "node:assert/strict";
import { test } from "node:test";

/**
 * The override model stands on one invariant: an edit whose path no longer
 * exists in the source tree is dropped, not resurrected. That is what lets a
 * renamed or removed key in the repository retire its old override instead of
 * the override beating new code forever.
 */

test("applyEdits applies a known path", async () => {
  const { applyEdits } = await import("../lib/translation-source.ts");
  const source = { home: { title: "old", intro: "keep" } };

  const result = applyEdits(source, { "home.title": "new" });

  assert.equal(result.home.title, "new");
  assert.equal(result.home.intro, "keep");
});

test("applyEdits ignores a path the source no longer has", async () => {
  const { applyEdits } = await import("../lib/translation-source.ts");
  const source = { home: { title: "old" } };

  const result = applyEdits(source, {
    "home.removedKey": "zombie",
    "gone.entirely": "zombie",
  });

  assert.deepEqual(result, { home: { title: "old" } });
});

test("applyEdits does not mutate its input", async () => {
  const { applyEdits } = await import("../lib/translation-source.ts");
  const source = { home: { title: "old" } };

  applyEdits(source, { "home.title": "new" });

  assert.equal(source.home.title, "old");
});

test("readPath answers exactly what flattenStrings lists", async () => {
  const { flattenStrings, readPath } = await import("../lib/translation-source.ts");
  const tree = { a: "x", nested: { b: "y", deeper: { c: "z" } }, list: ["p", "q"] };

  for (const entry of flattenStrings(tree)) {
    assert.equal(readPath(tree, entry.path), entry.value);
  }
});
