import type { Locale } from "@/lib/i18n";

/**
 * Turns translation objects into the exact TypeScript modules that live in
 * data/, and back. Pure string handling with no filesystem access, so the
 * translations manager can generate a downloadable file in the browser.
 *
 * The generated modules keep their type annotations, which is what makes a
 * missing or misspelled key fail `npm run build` instead of showing up as an
 * empty string on the page.
 */

export type StringTree = {
  [key: string]: string | StringTree | Array<string | StringTree>;
};

/** One editable string, addressed by a dotted path such as `home.hero.title`. */
export type TranslationEntry = {
  path: string;
  value: string;
};

/** Collects every string leaf, in declaration order. */
export function flattenStrings(value: unknown, prefix = ""): TranslationEntry[] {
  if (typeof value === "string") {
    return [{ path: prefix, value }];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      flattenStrings(item, prefix ? `${prefix}.${index}` : String(index)),
    );
  }

  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) =>
      flattenStrings(child, prefix ? `${prefix}.${key}` : key),
    );
  }

  return [];
}

/** Reads a dotted path out of a nested object. */
export function readPath(source: unknown, path: string): string | undefined {
  let current: unknown = source;
  for (const step of path.split(".")) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[step];
  }
  return typeof current === "string" ? current : undefined;
}

/**
 * Returns a deep copy with the given paths replaced. Unknown paths are ignored
 * rather than created, so a stale edit can never introduce a new shape.
 */
export function applyEdits<T>(source: T, edits: Record<string, string>): T {
  const clone = structuredClone(source);

  for (const [path, value] of Object.entries(edits)) {
    const steps = path.split(".");
    const last = steps.pop();
    if (!last) continue;

    let target: unknown = clone;
    for (const step of steps) {
      if (target === null || typeof target !== "object") {
        target = undefined;
        break;
      }
      target = (target as Record<string, unknown>)[step];
    }

    if (target && typeof target === "object" && last in target) {
      (target as Record<string, unknown>)[last] = value;
    }
  }

  return clone;
}

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/** Matches the line length the handwritten files are formatted to. */
const PRINT_WIDTH = 80;

function escapeString(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n");
}

/**
 * Writes a value as a TypeScript literal. `references` replaces a top level key
 * with a bare identifier, which is how the Slovak file keeps `units` and `specs`
 * hoisted into their own strictly typed constants.
 */
export function serializeLiteral(
  value: unknown,
  indent = 0,
  references: Record<string, string> = {},
): string {
  const pad = "  ".repeat(indent);
  const inner = "  ".repeat(indent + 1);

  if (typeof value === "string") return `"${escapeString(value)}"`;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null) return "null";

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const items = value.map((item) => `${inner}${serializeLiteral(item, indent + 1)}`);
    return `[\n${items.join(",\n")},\n${pad}]`;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value).filter(([, item]) => item !== undefined);
    if (entries.length === 0) return "{}";

    const body = entries.map(([key, item]) => {
      const name = IDENTIFIER.test(key) ? key : `"${escapeString(key)}"`;
      const reference = references[key];
      // `specs: specs` is written as the shorthand `specs`, matching the file
      // this replaces.
      if (reference === key) return `${inner}${name}`;

      const rendered = reference ?? serializeLiteral(item, indent + 1);
      const oneLine = `${inner}${name}: ${rendered}`;

      // Long strings move to their own indented line, which is how the
      // handwritten files are formatted — it keeps the download diff small.
      if (typeof item === "string" && oneLine.length + 1 > PRINT_WIDTH) {
        return `${inner}${name}:\n${inner}  ${rendered}`;
      }
      return oneLine;
    });

    return `{\n${body.join(",\n")},\n${pad}}`;
  }

  return "undefined";
}

const SPECS_DOC = "/** Labels of technical parameters. */";
const UNITS_DOC =
  "/** Units and value templates. `{hours}` / `{percent}` are replaced at render time. */";

/**
 * Rebuilds data/translations/<locale>.ts.
 *
 * Slovak is the reference file the `Translation` type is derived from, so it
 * keeps `specs` and `units` as separate constants typed against `SpecKey` and
 * `UnitKey` — that is what guarantees every unit and parameter label exists.
 * The other languages are annotated with `Translation` instead.
 */
export function serializeUiTranslations(locale: Locale, data: StringTree): string {
  if (locale === "sk") {
    const { specs, units, ...rest } = data as StringTree & {
      specs: StringTree;
      units: StringTree;
    };
    void rest;

    return [
      'import type { SpecKey, UnitKey } from "@/types/product";',
      "",
      SPECS_DOC,
      `const specs: Record<SpecKey | "clearanceShort", string> = ${serializeLiteral(specs)};`,
      "",
      UNITS_DOC,
      `const units: Record<UnitKey, string> & { upTo: string; chargingTemplate: string } = ${serializeLiteral(units)};`,
      "",
      `export const sk = ${serializeLiteral(data, 0, { specs: "specs", units: "units" })};`,
      "",
    ].join("\n");
  }

  return [
    'import type { Translation } from "@/types/translation";',
    "",
    `export const ${locale}: Translation = ${serializeLiteral(data)};`,
    "",
  ].join("\n");
}

const LOCALE_NAMES: Record<Locale, string> = {
  sk: "Slovak",
  cz: "Czech",
  en: "English",
};

/** Rebuilds data/products/translations/<locale>.ts. */
export function serializeProductTexts(locale: Locale, data: StringTree): string {
  const exportName = `productTexts${locale[0].toUpperCase()}${locale.slice(1)}`;

  return [
    'import type { LocalizedProductContent, ProductSlug } from "@/types/product";',
    "",
    "/**",
    ` * ${LOCALE_NAMES[locale]} product copy. Technical data lives in data/products.ts — this`,
    " * file holds only text, so it can be regenerated by the translations manager.",
    " */",
    `export const ${exportName}: Record<`,
    "  ProductSlug,",
    "  LocalizedProductContent",
    `> = ${serializeLiteral(data)};`,
    "",
  ].join("\n");
}

/** The six files the manager can regenerate. */
export type SourceFile = {
  id: string;
  path: string;
  locale: Locale;
  kind: "ui" | "products";
};

export const sourceFiles: SourceFile[] = [
  { id: "ui-sk", path: "data/translations/sk.ts", locale: "sk", kind: "ui" },
  { id: "ui-cz", path: "data/translations/cz.ts", locale: "cz", kind: "ui" },
  { id: "ui-en", path: "data/translations/en.ts", locale: "en", kind: "ui" },
  {
    id: "products-sk",
    path: "data/products/translations/sk.ts",
    locale: "sk",
    kind: "products",
  },
  {
    id: "products-cz",
    path: "data/products/translations/cz.ts",
    locale: "cz",
    kind: "products",
  },
  {
    id: "products-en",
    path: "data/products/translations/en.ts",
    locale: "en",
    kind: "products",
  },
];
