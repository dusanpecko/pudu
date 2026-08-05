"use client";

import { useActionState, useState, useTransition } from "react";

import { saveSettings, sendTest, type ActionState } from "@/app/admin/settings/actions";
import type { SmtpSettingsView } from "@/lib/smtp-settings";

type SmtpSettingsFormProps = {
  settings: SmtpSettingsView;
};

const INITIAL: ActionState = { status: "idle", message: "" };

const FIELD =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500";
const LABEL = "text-xs font-medium uppercase tracking-wide text-slate-500";

function Notice({ state }: { state: ActionState }) {
  if (state.status === "idle" || !state.message) return null;

  const failed = state.status === "error";
  return (
    <p
      role="status"
      aria-live="polite"
      className={`rounded-lg border px-3 py-2 text-sm ${
        failed
          ? "border-rose-300 bg-rose-50 text-rose-900"
          : "border-emerald-300 bg-emerald-50 text-emerald-900"
      }`}
    >
      {state.message}
    </p>
  );
}

export default function SmtpSettingsForm({ settings }: SmtpSettingsFormProps) {
  const [state, formAction, pending] = useActionState(saveSettings, INITIAL);
  const [testState, setTestState] = useState<ActionState>(INITIAL);
  const [testing, startTest] = useTransition();

  const runTest = () => {
    startTest(async () => {
      setTestState(await sendTest());
    });
  };

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-5">
        <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={settings.enabled}
            className="mt-0.5"
          />
          <span>
            <span className="block text-sm font-medium text-slate-900">
              Odosielanie e-mailov je zapnuté
            </span>
            <span className="block text-xs text-slate-500">
              Keď je vypnuté, web e-maily neodosiela ani sa o to nepokúša.
            </span>
          </span>
        </label>

        <fieldset className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <legend className="px-1 text-sm font-semibold text-slate-900">
            Server odchádzajúcej pošty
          </legend>

          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <label className="space-y-1">
              <span className={LABEL}>Server (SMTP host)</span>
              <input
                name="host"
                defaultValue={settings.host}
                placeholder="smtp.firma.sk"
                className={FIELD}
              />
            </label>
            <label className="space-y-1">
              <span className={LABEL}>Port</span>
              <input
                name="port"
                type="number"
                min={1}
                max={65535}
                defaultValue={settings.port}
                className={FIELD}
              />
            </label>
          </div>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="secure"
              defaultChecked={settings.secure}
              className="mt-0.5"
            />
            <span className="text-sm text-slate-700">
              Šifrované spojenie od začiatku (SSL/TLS)
              <span className="block text-xs text-slate-500">
                Zapnite pre port 465. Pre port 587 nechajte vypnuté — spojenie sa
                zašifruje cez STARTTLS.
              </span>
            </span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className={LABEL}>Prihlasovacie meno</span>
              <input
                name="username"
                defaultValue={settings.username}
                autoComplete="off"
                className={FIELD}
              />
            </label>
            <label className="space-y-1">
              <span className={LABEL}>Heslo</span>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder={
                  settings.hasPassword ? "uložené — nechajte prázdne" : "zadajte heslo"
                }
                className={FIELD}
              />
              <span className="block text-xs text-slate-500">
                {settings.hasPassword
                  ? "Uložené heslo sa nikdy nezobrazuje. Prázdne pole ho ponechá."
                  : "Heslo ešte nie je uložené."}
              </span>
            </label>
          </div>
        </fieldset>

        <fieldset className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <legend className="px-1 text-sm font-semibold text-slate-900">
            Odosielateľ a príjemcovia
          </legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className={LABEL}>Meno odosielateľa</span>
              <input
                name="fromName"
                defaultValue={settings.fromName}
                placeholder="PUDU Industrial"
                className={FIELD}
              />
            </label>
            <label className="space-y-1">
              <span className={LABEL}>Adresa odosielateľa</span>
              <input
                name="fromEmail"
                type="email"
                defaultValue={settings.fromEmail}
                placeholder="web@firma.sk"
                className={FIELD}
              />
            </label>
          </div>

          <label className="space-y-1">
            <span className={LABEL}>Adresa pre odpoveď (nepovinné)</span>
            <input
              name="replyTo"
              type="email"
              defaultValue={settings.replyTo}
              className={FIELD}
            />
          </label>

          <label className="space-y-1">
            <span className={LABEL}>Príjemcovia dopytov</span>
            <input
              name="recipients"
              defaultValue={settings.recipients}
              placeholder="obchod@firma.sk, druhy@firma.sk"
              className={FIELD}
            />
            <span className="block text-xs text-slate-500">
              Viac adries oddeľte čiarkou.
            </span>
          </label>
        </fieldset>

        <Notice state={state} />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {pending ? "Ukládám…" : "Uložiť nastavenia"}
          </button>

          {settings.updatedAt ? (
            <span className="text-xs text-slate-500">
              Naposledy zmenené{" "}
              {new Date(settings.updatedAt).toLocaleString("sk-SK", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              {settings.updatedBy ? ` — ${settings.updatedBy}` : ""}
            </span>
          ) : null}
        </div>
      </form>

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Overiť nastavenie</h2>
          <p className="mt-1 text-xs text-slate-500">
            Odošle testovací e-mail na adresu, s ktorou ste prihlásený. Uložte
            nastavenia predtým, než test spustíte.
          </p>
        </div>

        <Notice state={testState} />

        <button
          type="button"
          onClick={runTest}
          disabled={testing}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:opacity-50"
        >
          {testing ? "Odosielam…" : "Odoslať testovací e-mail"}
        </button>
      </div>
    </div>
  );
}
