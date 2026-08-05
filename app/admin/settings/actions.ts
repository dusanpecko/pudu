"use server";

import { revalidatePath } from "next/cache";

import { sendTestMail } from "@/lib/mailer";
import { saveSmtpSettings } from "@/lib/smtp-settings";
import { isEditor } from "@/lib/supabase/editors";
import { getEditor } from "@/lib/supabase/server";

export type ActionState = {
  status: "idle" | "saved" | "sent" | "error";
  message: string;
};

/** Every action re-checks the allowlist: a server action is a public endpoint. */
async function requireEditor(): Promise<string> {
  const editor = await getEditor();
  if (!isEditor(editor?.email) || !editor?.email) {
    throw new Error("Neoprávnený prístup.");
  }
  return editor.email;
}

function readPort(value: FormDataEntryValue | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 65535
    ? Math.trunc(parsed)
    : fallback;
}

export async function saveSettings(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const editorEmail = await requireEditor();

  const result = await saveSmtpSettings(
    {
      enabled: formData.get("enabled") === "on",
      host: String(formData.get("host") ?? ""),
      port: readPort(formData.get("port"), 587),
      secure: formData.get("secure") === "on",
      username: String(formData.get("username") ?? ""),
      password: String(formData.get("password") ?? ""),
      fromName: String(formData.get("fromName") ?? ""),
      fromEmail: String(formData.get("fromEmail") ?? ""),
      replyTo: String(formData.get("replyTo") ?? ""),
      recipients: String(formData.get("recipients") ?? ""),
    },
    editorEmail,
  );

  if (!result.ok) return { status: "error", message: result.message };

  revalidatePath("/admin/settings");
  return { status: "saved", message: "Nastavenia boli uložené." };
}

/**
 * Sends the test message to the signed-in editor rather than to the configured
 * recipients — whoever presses the button is the one who should receive it.
 */
export async function sendTest(): Promise<ActionState> {
  const editorEmail = await requireEditor();

  const result = await sendTestMail(editorEmail);
  return result.ok
    ? { status: "sent", message: `Testovací e-mail bol odoslaný na ${editorEmail}.` }
    : { status: "error", message: result.message };
}
