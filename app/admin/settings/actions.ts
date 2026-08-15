"use server";

import { revalidatePath } from "next/cache";

import { defaultLocale, isLocale, type Locale } from "@/lib/i18n";
import { sendTestMail } from "@/lib/mailer";
import { saveSmtpSettings } from "@/lib/smtp-settings";
import { isEditor } from "@/lib/editors";
import { getEditor } from "@/lib/supabase/server";

export type ActionState = {
  status: "idle" | "saved" | "sent" | "error";
  message: string;
};

/** Every action re-checks the allowlist: a server action is a public endpoint. */
async function requireEditor(): Promise<string> {
  const editor = await getEditor();
  if (!(await isEditor(editor?.email)) || !editor?.email) {
    throw new Error("Neoprávnený prístup.");
  }
  return editor.email;
}

/**
 * Which language's configuration the form is editing. It travels in a hidden
 * field rather than in the action's closure, because `useActionState` binds one
 * action for the whole form and the tabs change what it points at.
 */
function readLocale(value: FormDataEntryValue | null): Locale {
  const text = typeof value === "string" ? value : "";
  return isLocale(text) ? text : defaultLocale;
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

  const locale = readLocale(formData.get("locale"));

  const result = await saveSmtpSettings(
    locale,
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
      privacyUrl: String(formData.get("privacyUrl") ?? ""),
    },
    editorEmail,
  );

  if (!result.ok) return { status: "error", message: result.message };

  revalidatePath("/admin/settings");
  return {
    status: "saved",
    message: `Nastavenia pre ${locale.toUpperCase()} boli uložené.`,
  };
}

/**
 * Sends the test message to the signed-in editor rather than to the configured
 * recipients — whoever presses the button is the one who should receive it.
 */
export async function sendTest(locale: unknown): Promise<ActionState> {
  const editorEmail = await requireEditor();
  const target = readLocale(typeof locale === "string" ? locale : null);

  const result = await sendTestMail(editorEmail, target);
  return result.ok
    ? {
        status: "sent",
        message: `Testovací e-mail (${target.toUpperCase()}) bol odoslaný na ${editorEmail}.`,
      }
    : { status: "error", message: result.message };
}
