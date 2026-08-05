"use client";

import { useState } from "react";

import type { SeriesPoint } from "@/lib/umami";

type TrafficChartProps = {
  series: SeriesPoint[];
};

/**
 * Pageviews and visitors over time. Two series of the same unit, so they share
 * one axis — never a second scale.
 *
 * Palette: categorical slots 1 and 2 of the reference palette, validated against
 * the white card surface (all five checks pass, worst pair ΔE 24.7 protan). The
 * admin tooling is light-only, so no dark steps are declared.
 */
const SERIES = [
  { key: "pageviews" as const, label: "Zobrazenia", color: "#2a78d6" },
  { key: "visitors" as const, label: "Návštevníci", color: "#eb6834" },
];

const WIDTH = 760;
const HEIGHT = 200;
const PADDING = { top: 16, right: 16, bottom: 28, left: 44 };

/** Rounds an axis maximum up to a clean number. */
function niceMax(value: number): number {
  if (value <= 5) return 5;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
}

function formatDay(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(day)}. ${Number(month)}.`;
}

export default function TrafficChart({ series }: TrafficChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const peak = Math.max(
    ...series.flatMap((point) => [point.pageviews, point.visitors]),
    0,
  );
  const max = niceMax(peak);
  const ticks = [0, max / 2, max];

  const x = (index: number) =>
    series.length <= 1
      ? PADDING.left + plotWidth / 2
      : PADDING.left + (index / (series.length - 1)) * plotWidth;
  const y = (value: number) => PADDING.top + plotHeight - (value / max) * plotHeight;

  const path = (key: "pageviews" | "visitors") =>
    series.map((point, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(point[key])}`).join(" ");

  const area = (key: "pageviews" | "visitors") =>
    `${path(key)} L${x(series.length - 1)},${PADDING.top + plotHeight} L${x(0)},${
      PADDING.top + plotHeight
    } Z`;

  // Every third label at most, so the axis never collides with itself.
  const labelStep = Math.max(1, Math.ceil(series.length / 8));
  const point = hovered === null ? null : series[hovered];

  return (
    <figure className="m-0 space-y-3">
      <figcaption className="text-xs text-slate-500">
        Celé dni; dnešok sa počíta do súhrnných čísel vyššie.
      </figcaption>

      <div className="flex items-center gap-4 text-xs text-slate-600">
        {SERIES.map((entry) => (
          <span key={entry.key} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block h-0.5 w-4 rounded-full"
              style={{ background: entry.color }}
            />
            {entry.label}
          </span>
        ))}
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          role="img"
          aria-label="Zobrazenia a návštevníci v čase"
          onPointerLeave={() => setHovered(null)}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={y(tick)}
                y2={y(tick)}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              <text
                x={PADDING.left - 8}
                y={y(tick) + 4}
                textAnchor="end"
                className="fill-slate-500 text-[10px] tabular-nums"
              >
                {Math.round(tick)}
              </text>
            </g>
          ))}

          {SERIES.map((entry) => (
            <g key={entry.key}>
              <path d={area(entry.key)} fill={entry.color} opacity="0.1" />
              <path
                d={path(entry.key)}
                fill="none"
                stroke={entry.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ))}

          {series.map((item, index) =>
            index % labelStep === 0 ? (
              <text
                key={item.date}
                x={x(index)}
                y={HEIGHT - 8}
                textAnchor="middle"
                className="fill-slate-500 text-[10px]"
              >
                {formatDay(item.date)}
              </text>
            ) : null,
          )}

          {/* End markers with a 2px surface ring, so they stay legible where the
              two series cross. */}
          {series.length > 0
            ? SERIES.map((entry) => (
                <circle
                  key={entry.key}
                  cx={x(series.length - 1)}
                  cy={y(series[series.length - 1][entry.key])}
                  r="4"
                  fill={entry.color}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              ))
            : null}

          {hovered !== null && point ? (
            <g>
              <line
                x1={x(hovered)}
                x2={x(hovered)}
                y1={PADDING.top}
                y2={PADDING.top + plotHeight}
                stroke="#94a3b8"
                strokeWidth="1"
              />
              {SERIES.map((entry) => (
                <circle
                  key={entry.key}
                  cx={x(hovered)}
                  cy={y(point[entry.key])}
                  r="4"
                  fill={entry.color}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              ))}
            </g>
          ) : null}

          {/* Hit bands span the full column height, so hovering never requires
              landing on the line itself. */}
          {series.map((item, index) => (
            <rect
              key={`hit-${item.date}`}
              x={x(index) - plotWidth / Math.max(series.length - 1, 1) / 2}
              y={PADDING.top}
              width={plotWidth / Math.max(series.length - 1, 1)}
              height={plotHeight}
              fill="transparent"
              onPointerEnter={() => setHovered(index)}
            />
          ))}
        </svg>

        {point ? (
          <div
            className="pointer-events-none absolute top-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm"
            style={{
              left: `${(x(hovered ?? 0) / WIDTH) * 100}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="font-medium text-slate-900">{formatDay(point.date)}</div>
            {SERIES.map((entry) => (
              <div key={entry.key} className="flex items-center gap-1.5 text-slate-600">
                <span
                  aria-hidden="true"
                  className="inline-block size-2 rounded-full"
                  style={{ background: entry.color }}
                />
                {entry.label}: <span className="tabular-nums">{point[entry.key]}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* The table is the accessible twin of the chart: every value is readable
          without hovering. */}
      <details className="text-xs text-slate-600">
        <summary className="cursor-pointer select-none">Zobraziť ako tabuľku</summary>
        <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-slate-200">
          <table className="w-full border-collapse text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-1.5 font-medium">Deň</th>
                <th className="px-3 py-1.5 font-medium">Zobrazenia</th>
                <th className="px-3 py-1.5 font-medium">Návštevníci</th>
              </tr>
            </thead>
            <tbody>
              {series.map((item) => (
                <tr key={item.date} className="border-t border-slate-100">
                  <td className="px-3 py-1.5">{item.date}</td>
                  <td className="px-3 py-1.5 tabular-nums">{item.pageviews}</td>
                  <td className="px-3 py-1.5 tabular-nums">{item.visitors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
