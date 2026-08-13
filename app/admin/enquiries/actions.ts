"use server";

import { revalidatePath } from "next/cache";

import {
  deleteEnquiry,
  purgeExpiredEnquiries,
  retentionLabel,
  setHandled,
} from "@/lib/enquiries";
import { isEditor } from "@/lib/supabase/editors";
import { getEditor } from "@/lib/supabase/server";

export type EnquiryActionState = {
  status: "ok" | "error";
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

/**
 * Marks an enquiry handled, or puts it back.
 *
 * The editor's own address is taken from the session rather than the request, so
 * one editor cannot record a colleague as having dealt with something.
 */
export async function markHandled(
  id: unknown,
  handled: unknown,
): Promise<EnquiryActionState> {
  const editorEmail = await requireEditor();

  if (typeof id !== "string" || typeof handled !== "boolean") {
    return { status: "error", message: "Neplatné údaje." };
  }

  const result = await setHandled(id, handled, editorEmail);
  if (!result.ok) return { status: "error", message: result.message };

  revalidatePath("/admin/enquiries");
  return {
    status: "ok",
    message: handled ? "Označené ako vybavené." : "Vrátené medzi nevybavené.",
  };
}

/**
 * Deletes one enquiry outright.
 *
 * This is what answers a request for erasure, so the row goes rather than being
 * flagged — a "deleted" marker would still be personal data about that person.
 */
export async function removeEnquiry(id: unknown): Promise<EnquiryActionState> {
  await requireEditor();
  if (typeof id !== "string") {
    return { status: "error", message: "Neplatné údaje." };
  }

  const result = await deleteEnquiry(id);
  if (!result.ok) return { status: "error", message: result.message };

  revalidatePath("/admin/enquiries");
  return { status: "ok", message: "Dopyt zmazaný." };
}

/** Deletes everything past the retention period. */
export async function purgeOldEnquiries(): Promise<EnquiryActionState> {
  await requireEditor();

  const removed = await purgeExpiredEnquiries();
  revalidatePath("/admin/enquiries");

  return {
    status: "ok",
    message:
      removed === 0
        ? `Nič staršie ako ${retentionLabel()} tu nie je.`
        : `Zmazaných ${removed} dopytov starších ako ${retentionLabel()}.`,
  };
}
