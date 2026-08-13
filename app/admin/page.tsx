import { notFound } from "next/navigation";
import Link from "next/link";

import MetricList from "@/components/admin/MetricList";
import StatTiles from "@/components/admin/StatTiles";
import TrafficChart from "@/components/admin/TrafficChart";
import { isEditor } from "@/lib/supabase/editors";
import { getEditor } from "@/lib/supabase/server";
import { dashboardConfigured, getDashboardData, ranges, resolveRange } from "@/lib/umami";

type DashboardPageProps = {
  searchParams: Promise<{ range?: string }>;
};

/**
 * Traffic overview. One filter row above everything it scopes, so the range
 * applies to the tiles, the chart and all three lists at once.
 */
export default async function AdminDashboardPage({ searchParams }: DashboardPageProps) {
  const editor = await getEditor();
  if (!isEditor(editor?.email)) notFound();

  const { range: rangeParam } = await searchParams;
  const range = resolveRange(rangeParam);
  const data = await getDashboardData(range);

  return (
    <main className="mx-auto max-w-400 space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Prehľad návštevnosti</h1>
          <p className="mt-1 text-sm text-slate-500">
            Údaje z Umami, bez cookies a bez osobných údajov. Obnovujú sa každých päť
            minút.
          </p>
        </div>

        <nav aria-label="Obdobie" className="flex gap-1">
          {ranges.map((entry) => (
            <Link
              key={entry.key}
              href={`/admin?range=${entry.key}`}
              aria-current={entry.key === range ? "true" : undefined}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                entry.key === range
                  ? "bg-slate-900 text-white"
                  : "border border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {entry.label}
            </Link>
          ))}
        </nav>
      </div>

      {!dashboardConfigured ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Prehľad nie je nastavený. Doplňte <code>UMAMI_API_KEY</code> a{" "}
          <code>UMAMI_WEBSITE_ID</code> do prostredia.
        </p>
      ) : !data ? (
        <p className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
          Údaje sa nepodarilo načítať. Skontrolujte platnosť API kľúča v Umami.
        </p>
      ) : (
        <>
          <StatTiles stats={data.stats} active={data.active} />

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900">Vývoj v čase</h2>
            {data.stats.pageviews === 0 ? (
              <p className="mt-3 text-xs text-slate-500">
                Za zvolené obdobie zatiaľ nie sú žiadne návštevy. Meranie beží až na
                produkčných doménach — z vývoja a preview sa dáta neposielajú.
              </p>
            ) : (
              <div className="mt-3">
                <TrafficChart series={data.series} />
              </div>
            )}
          </section>

          <div className="grid gap-3 lg:grid-cols-3">
            <MetricList
              title="Najčastejšie stránky"
              rows={data.pages}
              emptyLabel="Zatiaľ bez údajov."
            />
            <MetricList
              title="Odkiaľ prichádzajú"
              rows={data.referrers}
              emptyLabel="Zatiaľ bez údajov."
            />
            <MetricList
              title="Krajiny"
              rows={data.countries}
              emptyLabel="Zatiaľ bez údajov."
            />
          </div>
        </>
      )}
    </main>
  );
}
