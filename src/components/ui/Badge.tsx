import type { ReactNode } from 'react';
import { classNames } from '@/lib/format';

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent' | 'secondary';

const tones: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  success: 'bg-success-50 text-success-700 ring-success-200',
  warning: 'bg-warning-50 text-warning-700 ring-warning-200',
  danger: 'bg-danger-50 text-danger-700 ring-danger-200',
  info: 'bg-sky-50 text-sky-700 ring-sky-200',
  neutral: 'bg-ink-100 text-ink-600 ring-ink-200',
  accent: 'bg-accent-50 text-accent-700 ring-accent-200',
  secondary: 'bg-secondary-50 text-secondary-700 ring-secondary-200',
};

const dotTones: Record<Tone, string> = {
  brand: 'bg-brand-500', success: 'bg-success-500', warning: 'bg-warning-500',
  danger: 'bg-danger-500', info: 'bg-sky-500', neutral: 'bg-ink-400',
  accent: 'bg-accent-500', secondary: 'bg-secondary-500',
};

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, tone = 'neutral', dot, size = 'sm', className }: BadgeProps) {
  return (
    <span className={classNames(
      'inline-flex items-center gap-1.5 font-semibold rounded-full ring-1 ring-inset',
      size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      tones[tone], className,
    )}>
      {dot && <span className={classNames('w-1.5 h-1.5 rounded-full', dotTones[tone])} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: Tone; label: string }> = {
    active: { tone: 'success', label: 'Active' },
    pending: { tone: 'warning', label: 'Pending' },
    pending_verification: { tone: 'warning', label: 'Pending Verification' },
    suspended: { tone: 'danger', label: 'Suspended' },
    removed: { tone: 'neutral', label: 'Removed' },
    closed: { tone: 'neutral', label: 'Closed' },
    successful: { tone: 'success', label: 'Successful' },
    failed: { tone: 'danger', label: 'Failed' },
    reversed: { tone: 'warning', label: 'Reversed' },
    duplicate: { tone: 'warning', label: 'Duplicate' },
    cancelled: { tone: 'neutral', label: 'Cancelled' },
    registered: { tone: 'brand', label: 'Registered' },
    non_registered: { tone: 'info', label: 'Non-Registered' },
  };
  const cfg = map[status] ?? { tone: 'neutral' as Tone, label: status };
  return <Badge tone={cfg.tone} dot>{cfg.label}</Badge>;
}
