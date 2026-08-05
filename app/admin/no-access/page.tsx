import { signOut } from "@/app/admin/actions";

/**
 * A signed-in account that is not on the editor allowlist lands here. Shown
 * instead of the tooling, with no hint about what the allowlist contains.
 */
export default function AdminNoAccessPage() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold">Prístup zamietnutý</h1>
        <p className="text-sm text-slate-600">
          Toto konto nemá povolenie upravovať obsah. Ak si myslíte, že ide o omyl,
          ozvite sa správcovi webu.
        </p>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            Odhlásiť sa
          </button>
        </form>
      </div>
    </main>
  );
}
