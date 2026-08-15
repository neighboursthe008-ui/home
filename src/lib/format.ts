// ── Formatting & small helpers ──

export function formatKES(amount: number, opts: { decimals?: boolean } = {}): string {
  const decimals = opts.decimals ?? false;
  return `KES ${amount.toLocaleString('en-KE', {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  })}`;
}

export function formatCompactKES(amount: number): string {
  if (amount >= 1_000_000) return `KES ${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (amount >= 1_000) return `KES ${(amount / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return `KES ${amount}`;
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function maskPhone(phone: string): string {
  // +254 7••• ••123
  if (phone.length < 6) return phone;
  const head = phone.slice(0, phone.length - 5);
  const tail = phone.slice(-3);
  return `${head[0]}${head.slice(1).replace(/./g, '•')} ${'•'.repeat(3)}${tail}`;
}

export function relativeTime(iso: string): string {
  const now = new Date('2026-08-14T10:00:00');
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function dayLabel(iso: string): string {
  const now = new Date('2026-08-14T10:00:00');
  const then = new Date(iso);
  const diffDays = Math.floor((now.getTime() - then.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return then.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
}

export function fullDate(iso: string): string {
  return new Date(iso).toLocaleString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function timeOnly(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function dateOnly(iso: string): string {
  return new Date(iso).toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function classNames(...c: (string | false | undefined | null)[]): string {
  return c.filter(Boolean).join(' ');
}

export function randomColor(seed: string): string {
  const colors = [
    'bg-brand-500', 'bg-secondary-500', 'bg-accent-500', 'bg-success-500',
    'bg-sky-500', 'bg-rose-500', 'bg-violet-500', 'bg-orange-500',
    'bg-teal-500', 'bg-fuchsia-500',
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return colors[h % colors.length];
}

export function greeting(): string {
  const h = 10; // fixed "now" hour for deterministic demo
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
