import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { ROOT } from "./helpers.ts";

/**
 * The translations manager's core guarantee: regenerating an unchanged file
 * reproduces it byte for byte.
 *
 * This is what makes the manager's download safe to commit — an editor's change
 * shows up in the diff as that change and nothing else. The guarantee broke
 * once, quietly, when a doc comment was added to a data file by hand; the four
 * UI files then differed from their regenerated form for weeks and every
 * download produced a noisy diff. This test is the alarm that was missing.
 *
 * If it fails after you edited a data file by hand: regenerate the file through
 * the serializer instead (see docs/TESTY.md) — the data files are the
 * serializer's output, not free-form source.
 */

const locales = ["sk", "cz", "en", "de"] as const;

for (const locale of locales) {
  test(`ui translations ${locale} round-trip byte for byte`, async () => {
    const { serializeUiTranslations } = await import("../lib/translation-source.ts");
    const mod = await import(`../data/translations/${locale}.ts`);
    const disk = readFileSync(join(ROOT, `data/translations/${locale}.ts`), "utf8");

    assert.equal(serializeUiTranslations(locale, mod[locale]), disk);
  });

  test(`product texts ${locale} round-trip byte for byte`, async () => {
    const { serializeProductTexts } = await import("../lib/translation-source.ts");
    const mod = await import(`../data/products/translations/${locale}.ts`);
    const disk = readFileSync(
      join(ROOT, `data/products/translations/${locale}.ts`),
      "utf8",
    );
    const exportName = `productTexts${locale[0].toUpperCase()}${locale.slice(1)}`;

    assert.equal(serializeProductTexts(locale, mod[exportName]), disk);
  });
}
