"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  markHandled,
  purgeOldEnquiries,
  removeEnquiry,
} from "@/app/admin/enquiries/actions";
import type { Enquiry } from "@/lib/enquiries";
import { localeLabels } from "@/lib/i18n";

type EnquiriesTableProps = {
  enquiries: Enquiry[];
  productNames: Record<string, string>;
  /** How many rows are past the retention period. */
  expiredCount: number;
  /** Already worded, e.g. "5 rokov". */
  retention: string;
};

function when(value: string): string {
  return new Date(value).toLocaleString("sk-SK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * The enquiries, newest first, with the outstanding ones reachable in one click.
 *
 * `mailSent` is shown per row rather than summarised: a row that was stored but
 * never delivered is the one case where somebody has to act on the *system*
 * rather than on the customer, and it would otherwise be invisible.
 */
export default function EnquiriesTable({
  enquiries,
  productNames,
  expiredCount,
  retention,
}: EnquiriesTableProps) {
  const router = useRouter();

  const [openOnly, setOpenOnly] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);

  const open = enquiries.filter((entry) => !entry.handled);
  const undelivered = enquiries.filter((entry) => !entry.mailSent);
  const rows = openOnly ? open : enquiries;

  /**
   * Deletion is irreversible and the row is somebody's personal data, so it asks
   * — and says whose enquiry is about to go, not just "are you sure".
   */
  const destroy = async (entry: Enquiry) => {
    if (!window.confirm(`Zmazať dopyt od ${entry.name} <${entry.email}>? Nedá sa vrátiť.`)) {
      return;
    }

    setBusy(entry.id);
    const result = await removeEnquiry(entry.id);
    setMessage(result.message);
    setFailed(result.status === "error");
    setBusy(null);
    if (result.status === "ok") router.refresh();
  };

  const purge = async () => {
    if (
      !window.confirm(
        `Zmazať ${expiredCount} dopytov starších ako ${retention}? Nedá sa vrátiť.`,
      )
    ) {
      return;
    }

    setBusy("purge");
    const result = await purgeOldEnquiries();
    setMessage(result.message);
    setFailed(result.status === "error");
    setBusy(null);
    if (result.status === "ok") router.refresh();
  };

  const toggle = async (entry: Enquiry) => {
    setBusy(entry.id);
    const result = await markHandled(entry.id, !entry.handled);
    setMessage(result.message);
    setFailed(result.status === "error");
    setBusy(null);
    if (result.status === "ok") router.refresh();
  };

  return (
    <div className="mx-auto flex max-w-400 flex-col gap-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dopyty</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Každý dopyt sa zapíše ešte pred odoslaním e-mailu, takže sa nestratí ani
            keď pošta zlyhá. Obsahuje osobné údaje — zaobchádzajte s ním podľa
            zásad, na ktoré formulár odkazuje. Dopyty staršie ako {retention} sa
            mažú automaticky; jednotlivý dopyt zmažete tlačidlom, keď o to
            zákazník požiada.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span
            className={
              open.length > 0
                ? "rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-900"
                : "rounded-full bg-slate-100 px-3 py-1 text-slate-500"
            }
          >
            {open.length === 0 ? "všetko vybavené" : `${open.length} nevybavených`}
          </span>
          <label className="flex items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              checked={openOnly}
              onChange={(event) => setOpenOnly(event.target.checked)}
            />
            iba nevybavené
          </label>
        </div>
      </header>

      {message ? (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            failed ? "bg-rose-50 text-rose-900" : "bg-emerald-50 text-emerald-900"
          }`}
        >
          {message}
        </p>
      ) : null}

      {expiredCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
          <span>
            <strong>{expiredCount}</strong>{" "}
            {expiredCount === 1 ? "dopyt je" : "dopytov je"} starších ako{" "}
            {retention}, teda za dobou uchovávania.
          </span>
          <button
            type="button"
            onClick={() => void purge()}
            disabled={busy !== null}
            className="shrink-0 rounded-lg border border-sky-400 bg-white px-3 py-1.5 font-medium text-sky-900 disabled:opacity-40"
          >
            Zmazať staré
          </button>
        </div>
      ) : null}

      {undelivered.length > 0 ? (
        <p className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          <strong>{undelivered.length}</strong>{" "}
          {undelivered.length === 1 ? "dopyt sa" : "dopytov sa"} nepodarilo odoslať
          e-mailom. Zákazník o tom nevie — text má uložený tu, ale skontrolujte
          nastavenie pošty.
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
          {openOnly ? "Žiadne nevybavené dopyty." : "Zatiaľ žiadne dopyty."}
        </p>
      ) : null}

      <div className="space-y-3">
        {rows.map((entry) => (
          <article
            key={entry.id}
            className={`rounded-xl border bg-white ${
              entry.handled ? "border-slate-200" : "border-amber-300"
            }`}
          >
            <div className="flex flex-wrap items-start gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <strong className="text-slate-900">{entry.name}</strong>
                  {entry.company ? (
                    <span className="text-slate-500">{entry.company}</span>
                  ) : null}
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                    {localeLabels[entry.locale]}
                  </span>
                  {entry.product ? (
                    <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-xs text-indigo-900">
                      {productNames[entry.product] ?? entry.product}
                    </span>
                  ) : null}
                  {!entry.mailSent ? (
                    <span
                      title={entry.mailError ?? undefined}
                      className="rounded bg-rose-100 px-1.5 py-0.5 text-xs text-rose-900"
                    >
                      neodoslané
                    </span>
                  ) : null}
                  {entry.mailSent && !entry.copySent ? (
                    <span
                      title="Dopyt firme odišiel, kópia zákazníkovi nie."
                      className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900"
                    >
                      bez kópie
                    </span>
                  ) : null}
                </p>

                <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <a href={`mailto:${entry.email}`} className="underline">
                    {entry.email}
                  </a>
                  {entry.phone ? (
                    <a
                      href={`tel:${entry.phone.replace(/[^\d+]/g, "")}`}
                      className="underline"
                    >
                      {entry.phone}
                    </a>
                  ) : null}
                  <span>{when(entry.createdAt)}</span>
                </p>

                <p
                  className={`mt-2 text-sm whitespace-pre-wrap text-slate-700 ${
                    expanded === entry.id ? "" : "line-clamp-2"
                  }`}
                >
                  {entry.message}
                </p>
                {entry.message.length > 140 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded(expanded === entry.id ? null : entry.id)
                    }
                    className="mt-1 text-xs text-slate-500 underline hover:text-slate-900"
                  >
                    {expanded === entry.id ? "skryť" : "celý text"}
                  </button>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={entry.handled}
                    disabled={busy === entry.id}
                    onChange={() => void toggle(entry)}
                  />
                  vybavené
                </label>
                <button
                  type="button"
                  onClick={() => void destroy(entry)}
                  disabled={busy === entry.id}
                  className="rounded-lg border border-rose-300 px-2 py-1 text-xs text-rose-700 disabled:opacity-40"
                >
                  Zmazať
                </button>
                {entry.handled && entry.handledBy ? (
                  <span className="text-right text-xs text-slate-500">
                    {entry.handledBy}
                    {entry.handledAt ? (
                      <>
                        <br />
                        {when(entry.handledAt)}
                      </>
                    ) : null}
                  </span>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
