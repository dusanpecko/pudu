import assert from "node:assert/strict";
import { test } from "node:test";

import { importSnippet } from "./helpers.ts";

/**
 * The crop rectangle is derived on the server so its *shape* can never arrive
 * wrong from the browser — the editor only chooses where it sits. These tests
 * pin the derivation: the rectangle always has the requested aspect, always
 * fits, and the focal point moves it without ever pushing it out of bounds.
 */

type Rect = { left: number; top: number; width: number; height: number };
type Module = {
  cropRect: (w: number, h: number, fx: number, fy: number, aspect: number) => Rect;
};

async function load(): Promise<Module["cropRect"]> {
  const mod = await importSnippet<Module>(
    "lib/gallery-upload.ts",
    /export function cropRect\([\s\S]*?\n\}/,
    (snippet) => snippet,
    "cropRect",
  );
  return mod.cropRect;
}

const PHOTO = 16 / 9;

test("a wide original is cropped horizontally, full height kept", async () => {
  const cropRect = await load();
  const rect = cropRect(4000, 1000, 0.5, 0.5, PHOTO);

  assert.equal(rect.height, 1000);
  assert.equal(rect.width, Math.round(1000 * PHOTO));
  assert.equal(rect.top, 0);
});

test("a tall original is cropped vertically, full width kept", async () => {
  const cropRect = await load();
  const rect = cropRect(1000, 4000, 0.5, 0.5, PHOTO);

  assert.equal(rect.width, 1000);
  assert.equal(rect.height, Math.round(1000 / PHOTO));
  assert.equal(rect.left, 0);
});

test("an exact 16:9 original is used whole", async () => {
  const cropRect = await load();
  assert.deepEqual(cropRect(1600, 900, 0.5, 0.5, PHOTO), {
    left: 0,
    top: 0,
    width: 1600,
    height: 900,
  });
});

test("a focal point at the edge clamps instead of overflowing", async () => {
  const cropRect = await load();

  for (const focus of [0, 1]) {
    const rect = cropRect(4000, 1000, focus, 0.5, PHOTO);
    assert.ok(rect.left >= 0, `left ${rect.left} at focus ${focus}`);
    assert.ok(rect.left + rect.width <= 4000, `overflow at focus ${focus}`);
  }
});

test("the square crop for renders behaves the same way", async () => {
  const cropRect = await load();
  const rect = cropRect(3000, 2000, 0.5, 0.5, 1);

  assert.equal(rect.width, 2000);
  assert.equal(rect.height, 2000);
  assert.equal(rect.left, 500);
});
