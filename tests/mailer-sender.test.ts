import assert from "node:assert/strict";
import { test } from "node:test";

import { importSnippet } from "./helpers.ts";

/**
 * The From header of every mail this site sends. Two invariants:
 *
 *   * the address always comes from the settings — callers only choose the
 *     display name, because the address is what the mail server authenticates;
 *   * nothing typed into a name can break out of the header: quotes and
 *     backslashes are stripped, line breaks collapse to a space, so a name of
 *     "PUDU\r\nBcc: x" cannot smuggle a header in.
 */

type Settings = { fromName: string; fromEmail: string };
type Module = { sender: (settings: Settings, fromName?: string) => string };

async function load(): Promise<Module["sender"]> {
  const mod = await importSnippet<Module>(
    "lib/mailer.ts",
    /function sender\(settings: SmtpSettings, fromName\?: string\): string \{[\s\S]*?\n\}/,
    (snippet) =>
      `type SmtpSettings = { fromName: string; fromEmail: string };\nexport ${snippet}`,
    "sender",
  );
  return mod.sender;
}

const settings: Settings = { fromName: "PUDU TEST", fromEmail: "info@pudu.sk" };

test("a caller's name wins over the configured one", async () => {
  const sender = await load();
  assert.equal(sender(settings, "PUDU T300"), "PUDU T300 <info@pudu.sk>");
});

test("an empty caller name falls back to the settings", async () => {
  const sender = await load();
  assert.equal(sender(settings, ""), "PUDU TEST <info@pudu.sk>");
  assert.equal(sender(settings), "PUDU TEST <info@pudu.sk>");
});

test("no name at all leaves the bare address", async () => {
  const sender = await load();
  assert.equal(sender({ fromName: "", fromEmail: "a@b.sk" }, ""), "a@b.sk");
});

test("quotes are stripped without leaving a double space", async () => {
  const sender = await load();
  assert.equal(sender(settings, 'PUDU "T300"'), "PUDU T300 <info@pudu.sk>");
});

test("a line break cannot smuggle a header", async () => {
  const sender = await load();
  assert.equal(
    sender(settings, "PUDU\r\nBcc: attacker@evil.example"),
    "PUDU Bcc: attacker@evil.example <info@pudu.sk>",
  );
});

test("backslashes are stripped, not escaped into the header", async () => {
  const sender = await load();
  assert.equal(sender(settings, "PUDU \\ T300"), "PUDU T300 <info@pudu.sk>");
});
