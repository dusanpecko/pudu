"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { saveContacts } from "@/app/admin/contacts/actions";
// Deliberately not from lib/company: that module is server-only, and importing
// it here would pull the admin Supabase client into the browser bundle.
import {
  knownPlatforms,
  platformLabel,
  type CompanyDetails,
  type Identifier,
  type SocialLink,
} from "@/lib/company-shared";
import { locales, localeLabels, defaultLocale, type Locale } from "@/lib/i18n";

type ContactsManagerProps = {
  details: Record<Locale, CompanyDetails>;
};

/** The form's own shape — the lists keep half-filled rows the server discards. */
type Draft = {
  companyName: string;
  address: string;
  email: string;
  phone: string;
  identifiers: Identifier[];
  social: SocialLink[];
};

function toDraft(details: CompanyDetails): Draft {
  return {
    companyName: details.companyName,
    address: details.address,
    email: details.email,
    phone: details.phone,
    identifiers: [...details.identifiers],
    social: [...details.social],
  };
}

function draftsFrom(details: Record<Locale, CompanyDetails>): Record<Locale, Draft> {
  return Object.fromEntries(
    locales.map((locale) => [locale, toDraft(details[locale])]),
  ) as Record<Locale, Draft>;
}

export default function ContactsManager({ details }: ContactsManagerProps) {
  const router = useRouter();

  const [drafts, setDrafts] = useState<Record<Locale, Draft>>(() => draftsFrom(details));
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);

  const draft = drafts[locale];

  const patch = (change: Partial<Draft>) =>
    setDrafts((current) => ({ ...current, [locale]: { ...current[locale], ...change } }));

  const save = async () => {
    setBusy(true);
    const result = await saveContacts(locale, draft);
    setMessage(result.message);
    setFailed(result.status === "error");
    setBusy(false);
    if (result.status === "ok") router.refresh();
  };

  /** Copies another language's details over this one, lists included. */
  const copyFrom = (source: Locale) => {
    setDrafts((current) => ({
      ...current,
      [locale]: {
        ...current[source],
        identifiers: current[source].identifiers.map((entry) => ({ ...entry })),
        social: current[source].social.map((entry) => ({ ...entry })),
      },
    }));
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Kontakty v päte</h1>
        <p className="mt-1 text-sm text-slate-500">
          Každý jazyk má vlastnú sadu údajov, takže za slovenským a českým trhom môže
          stáť iná firma než za anglickým. Prázdny jazyk pätu nezobrazí — nič sa
          nerozbije, kým údaje nedoplníte.
        </p>
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1">
          {locales.map((candidate) => {
            const filled = drafts[candidate].companyName.trim() !== "";
            return (
              <button
                key={candidate}
                type="button"
                onClick={() => setLocale(candidate)}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  candidate === locale
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {localeLabels[candidate]}
                {filled ? "" : " ·"}
              </button>
            );
          })}
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          prevziať z
          <select
            value=""
            onChange={(event) => {
              const source = event.target.value;
              if (source) copyFrom(source as Locale);
            }}
            className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="">vyberte jazyk…</option>
            {locales
              .filter((candidate) => candidate !== locale)
              .map((candidate) => (
                <option key={candidate} value={candidate}>
                  {localeLabels[candidate]}
                </option>
              ))}
          </select>
        </label>
      </div>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
        <label className="block">
          <span className="text-xs font-medium text-slate-700">Názov firmy</span>
          <input
            type="text"
            value={draft.companyName}
            onChange={(event) => patch({ companyName: event.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-slate-700">Adresa</span>
          <textarea
            value={draft.address}
            onChange={(event) => patch({ address: event.target.value })}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />
          <span className="mt-0.5 block text-xs text-slate-400">
            Každý riadok sa v päte zobrazí ako samostatný riadok.
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-slate-700">E-mail</span>
            <input
              type="email"
              value={draft.email}
              onChange={(event) => patch({ email: event.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-700">Telefón</span>
            <input
              type="tel"
              value={draft.phone}
              onChange={(event) => patch({ phone: event.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Identifikačné údaje
          </h2>
          <button
            type="button"
            onClick={() =>
              patch({ identifiers: [...draft.identifiers, { label: "", value: "" }] })
            }
            className="text-xs text-slate-500 underline hover:text-slate-900"
          >
            pridať riadok
          </button>
        </div>
        <p className="text-xs text-slate-400">
          Označenie si zvolíte sami — IČO a DIČ pre slovenskú firmu, HRB a USt-IdNr.
          pre nemeckú. V päte sa vypíšu za sebou.
        </p>

        {draft.identifiers.length === 0 ? (
          <p className="text-sm text-slate-500">Žiadne údaje.</p>
        ) : null}

        {draft.identifiers.map((entry, index) => (
          <div key={index} className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={entry.label}
              onChange={(event) => {
                const next = [...draft.identifiers];
                next[index] = { ...entry, label: event.target.value };
                patch({ identifiers: next });
              }}
              placeholder="IČO"
              aria-label="Označenie"
              className="w-32 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            />
            <input
              type="text"
              value={entry.value}
              onChange={(event) => {
                const next = [...draft.identifiers];
                next[index] = { ...entry, value: event.target.value };
                patch({ identifiers: next });
              }}
              placeholder="46564853"
              aria-label="Hodnota"
              className="min-w-40 flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() =>
                patch({
                  identifiers: draft.identifiers.filter((_, other) => other !== index),
                })
              }
              aria-label="Odstrániť riadok"
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-600"
            >
              ✕
            </button>
          </div>
        ))}
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">Sociálne siete</h2>
          <button
            type="button"
            onClick={() =>
              patch({ social: [...draft.social, { platform: "linkedin", url: "" }] })
            }
            className="text-xs text-slate-500 underline hover:text-slate-900"
          >
            pridať odkaz
          </button>
        </div>
        <p className="text-xs text-slate-400">
          Adresa musí začínať https://. Pri známych sieťach sa v päte zobrazí ikona,
          inak názov siete.
        </p>

        {draft.social.length === 0 ? (
          <p className="text-sm text-slate-500">Žiadne odkazy.</p>
        ) : null}

        {draft.social.map((entry, index) => (
          <div key={index} className="flex flex-wrap items-center gap-2">
            <select
              value={entry.platform}
              onChange={(event) => {
                const next = [...draft.social];
                next[index] = { ...entry, platform: event.target.value };
                patch({ social: next });
              }}
              aria-label="Sieť"
              className="w-36 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            >
              {knownPlatforms.map((platform) => (
                <option key={platform} value={platform}>
                  {platformLabel(platform)}
                </option>
              ))}
              {/* Keeps a platform the code does not know selectable instead of
                  silently rewriting it on the next save. */}
              {knownPlatforms.includes(entry.platform as (typeof knownPlatforms)[number])
                ? null
                : <option value={entry.platform}>{entry.platform}</option>}
            </select>
            <input
              type="url"
              value={entry.url}
              onChange={(event) => {
                const next = [...draft.social];
                next[index] = { ...entry, url: event.target.value };
                patch({ social: next });
              }}
              placeholder="https://www.linkedin.com/company/…"
              aria-label="Adresa"
              className="min-w-56 flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() =>
                patch({ social: draft.social.filter((_, other) => other !== index) })
              }
              aria-label="Odstrániť odkaz"
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-600"
            >
              ✕
            </button>
          </div>
        ))}
      </section>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={busy}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {busy ? "Ukladám…" : `Uložiť ${localeLabels[locale]}`}
        </button>
        <span className="text-xs text-slate-500">
          Ukladá sa jazyk, ktorý máte otvorený.
          {details[locale].updatedAt
            ? ` Naposledy ${new Date(details[locale].updatedAt).toLocaleString("sk-SK")}${
                details[locale].updatedBy ? `, ${details[locale].updatedBy}` : ""
              }.`
            : ""}
        </span>
      </div>
    </div>
  );
}
