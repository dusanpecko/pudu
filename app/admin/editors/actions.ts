"use server";

import { revalidatePath } from "next/cache";

import { addEditor, isEditor, removeEditor } from "@/lib/editors";
import { getEditor } from "@/lib/supabase/server";

export type EditorsState = {
  status: "ok" | "error";
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
 * Adds an editor: a Supabase account with the password the administrator typed,
 * and a row granting access.
 *
 * The password is deliberately chosen by a person rather than generated, so it
 * can be handed over in whatever way they already trust. It is never stored
 * here and never shown again — the new editor changes it in Profil, and until
 * they do, whoever set it knows it.
 */
export async function createEditor(
  _previous: EditorsState,
  formData: FormData,
): Promise<EditorsState> {
  const actingAs = await requireEditor();

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const note = String(formData.get("note") ?? "");

  const result = await addEditor({ email, password, note, addedBy: actingAs });
  if (!result.ok) return { status: "error", message: result.message };

  revalidatePath("/admin/editors");

  const { editor: added, accountExisted } = result.data;
  return {
    status: "ok",
    message: accountExisted
      ? `${added.email} má prístup. Konto s touto adresou už existovalo, takže heslo zostalo pôvodné — to, ktoré ste zadali, sa nepoužilo.`
      : `${added.email} má prístup. Heslo mu odovzdajte osobne — zobraziť sa už nedá.`,
  };
}

/** Revokes access. The Supabase account stays; see lib/editors.ts. */
export async function revokeEditor(email: unknown): Promise<EditorsState> {
  const actingAs = await requireEditor();

  if (typeof email !== "string") {
    return { status: "error", message: "Chýba adresa." };
  }

  const result = await removeEditor(email, actingAs);
  if (!result.ok) return { status: "error", message: result.message };

  revalidatePath("/admin/editors");
  return { status: "ok", message: `${email.trim().toLowerCase()} už prístup nemá.` };
}
