"use client";

import { useActionState, useState, useTransition } from "react";

import {
  createEditor,
  revokeEditor,
  type EditorsState,
} from "@/app/admin/editors/actions";
import type { Editor } from "@/lib/editors";

const FIELD =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500";
const LABEL = "text-xs font-medium uppercase tracking-wide text-slate-500";

const IDLE: EditorsState = { status: "ok", message: "" };

function when(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("sk-SK", { dateStyle: "medium" });
}

function Notice({ state }: { state: EditorsState }) {
  if (!state.message) return null;
  return (
    <p
      className={`rounded-lg px-3 py-2 text-sm ${
        state.status === "error"
          ? "bg-rose-50 text-rose-900"
          : "bg-emerald-50 text-emerald-900"
      }`}
    >
      {state.message}
    </p>
  );
}

export default function EditorsManager({
  editors,
  currentEmail,
}: {
  editors: Editor[];
  /** Used to mark the signed-in row, which cannot revoke itself. */
  currentEmail: string;
}) {
  const [addState, addAction, adding] = useActionState(createEditor, IDLE);
  const [revokeState, setRevokeState] = useState<EditorsState>(IDLE);
  const [busy, startTransition] = useTransition();

  const revoke = (editor: Editor) => {
    if (
      !window.confirm(
        `Odobrať prístup pre ${editor.email}?\n\n` +
          "Konto zostane, takže prístup sa dá kedykoľvek vrátiť.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      setRevokeState(await revokeEditor(editor.email));
    });
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Používatelia</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Kto sa dostane do administrácie. Pridanie vytvorí konto aj prístup naraz,
          takže sa nemusí nič nastavovať inde. Heslo, ktoré zadáte, odovzdajte
          osobne — nový používateľ si ho zmení v Profile.
        </p>
      </header>

      <Notice state={revokeState} />

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {editors.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">Zatiaľ nikto.</p>
        ) : null}

        {editors.map((editor) => {
          const isSelf = editor.email === currentEmail;
          return (
            <div
              key={editor.email}
              className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium text-slate-900">{editor.email}</span>
                  {isSelf ? (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                      to ste vy
                    </span>
                  ) : null}
                  {editor.fromEnv ? (
                    <span
                      title="Adresa je nastavená v prostredí na hostingu. Odobrať sa dá len tam — je to poistka pre prípad, že by sa prístup stratil."
                      className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900"
                    >
                      z nastavenia hostingu
                    </span>
                  ) : null}
                </p>
                {editor.note || editor.createdAt ? (
                  <p className="mt-0.5 text-xs text-slate-500">
                    {editor.note}
                    {editor.note && editor.createdAt ? " · " : ""}
                    {editor.createdAt ? `pridaný ${when(editor.createdAt)}` : ""}
                    {editor.createdBy ? ` (${editor.createdBy})` : ""}
                  </p>
                ) : null}
              </div>

              {editor.fromEnv || isSelf ? null : (
                <button
                  type="button"
                  onClick={() => revoke(editor)}
                  disabled={busy}
                  className="rounded-lg border border-rose-300 px-2 py-1 text-xs text-rose-700 disabled:opacity-40"
                >
                  Odobrať prístup
                </button>
              )}
            </div>
          );
        })}
      </section>

      <form
        action={addAction}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"
      >
        <h2 className="text-sm font-semibold text-slate-900">Pridať používateľa</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <span className={LABEL}>E-mail</span>
            <input name="email" type="email" required className={FIELD} />
          </label>
          <label className="space-y-1">
            <span className={LABEL}>Dočasné heslo</span>
            <input
              name="password"
              type="text"
              required
              minLength={8}
              className={FIELD}
            />
            <span className="block text-xs text-slate-500">
              Aspoň 8 znakov. Zobrazuje sa otvorene, aby ste si ho vedeli odpísať —
              po uložení sa už nezobrazí.
            </span>
          </label>
        </div>

        <label className="block space-y-1">
          <span className={LABEL}>Poznámka (nepovinné)</span>
          <input
            name="note"
            placeholder="meno, úloha — pre toho, kto zoznam bude čítať o rok"
            className={FIELD}
          />
        </label>

        <Notice state={addState} />

        <button
          type="submit"
          disabled={adding}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {adding ? "Pridávam…" : "Pridať používateľa"}
        </button>
      </form>
    </div>
  );
}
