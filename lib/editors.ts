import "server-only";

import { editorsConfigured, envEditors } from "@/lib/supabase/editors";
import { adminClientConfigured, createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Who may use the administration.
 *
 * The effective allowlist is the `editors` table plus the addresses in
 * `ADMIN_EMAILS`. The table is what the administration manages; the variable is
 * the door that does not depend on the database being reachable.
 *
 * **Nothing here is cached, deliberately.** Every other database read in this
 * app is, because a stale footer costs nothing. A stale allowlist costs
 * something in both directions: an editor removed today would keep their access
 * until the cache expired, and one added today would be turned away. The read is
 * a single small query on `/admin` requests only — an audience of a handful of
 * people — so the cache would be buying nothing and risking exactly the wrong
 * thing.
 *
 * A failed read falls back to the environment list rather than to nothing. That
 * is the one direction a failure may lean: it keeps the owner able to sign in
 * and fix whatever broke, without admitting anybody the environment does not
 * already name.
 */

const TABLE = "editors";

// Named columns are safe here: this table arrives whole in one migration and
// nothing later adds to it. Where a column might appear between a deploy and a
// migration, the other modules read `*` instead.
const SELECT = "email, note, created_at, created_by";

export type Editor = {
  email: string;
  note: string;
  createdAt: string | null;
  createdBy: string;
  /**
   * Comes from `ADMIN_EMAILS`, so the administration cannot remove it — that
   * would need a change of environment and a deployment, which is the point.
   */
  fromEnv: boolean;
};

type Row = {
  email: string;
  note: string | null;
  created_at: string | null;
  created_by: string | null;
};

export type EditorsResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

function normalise(email: string): string {
  return email.trim().toLowerCase();
}

/** Reads the table alone. Returns null when it cannot be read at all. */
async function fetchRows(): Promise<Row[] | null> {
  if (!adminClientConfigured) return null;

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select(SELECT)
      .order("created_at", { ascending: true })
      .returns<Row[]>();

    if (error) {
      // Before the migration runs the table does not exist, which is a normal
      // state on a fresh checkout and must not lock the owner out.
      console.warn(`editors unavailable: ${error.message}`);
      return null;
    }
    return data ?? [];
  } catch (error) {
    console.warn(
      `editors unavailable: ${error instanceof Error ? error.message : error}`,
    );
    return null;
  }
}

/**
 * The full list as the administration shows it: the table first, then any
 * environment address the table does not already name.
 */
export async function loadEditors(): Promise<Editor[]> {
  const rows = (await fetchRows()) ?? [];
  const fromTable = rows.map(
    (row): Editor => ({
      email: row.email,
      note: row.note ?? "",
      createdAt: row.created_at,
      createdBy: row.created_by ?? "",
      fromEnv: false,
    }),
  );

  const known = new Set(fromTable.map((editor) => editor.email));
  const fromEnv = envEditors
    .filter((email) => !known.has(email))
    .map(
      (email): Editor => ({
        email,
        note: "",
        createdAt: null,
        createdBy: "",
        fromEnv: true,
      }),
    );

  return [...fromTable, ...fromEnv];
}

/** The check every admin page and action makes. */
export async function isEditor(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const wanted = normalise(email);

  // Checked first and without touching the database: it is the answer that has
  // to survive the database being down.
  if (envEditors.includes(wanted)) return true;

  const rows = await fetchRows();
  if (rows === null) return false;
  return rows.some((row) => row.email === wanted);
}

/**
 * Grants access and creates the Supabase account in one step.
 *
 * Both halves are needed and neither is enough alone — an account without a row
 * signs in and is refused, a row without an account has nothing to sign in with.
 * The account is created first, because it is the half that can fail for reasons
 * outside our control (a weak password, an address already registered), and a
 * row pointing at an account that was never created is the more confusing of the
 * two failures to be left with.
 */
export async function addEditor(input: {
  email: string;
  password: string;
  note: string;
  addedBy: string;
}): Promise<EditorsResult<{ editor: Editor; accountExisted: boolean }>> {
  const email = normalise(input.email);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { ok: false, message: "Zadajte platnú e-mailovú adresu." };
  }
  if (input.password.length < 8) {
    return { ok: false, message: "Heslo musí mať aspoň 8 znakov." };
  }
  if (!adminClientConfigured) {
    return { ok: false, message: "Chýba servisný kľúč k databáze." };
  }

  const supabase = createSupabaseAdminClient();

  const { error: authError } = await supabase.auth.admin.createUser({
    email,
    password: input.password,
    // The address is not verified by anybody sending mail to it, so marking it
    // confirmed is honest about what happened: an administrator vouched for it.
    // Without this the account cannot sign in while "Confirm email" is on, and
    // the invitation mail that would confirm it needs SMTP configured in
    // Supabase, which is a separate thing from the mail this site sends.
    email_confirm: true,
  });

  // An address that already has an account is not a failure: it happens when
  // access was revoked and is being restored, and when somebody was given an
  // account before this screen existed. The row below is what grants access.
  //
  // The password typed above is *not* applied in that case, and the caller is
  // told so. Quietly resetting a working password because somebody re-added an
  // address would lock out the person using it; quietly ignoring the typed
  // password would leave the administrator believing they had set one.
  const accountExisted =
    authError !== null && /already|registered|exists/i.test(authError.message);
  if (authError && !accountExisted) {
    return { ok: false, message: `Účet sa nepodarilo vytvoriť: ${authError.message}` };
  }

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(
      {
        email,
        note: input.note.trim(),
        created_by: normalise(input.addedBy),
      },
      { onConflict: "email" },
    )
    .select(SELECT)
    .single<Row>();

  if (error || !data) {
    return {
      ok: false,
      message: `Prístup sa nepodarilo uložiť: ${error?.message ?? "neznáma chyba"}`,
    };
  }

  return {
    ok: true,
    data: {
      editor: {
        email: data.email,
        note: data.note ?? "",
        createdAt: data.created_at,
        createdBy: data.created_by ?? "",
        fromEnv: false,
      },
      accountExisted,
    },
  };
}

/**
 * Revokes access. The Supabase account stays, so access can be restored and the
 * enquiries this person handled keep naming somebody who exists.
 */
export async function removeEditor(
  email: string,
  actingAs: string,
): Promise<EditorsResult<null>> {
  const wanted = normalise(email);

  // Removing yourself is the one mistake with no way back through the interface,
  // so it is refused rather than confirmed.
  if (wanted === normalise(actingAs)) {
    return { ok: false, message: "Vlastný prístup si odobrať nemôžete." };
  }
  if (envEditors.includes(wanted)) {
    return {
      ok: false,
      message: "Táto adresa je nastavená v prostredí — odobrať sa dá len tam.",
    };
  }
  if (!adminClientConfigured) {
    return { ok: false, message: "Chýba servisný kľúč k databáze." };
  }

  // Not a concern while the environment names somebody, which is the case that
  // matters — but a project configured without it would otherwise be one click
  // from having no way in at all.
  if (!editorsConfigured) {
    const rows = await fetchRows();
    if (rows !== null && rows.length <= 1) {
      return {
        ok: false,
        message: "Toto je posledný prístup — bez neho by sa do administrácie nedostal nikto.",
      };
    }
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from(TABLE).delete().eq("email", wanted);
  if (error) {
    return { ok: false, message: `Odobratie zlyhalo: ${error.message}` };
  }
  return { ok: true, data: null };
}
