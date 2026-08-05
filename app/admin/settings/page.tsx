import { notFound } from "next/navigation";

import SmtpSettingsForm from "@/components/admin/SmtpSettingsForm";
import { loadSmtpSettings, toView } from "@/lib/smtp-settings";
import { isEditor } from "@/lib/supabase/editors";
import { getEditor } from "@/lib/supabase/server";

/**
 * Outgoing mail settings. The stored password is never sent to the browser — the
 * form only learns whether one exists.
 */
export default async function AdminSettingsPage() {
  const editor = await getEditor();
  if (!isEditor(editor?.email)) notFound();

  const settings = await loadSmtpSettings();

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nastavenia e-mailu</h1>
        <p className="mt-1 text-sm text-slate-500">
          Odtiaľto web odosiela dopyty z kontaktného formulára. Údaje sú uložené v
          databáze, takže zmena nevyžaduje nasadenie novej verzie.
        </p>
      </div>

      {settings.ok ? (
        <SmtpSettingsForm settings={toView(settings.data)} />
      ) : (
        <div className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Nastavenia sa nedajú načítať.</p>
          <p>{settings.message}</p>
          {settings.reason === "missing-table" ? (
            <p className="text-xs">
              Spustite <code>npm run db:migrate</code> s premennou{" "}
              <code>SUPABASE_DB_URL</code>, alebo vložte obsah{" "}
              <code>supabase/migrations/0001_smtp_settings.sql</code> do SQL editora v
              Supabase.
            </p>
          ) : null}
        </div>
      )}
    </main>
  );
}
