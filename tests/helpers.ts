import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Repository root, derived from this file so tests run from any cwd. */
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Extracts a snippet from a shipped source file and imports it as a module.
 *
 * Some of the code worth testing lives in files these tests cannot import
 * whole: `lib/mailer.ts` sits behind `server-only`, `ThemeScript.tsx` is JSX,
 * and both use path aliases Node does not resolve. Rather than refactoring
 * shipped code to suit the tests, the tests cut the pure part out of the real
 * file by regex and run exactly that text. The trade-off is explicit: if the
 * snippet moves or is renamed the extraction fails loudly, and what runs in the
 * test can never drift from what ships, because it *is* what ships.
 */
export async function importSnippet<T>(
  sourcePath: string,
  pattern: RegExp,
  wrap: (match: string) => string,
  name: string,
): Promise<T> {
  const source = readFileSync(join(ROOT, sourcePath), "utf8");
  const match = source.match(pattern);
  if (!match) {
    throw new Error(`Snippet not found in ${sourcePath} — did it move or get renamed?`);
  }

  const dir = join(ROOT, "tests", ".generated");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${name}.ts`);
  writeFileSync(file, wrap(match[0]));

  return (await import(file)) as T;
}
