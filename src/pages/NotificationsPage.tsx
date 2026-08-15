import { useState, useEffect } from 'react';
import {
  Bell, CheckCircle2, XCircle, AlertCircle, Info, UserPlus,
  KeyRound, ShieldCheck, Megaphone, FileBarChart, Check, Wallet, TrendingUp,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/lib/auth';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/api';
import type { Notification, NotificationKind } from '@/types';
import { relativeTime, classNames } from '@/lib/format';

const iconMap: Partial<Record<NotificationKind, typeof Bell>> = {
  contribution_received: CheckCircle2,
  contribution_successful: CheckCircle2,
  contribution_failed: XCircle,
  new_member: UserPlus,
  group_invitation: UserPlus,
  otp: KeyRound,
  group_verification: ShieldCheck,
  system_announcement: Megaphone,
  report_generated: FileBarChart,
  top_up_successful: Wallet,
  top_up_failed: XCircle,
};

const toneMap: Partial<Record<NotificationKind, string>> = {
  contribution_received: 'bg-success-50 text-success-600',
  contribution_successful: 'bg-success-50 text-success-600',
  contribution_failed: 'bg-danger-50 text-danger-600',
  new_member: 'bg-brand-50 text-brand-600',
  group_invitation: 'bg-brand-50 text-brand-600',
  otp: 'bg-accent-50 text-accent-600',
  group_verification: 'bg-warning-50 text-warning-600',
  system_announcement: 'bg-sky-50 text-sky-600',
  report_generated: 'bg-secondary-50 text-secondary-600',
  top_up_successful: 'bg-success-50 text-success-600',
  top_up_failed: 'bg-danger-50 text-danger-600',
};

const categoryLabels: Record<string, string> = {
  all: 'All', contribution: 'Contributions', member: 'Members', group: 'Groups', system: 'System',
};

export function NotificationsPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!profile?.id) return;
    fetchNotifications(profile.id).then((ns) => { setItems(ns); setLoading(false); });
  }, [profile?.id]);

  const categoryOf = (k: NotificationKind) => {
    if (k.startsWith('contribution')) return 'contribution';
    if (k === 'new_member' || k === 'group_invitation') return 'member';
    if (k === 'group_verification' || k === 'otp') return 'group';
    return 'system';
  };

  const filtered = items.filter((n) => filter === 'all' || categoryOf(n.kind) === filter);
  const unread = items.filter((n) => !n.read).length;

  const handleMarkRead = async (id: string) => {
    setItems((arr) => arr.map((n) => n.id === id ? { ...n, read: true } : n));
    await markNotificationRead(id);
  };

  const handleMarkAllRead = async () => {
    setItems((arr) => arr.map((n) => ({ ...n, read: true })));
    if (profile?.id) await markAllNotificationsRead(profile.id);
  };

  if (loading) {
    return <div className="py-12 text-center text-sm text-ink-400">Loading notifications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink-900">Notifications</h1>
          <p className="text-sm text-ink-500 mt-1">{unread} unread · {items.length} total</p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="md" leftIcon={<Check className="w-4 h-4" />} onClick={handleMarkAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {Object.entries(categoryLabels).map(([key, label]) => {
          const count = key === 'all' ? items.length : items.filter((n) => categoryOf(n.kind) === key).length;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={classNames(
                'px-4 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-2',
                filter === key ? 'bg-brand-600 text-white' : 'bg-white border border-ink-200 text-ink-600 hover:bg-ink-50',
              )}
            >
              {label}
              <span className={classNames('text-xs px-1.5 py-0.5 rounded-full', filter === key ? 'bg-white/20' : 'bg-ink-100 text-ink-500')}>{count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<Bell className="w-8 h-8" />} title="No notifications" description="You're all caught up. New notifications will appear here." />
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="divide-y divide-ink-100">
            {filtered.map((n) => {
              const Icon = iconMap[n.kind] || Info;
              return (
                <button
                  key={n.id}
                  onClick={() => handleMarkRead(n.id)}
                  className={classNames(
                    'w-full flex items-start gap-3 sm:gap-4 p-4 sm:p-5 text-left transition-colors hover:bg-ink-50/50',
                    !n.read && 'bg-brand-50/30',
                  )}
                >
                  <div className={classNames('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', toneMap[n.kind] || 'bg-ink-100 text-ink-500')}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink-900 text-sm">{n.title}</span>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />}
                    </div>
                    <p className="text-sm text-ink-600 mt-0.5">{n.body}</p>
                    {n.groupName && <div className="mt-1.5"><Badge tone="neutral">{n.groupName}</Badge></div>}
                    <div className="text-xs text-ink-400 mt-1.5">{relativeTime(n.createdAt)}</div>
                  </div>
                  {!n.read && <div className="shrink-0 pt-1"><span className="text-xs font-semibold text-brand-600">New</span></div>}
                </button>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
