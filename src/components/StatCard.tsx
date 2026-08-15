import type { ReactNode } from 'react';
import { classNames } from '@/lib/format';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  sublabel?: string;
  trend?: { value: string; positive: boolean };
  sparkData?: number[];
  sparkColor?: string;
  accent?: string;
  delay?: number;
  className?: string;
}

export function StatCard({ icon, label, value, sublabel, trend, sparkData, sparkColor = '#10b981', accent = 'bg-brand-50 text-brand-600', delay, className }: StatCardProps) {
  return (
    <div className={classNames('card-premium p-5 sm:p-6 animate-slide-up', className)} style={delay ? { animationDelay: `${delay}ms` } : undefined}>
      <div className="flex items-start justify-between mb-3">
        <div className={classNames('w-11 h-11 rounded-xl flex items-center justify-center', accent)}>
          {icon}
        </div>
        {trend && (
          <span className={classNames(
            'inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full',
            trend.positive ? 'text-success-700 bg-success-50' : 'text-danger-700 bg-danger-50',
          )}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d={trend.positive ? 'M4.5 15.75l7.5-7.5 7.5 7.5' : 'M19.5 8.25l-7.5 7.5-7.5-7.5'} />
            </svg>
            {trend.value}
          </span>
        )}
      </div>
      <div className="text-2xl sm:text-3xl font-display font-extrabold text-ink-900 tracking-tight">{value}</div>
      <div className="text-sm text-ink-500 mt-1 font-medium">{label}</div>
      {sublabel && <div className="text-xs text-ink-400 mt-0.5">{sublabel}</div>}
      {sparkData && (
        <div className="mt-4 -mb-1">
          <svg viewBox="0 0 120 36" className="w-full h-9" preserveAspectRatio="none">
            <defs>
              <linearGradient id={`spark-${label.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={sparkColor} stopOpacity={0.2} />
                <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            {(() => {
              const max = Math.max(...sparkData, 1), min = Math.min(...sparkData, 0);
              const x = (i: number) => (120 / Math.max(sparkData.length - 1, 1)) * i;
              const y = (v: number) => 36 - ((v - min) / Math.max(max - min, 1)) * 32 - 2;
              const path = sparkData.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');
              return <>
                <path d={`${path} L 120 36 L 0 36 Z`} fill={`url(#spark-${label.replace(/\s/g, '')})`} />
                <path d={path} fill="none" stroke={sparkColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </>;
            })()}
          </svg>
        </div>
      )}
    </div>
  );
}
