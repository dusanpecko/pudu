import type { MetricRow } from "@/lib/umami";

type MetricListProps = {
  title: string;
  rows: MetricRow[];
  emptyLabel: string;
};

/**
 * Ranked list with a proportional bar. One series, so no legend — the heading
 * names what is plotted. The value sits at the end of each row, which keeps every
 * number readable without hovering.
 */
export default function MetricList({ title, rows, emptyLabel }: MetricListProps) {
  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>

      {rows.length === 0 ? (
        <p className="mt-3 text-xs text-slate-500">{emptyLabel}</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {rows.map((row) => (
            <li key={row.label} className="space-y-1">
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="truncate text-slate-700" title={row.label}>
                  {row.label}
                </span>
                <span className="tabular-nums text-slate-500">{row.value}</span>
              </div>
              <div
                className="h-1 rounded-full"
                style={{
                  width: `${Math.max(4, (row.value / max) * 100)}%`,
                  background: "#2a78d6",
                }}
              />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
