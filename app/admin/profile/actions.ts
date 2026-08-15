"use server";

import { isEditor } from "@/lib/editors";
import { createSupabaseServerClient, getEditor } from "@/lib/supabase/server";

export type ProfileState = {
  status: "ok" | "error";
  message: string;
};

const MIN_LENGTH = 8;

/**
 * Changes the signed-in editor's own password.
 *
 * The current password is asked for and checked, even though Supabase would
 * change it on the strength of the session alone. The session is a cookie in a
 * browser that may be sitting unattended in a warehouse office; knowing the old
 * password is what makes the person at the keyboard the account's owner rather
 * than whoever sat down next.
 *
 * It is checked by signing in with it, because there is no API that answers "is
 * this the password" without doing so. The side effect is a freshly issued
 * session for the same person, which is harmless — and the reason the failure
 * message stays vague is that this endpoint would otherwise confirm which
 * addresses have accounts.
 */
export async function changePassword(
  _previous: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const editor = await getEditor();
  if (!(await isEditor(editor?.email)) || !editor?.email) {
    return { status: "error", message: "Nie ste prihlásený." };
  }

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const repeat = String(formData.get("repeat") ?? "");

  if (next.length < MIN_LENGTH) {
    return {
      status: "error",
      message: `Nové heslo musí mať aspoň ${MIN_LENGTH} znakov.`,
    };
  }
  if (next !== repeat) {
    return { status: "error", message: "Nové heslá sa nezhodujú." };
  }
  if (next === current) {
    return { status: "error", message: "Nové heslo je rovnaké ako doterajšie." };
  }

  const supabase = await createSupabaseServerClient();

  const { error: checkError } = await supabase.auth.signInWithPassword({
    email: editor.email,
    password: current,
  });
  if (checkError) {
    return { status: "error", message: "Doterajšie heslo nesedí." };
  }

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) {
    // Supabase refuses passwords it considers weak or previously used; its own
    // wording is the most useful thing available here.
    return { status: "error", message: `Zmena zlyhala: ${error.message}` };
  }

  return { status: "ok", message: "Heslo je zmenené." };
}
