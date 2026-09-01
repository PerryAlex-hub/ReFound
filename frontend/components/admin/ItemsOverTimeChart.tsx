'use client';

import { useState } from 'react';

interface ChartSeries {
  label: string;
  color: string;
  value: number;
}

interface ItemsOverTimeChartProps {
  series: ChartSeries[];
  days?: string[];
}

const DEFAULT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const WIDTH = 840;
const HEIGHT = 260;
const PAD_LEFT = 36;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 32;

// Dependency-free inline SVG chart — no charting library is installed.
// The API has no time-series endpoint, so each series is rendered as a flat
// reference line at its real current total (see caption below the chart).
export function ItemsOverTimeChart({ series, days = DEFAULT_DAYS }: ItemsOverTimeChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const maxVal = Math.max(1, ...series.map((s) => s.value)) * 1.2;
  const plotW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const xFor = (i: number) => PAD_LEFT + (days.length === 1 ? plotW / 2 : (i / (days.length - 1)) * plotW);
  const yFor = (v: number) => PAD_TOP + plotH - (v / maxVal) * plotH;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <p className="text-base font-extrabold text-[#111827]">Items Over Time</p>
        <div className="flex items-center gap-4">
          {series.map((s) => (
            <span key={s.label} className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" role="img" aria-label="Items over time chart">
        {/* Gridlines */}
        {gridLines.map((g) => {
          const y = PAD_TOP + plotH * (1 - g);
          return (
            <line
              key={g}
              x1={PAD_LEFT}
              x2={WIDTH - PAD_RIGHT}
              y1={y}
              y2={y}
              stroke="#F1F2F6"
              strokeWidth={1}
            />
          );
        })}

        {/* Hover columns */}
        {days.map((_, i) => (
          <rect
            key={i}
            x={xFor(i) - plotW / days.length / 2}
            y={PAD_TOP}
            width={plotW / days.length}
            height={plotH}
            fill="transparent"
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx((cur) => (cur === i ? null : cur))}
          />
        ))}

        {/* Crosshair */}
        {hoverIdx !== null && (
          <line
            x1={xFor(hoverIdx)}
            x2={xFor(hoverIdx)}
            y1={PAD_TOP}
            y2={PAD_TOP + plotH}
            stroke="#D1D5DB"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
        )}

        {/* Series lines + markers */}
        {series.map((s) => {
          const y = yFor(s.value);
          const points = days.map((_, i) => `${xFor(i)},${y}`).join(' ');
          return (
            <g key={s.label}>
              <polyline
                points={points}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {days.map((_, i) => (
                <circle
                  key={i}
                  cx={xFor(i)}
                  cy={y}
                  r={hoverIdx === i ? 5 : 3.5}
                  fill={s.color}
                  stroke="white"
                  strokeWidth={1.5}
                />
              ))}
            </g>
          );
        })}

        {/* X axis labels */}
        {days.map((d, i) => (
          <text
            key={d}
            x={xFor(i)}
            y={HEIGHT - 8}
            textAnchor="middle"
            fontSize={11}
            fill="#9CA3AF"
            fontWeight={600}
          >
            {d}
          </text>
        ))}

        {/* Tooltip */}
        {hoverIdx !== null && (
          <g transform={`translate(${Math.min(Math.max(xFor(hoverIdx) - 60, PAD_LEFT), WIDTH - PAD_RIGHT - 120)}, ${PAD_TOP + 4})`}>
            <rect width={120} height={20 + series.length * 16} rx={8} fill="#111827" opacity={0.92} />
            <text x={10} y={14} fontSize={10} fill="#D1D5DB" fontWeight={700}>{days[hoverIdx]}</text>
            {series.map((s, si) => (
              <text key={s.label} x={10} y={30 + si * 16} fontSize={10} fill="white" fontWeight={600}>
                {s.label}: {s.value}
              </text>
            ))}
          </g>
        )}
      </svg>

      <p className="text-xs text-gray-400 italic mt-2">
        Showing current period totals — a day-by-day trend isn&apos;t tracked by the API yet.
      </p>
    </div>
  );
}
