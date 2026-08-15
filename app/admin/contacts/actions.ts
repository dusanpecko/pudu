"use server";

import { revalidatePath, updateTag } from "next/cache";

import { COMPANY_TAG, saveCompanyDetails } from "@/lib/company";
import type { Identifier, SocialLink } from "@/lib/company-shared";
import { isLocale } from "@/lib/i18n";
import { isEditor } from "@/lib/editors";
import { getEditor } from "@/lib/supabase/server";

export type ContactsState = {
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

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Drops the half-filled rows an editor left behind rather than storing them. */
function parseIdentifiers(input: unknown): Identifier[] {
  if (!Array.isArray(input)) return [];

  return input.flatMap((entry): Identifier[] => {
    if (!entry || typeof entry !== "object") return [];
    const source = entry as Record<string, unknown>;
    const label = text(source.label);
    const value = text(source.value);
    return label && value ? [{ label, value }] : [];
  });
}

/**
 * Only http(s) is stored. A `javascript:` URL in the footer would be an
 * injection, and the editor has no reason to need any other scheme.
 */
function parseSocial(input: unknown): SocialLink[] {
  if (!Array.isArray(input)) return [];

  return input.flatMap((entry): SocialLink[] => {
    if (!entry || typeof entry !== "object") return [];
    const source = entry as Record<string, unknown>;
    const platform = text(source.platform).toLowerCase();
    const raw = text(source.url);
    if (!platform || !raw) return [];

    try {
      const url = new URL(raw);
      if (url.protocol !== "https:" && url.protocol !== "http:") return [];
      return [{ platform, url: url.toString() }];
    } catch {
      return [];
    }
  });
}

export async function saveContacts(
  locale: unknown,
  input: unknown,
): Promise<ContactsState> {
  const editorEmail = await requireEditor();

  if (typeof locale !== "string" || !isLocale(locale)) {
    return { status: "error", message: "Neznámy jazyk." };
  }
  if (!input || typeof input !== "object") {
    return { status: "error", message: "Neplatné údaje." };
  }
  const source = input as Record<string, unknown>;

  const result = await saveCompanyDetails(
    locale,
    {
      companyName: text(source.companyName),
      address: typeof source.address === "string" ? source.address.trim() : "",
      email: text(source.email),
      phone: text(source.phone),
      identifiers: parseIdentifiers(source.identifiers),
      social: parseSocial(source.social),
    },
    editorEmail,
  );

  if (!result.ok) return { status: "error", message: result.message };

  // The footer is on every page, so the whole site has to be dropped from the
  // cache, not just this admin route.
  updateTag(COMPANY_TAG);
  revalidatePath("/admin/contacts");

  return { status: "ok", message: "Uložené. Päta je aktualizovaná." };
}
