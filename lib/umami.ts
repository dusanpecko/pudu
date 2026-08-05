/**
 * Read-only Umami client for the admin dashboard.
 *
 * `UMAMI_API_KEY` has no `NEXT_PUBLIC_` prefix on purpose: the key can read every
 * website in the account, so it must never reach the browser. Every function here
 * runs on the server and the dashboard receives only the numbers.
 *
 * The website id is kept separate from the tracking variable. Tracking is enabled
 * by `NEXT_PUBLIC_UMAMI_WEBSITE_ID` in production only, while the dashboard reads
 * `UMAMI_WEBSITE_ID` — so statistics can be viewed from any environment without
 * that environment also counting itself.
 */
const API_BASE = process.env.UMAMI_API_BASE ?? "https://api.umami.is/v1";
const API_KEY = process.env.UMAMI_API_KEY ?? "";
const WEBSITE_ID =
  process.env.UMAMI_WEBSITE_ID ?? process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ?? "";

export const dashboardConfigured = Boolean(API_KEY && WEBSITE_ID);

/** How long a dashboard response is reused before the API is asked again. */
const REVALIDATE_SECONDS = 300;

export type RangeKey = "7d" | "30d" | "90d";

export const ranges: { key: RangeKey; days: number; label: string }[] = [
  { key: "7d", days: 7, label: "7 dní" },
  { key: "30d", days: 30, label: "30 dní" },
  { key: "90d", days: 90, label: "90 dní" },
];

export function resolveRange(value: string | undefined): RangeKey {
  return ranges.some((range) => range.key === value) ? (value as RangeKey) : "30d";
}

export type Totals = {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
};

export type Stats = Totals & { comparison: Totals | null };

export type SeriesPoint = { date: string; pageviews: number; visitors: number };

export type MetricRow = { label: string; value: number };

export type DashboardData = {
  stats: Stats;
  series: SeriesPoint[];
  pages: MetricRow[];
  referrers: MetricRow[];
  countries: MetricRow[];
  active: number;
};

type UmamiTotals = Partial<Totals> & { comparison?: Partial<Totals> };
type UmamiSeries = { pageviews?: { x: string; y: number }[]; sessions?: { x: string; y: number }[] };
type UmamiMetric = { x: string | null; y: number };

async function request<T>(path: string): Promise<T | null> {
  if (!dashboardConfigured) return null;

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { "x-umami-api-key": API_KEY, accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    // A dashboard is not worth an error page; the caller renders a notice.
    return null;
  }
}

function totals(source: Partial<Totals> | undefined): Totals {
  return {
    pageviews: source?.pageviews ?? 0,
    visitors: source?.visitors ?? 0,
    visits: source?.visits ?? 0,
    bounces: source?.bounces ?? 0,
    totaltime: source?.totaltime ?? 0,
  };
}

function toRows(rows: UmamiMetric[] | null, fallbackLabel: string): MetricRow[] {
  if (!rows) return [];
  return rows
    .filter((row) => typeof row.y === "number")
    .map((row) => ({ label: row.x?.trim() || fallbackLabel, value: row.y }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

/**
 * Merges the pageview and session series into one list of days. Umami returns
 * only the days that have data, so missing days are filled with zero — a gap in a
 * time series would otherwise read as "no data collected" rather than "nobody
 * visited".
 *
 * The current day is left out: a partial bucket plots as a plunge to the floor and
 * reads as a collapse in traffic rather than as a day still in progress. Today is
 * included in the headline totals, where it cannot mislead.
 */
function toSeries(source: UmamiSeries | null, from: Date, to: Date): SeriesPoint[] {
  const today = new Date().toISOString().slice(0, 10);
  const byDay = new Map<string, SeriesPoint>();

  for (let day = new Date(from); day <= to; day.setUTCDate(day.getUTCDate() + 1)) {
    const key = day.toISOString().slice(0, 10);
    byDay.set(key, { date: key, pageviews: 0, visitors: 0 });
  }

  for (const point of source?.pageviews ?? []) {
    const key = point.x.slice(0, 10);
    const entry = byDay.get(key);
    if (entry) entry.pageviews = point.y;
  }
  for (const point of source?.sessions ?? []) {
    const key = point.x.slice(0, 10);
    const entry = byDay.get(key);
    if (entry) entry.visitors = point.y;
  }

  return [...byDay.values()].filter((point) => point.date !== today);
}

export async function getDashboardData(range: RangeKey): Promise<DashboardData | null> {
  if (!dashboardConfigured) return null;

  const days = ranges.find((entry) => entry.key === range)?.days ?? 30;
  const to = new Date();
  const from = new Date(to.getTime() - days * 86_400_000);
  const window = `startAt=${from.getTime()}&endAt=${to.getTime()}`;
  const site = `/websites/${WEBSITE_ID}`;

  const [stats, series, pages, referrers, countries, active] = await Promise.all([
    request<UmamiTotals>(`${site}/stats?${window}`),
    request<UmamiSeries>(
      `${site}/pageviews?${window}&unit=day&timezone=Europe%2FBratislava`,
    ),
    request<UmamiMetric[]>(`${site}/metrics?${window}&type=url`),
    request<UmamiMetric[]>(`${site}/metrics?${window}&type=referrer`),
    request<UmamiMetric[]>(`${site}/metrics?${window}&type=country`),
    request<{ visitors: number }>(`${site}/active`),
  ]);

  if (!stats) return null;

  return {
    stats: {
      ...totals(stats),
      comparison: stats.comparison ? totals(stats.comparison) : null,
    },
    series: toSeries(series, from, to),
    pages: toRows(pages, "(bez cesty)"),
    referrers: toRows(referrers, "Priame návštevy"),
    countries: toRows(countries, "Neznáme"),
    active: active?.visitors ?? 0,
  };
}
