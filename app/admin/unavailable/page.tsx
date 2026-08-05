/**
 * Shown when the Supabase environment variables are missing. Without them the
 * tools cannot verify anybody's identity, so they refuse to open at all rather
 * than falling back to unauthenticated access.
 */
export default function AdminUnavailablePage() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="max-w-md space-y-3 text-center">
        <h1 className="text-xl font-semibold">Tooling is not configured</h1>
        <p className="text-sm text-slate-600">
          Set <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="font-mono">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>, then
          reload. Until then the editing tools stay closed.
        </p>
      </div>
    </main>
  );
}
