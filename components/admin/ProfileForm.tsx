"use client";

import { useActionState } from "react";

import { changePassword, type ProfileState } from "@/app/admin/profile/actions";

const FIELD =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500";
const LABEL = "text-xs font-medium uppercase tracking-wide text-slate-500";

const IDLE: ProfileState = { status: "ok", message: "" };

export default function ProfileForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(changePassword, IDLE);

  return (
    <main className="mx-auto max-w-lg space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Profil</h1>
        <p className="mt-1 text-sm text-slate-500">
          Prihlásený ako <span className="font-medium text-slate-700">{email}</span>.
        </p>
      </header>

      <form
        action={action}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"
      >
        <h2 className="text-sm font-semibold text-slate-900">Zmeniť heslo</h2>

        <label className="block space-y-1">
          <span className={LABEL}>Doterajšie heslo</span>
          <input
            name="current"
            type="password"
            autoComplete="current-password"
            required
            className={FIELD}
          />
        </label>

        <label className="block space-y-1">
          <span className={LABEL}>Nové heslo</span>
          <input
            name="next"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className={FIELD}
          />
          <span className="block text-xs text-slate-500">Aspoň 8 znakov.</span>
        </label>

        <label className="block space-y-1">
          <span className={LABEL}>Nové heslo znova</span>
          <input
            name="repeat"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className={FIELD}
          />
        </label>

        {state.message ? (
          <p
            className={`rounded-lg px-3 py-2 text-sm ${
              state.status === "error"
                ? "bg-rose-50 text-rose-900"
                : "bg-emerald-50 text-emerald-900"
            }`}
          >
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Ukladám…" : "Zmeniť heslo"}
        </button>
      </form>
    </main>
  );
}
