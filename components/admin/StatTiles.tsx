import type { Stats } from "@/lib/umami";

type StatTilesProps = {
  stats: Stats;
  active: number;
};

/**
 * The headline numbers. A single number is a stat tile, never a one-bar chart —
 * and the figures use proportional digits, since they do not align in a column.
 */
function change(current: number, previous: number | undefined): string | null {
  if (previous === undefined || previous === 0) return null;
  const delta = Math.round(((current - previous) / previous) * 100);
  if (delta === 0) return "bez zmeny";
  return `${delta > 0 ? "+" : ""}${delta} % oproti predchádzajúcemu obdobiu`;
}

function bounceRate(bounces: number, visits: number): string {
  if (visits === 0) return "—";
  return `${Math.round((bounces / visits) * 100)} %`;
}

export default function StatTiles({ stats, active }: StatTilesProps) {
  const tiles = [
    {
      label: "Zobrazenia",
      value: stats.pageviews.toLocaleString("sk-SK"),
      note: change(stats.pageviews, stats.comparison?.pageviews),
    },
    {
      label: "Návštevníci",
      value: stats.visitors.toLocaleString("sk-SK"),
      note: change(stats.visitors, stats.comparison?.visitors),
    },
    {
      label: "Návštevy",
      value: stats.visits.toLocaleString("sk-SK"),
      note: change(stats.visits, stats.comparison?.visits),
    },
    {
      label: "Odchody bez interakcie",
      value: bounceRate(stats.bounces, stats.visits),
      note: stats.visits === 0 ? null : `z ${stats.visits.toLocaleString("sk-SK")} návštev`,
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {tile.label}
          </div>
          <div className="mt-1 text-3xl font-semibold text-slate-900">{tile.value}</div>
          <div className="mt-1 min-h-4 text-xs text-slate-500">{tile.note ?? ""}</div>
        </div>
      ))}

      {active > 0 ? (
        <p className="text-xs text-slate-500 lg:col-span-4">
          Práve teraz na webe: <strong className="text-slate-900">{active}</strong>
        </p>
      ) : null}
    </section>
  );
}
