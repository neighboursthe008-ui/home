import { useState } from 'react';
import type { ChartPoint } from '@/types';
import { formatCompactKES, formatKES, classNames } from '@/lib/format';

// ── Area / line chart with interactive hover ──
export function AreaChart({ data, height = 220 }: { data: ChartPoint[]; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const w = 800, h = height, pad = { t: 20, r: 20, b: 32, l: 60 };
  const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = 0;

  const x = (i: number) => pad.l + (cw / Math.max(data.length - 1, 1)) * i;
  const y = (v: number) => pad.t + ch - ((v - min) / (max - min)) * ch;

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.value)}`).join(' ');
  const areaPath = `${linePath} L ${x(data.length - 1)} ${pad.t + ch} L ${x(0)} ${pad.t + ch} Z`;

  const yTicks = 4;
  const tickVals = Array.from({ length: yTicks + 1 }, (_, i) => (max / yTicks) * i);

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {tickVals.map((tv, i) => (
          <g key={i}>
            <line x1={pad.l} y1={y(tv)} x2={w - pad.r} y2={y(tv)} stroke="#f1f5f9" strokeWidth={1} />
            <text x={pad.l - 8} y={y(tv) + 4} textAnchor="end" className="fill-ink-400" fontSize={11} fontFamily="Plus Jakarta Sans">
              {formatCompactKES(tv).replace('KES ', '')}
            </text>
          </g>
        ))}

        {/* Area + line */}
        <path d={areaPath} fill="url(#areaFill)" />
        <path d={linePath} fill="none" stroke="url(#lineStroke)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

        {/* X labels */}
        {data.map((d, i) => (
          <text key={i} x={x(i)} y={h - 10} textAnchor="middle" className="fill-ink-400" fontSize={11} fontFamily="Plus Jakarta Sans">
            {d.label}
          </text>
        ))}

        {/* Hover overlay */}
        {data.map((d, i) => (
          <rect
            key={`ov-${i}`}
            x={x(i) - cw / data.length / 2}
            y={0}
            width={cw / data.length}
            height={h}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}

        {/* Hover point */}
        {hover !== null && (
          <g>
            <line x1={x(hover)} y1={pad.t} x2={x(hover)} y2={pad.t + ch} stroke="#10b981" strokeWidth={1} strokeDasharray="4 4" opacity={0.5} />
            <circle cx={x(hover)} cy={y(data[hover].value)} r={6} fill="#10b981" stroke="white" strokeWidth={2.5} />
          </g>
        )}
      </svg>

      {/* Tooltip */}
      {hover !== null && (
        <div
          className="absolute pointer-events-none bg-ink-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg -translate-x-1/2 -translate-y-full"
          style={{
            left: `${(x(hover) / w) * 100}%`,
            top: `${(y(data[hover].value) / h) * 100}%`,
          }}
        >
          <div className="font-semibold">{data[hover].label}</div>
          <div className="text-brand-300 mt-0.5">{formatKES(data[hover].value)}</div>
          <div className="text-ink-400">{data[hover].count} contributions</div>
        </div>
      )}
    </div>
  );
}

// ── Bar chart ──
export function BarChart({ data, height = 220 }: { data: ChartPoint[]; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const w = 800, h = height, pad = { t: 20, r: 20, b: 32, l: 60 };
  const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;
  const max = Math.max(...data.map((d) => d.value), 1);
  const barW = (cw / data.length) * 0.6;
  const gap = (cw / data.length) * 0.4;

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" preserveAspectRatio="none">
        <defs>
          <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        {Array.from({ length: 5 }).map((_, i) => {
          const tv = (max / 4) * i;
          const yy = pad.t + ch - (tv / max) * ch;
          return (
            <g key={i}>
              <line x1={pad.l} y1={yy} x2={w - pad.r} y2={yy} stroke="#f1f5f9" strokeWidth={1} />
              <text x={pad.l - 8} y={yy + 4} textAnchor="end" className="fill-ink-400" fontSize={11} fontFamily="Plus Jakarta Sans">
                {formatCompactKES(tv).replace('KES ', '')}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const bh = (d.value / max) * ch;
          const bx = pad.l + i * (barW + gap) + gap / 2;
          const by = pad.t + ch - bh;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={bx} y={by} width={barW} height={bh} rx={6} fill="url(#barFill)" opacity={hover === null || hover === i ? 1 : 0.4} className="transition-opacity" />
              <text x={bx + barW / 2} y={h - 10} textAnchor="middle" className="fill-ink-400" fontSize={11} fontFamily="Plus Jakarta Sans">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div
          className="absolute pointer-events-none bg-ink-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg -translate-x-1/2 -translate-y-full"
          style={{ left: `${((pad.l + hover * (barW + gap) + gap / 2 + barW / 2) / w) * 100}%`, top: `${((pad.t + ch - (data[hover].value / max) * ch) / h) * 100}%` }}
        >
          <div className="font-semibold">{data[hover].label}</div>
          <div className="text-brand-300 mt-0.5">{formatKES(data[hover].value)}</div>
          <div className="text-ink-400">{data[hover].count} contributions</div>
        </div>
      )}
    </div>
  );
}

// ── Donut chart ──
export function DonutChart({ segments, size = 180 }: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = size / 2 - 16, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const colorMap: Record<string, string> = {
    'bg-brand-500': '#10b981', 'bg-secondary-500': '#14b8a6', 'bg-accent-500': '#f59e0b',
    'bg-sky-500': '#0ea5e9', 'bg-success-500': '#22c55e', 'bg-ink-400': '#94a3b8',
  };

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={14} />
        {segments.map((s, i) => {
          const dash = (s.value / total) * circ;
          const el = (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={colorMap[s.color] ?? '#10b981'}
              strokeWidth={14}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              strokeLinecap="round"
            />
          );
          offset += dash;
          return el;
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-ink-900 font-display font-bold" fontSize={22} fontFamily="Sora">
          {total.toLocaleString()}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" className="fill-ink-400" fontSize={12} fontFamily="Plus Jakarta Sans">
          Total
        </text>
      </svg>
      <div className="space-y-2.5">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className={classNames('w-3 h-3 rounded-full shrink-0', s.color)} />
            <span className="text-sm text-ink-600 font-medium">{s.label}</span>
            <span className="text-sm font-bold text-ink-900 ml-auto">{s.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Mini sparkline for cards ──
export function Sparkline({ data, color = '#10b981', className }: { data: number[]; color?: string; className?: string }) {
  const w = 120, h = 36, max = Math.max(...data, 1), min = Math.min(...data, 0);
  const x = (i: number) => (w / Math.max(data.length - 1, 1)) * i;
  const y = (v: number) => h - ((v - min) / Math.max(max - min, 1)) * h;
  const path = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={classNames('w-full h-auto', className)} preserveAspectRatio="none">
      <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill={color} fillOpacity={0.12} />
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
