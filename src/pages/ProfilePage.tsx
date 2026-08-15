import { useState, useEffect } from 'react';
import {
  Wallet, Building2, Receipt, Calendar, Phone, Mail, User as UserIcon,
  Edit3, ShieldCheck, TrendingUp, Award, Clock, ArrowRight, Copy,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { AreaChart } from '@/components/ui/Charts';
import { Link } from '@/components/router';
import { useAuth } from '@/lib/auth';
import { useWalletUI } from '@/lib/wallet-ui';
import { useToast } from '@/components/ui/Toast';
import { fetchMyGroups, fetchMyTransactions } from '@/lib/api';
import { formatKES, dateOnly, classNames } from '@/lib/format';
import type { Group, Contribution, ChartPoint } from '@/types';

export function ProfilePage() {
  const { profile, wallet } = useAuth();
  const { openSetPin } = useWalletUI();
  const toast = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [transactions, setTransactions] = useState<Contribution[]>([]);

  useEffect(() => {
    if (!profile?.id) return;
    Promise.all([fetchMyGroups(profile.id), fetchMyTransactions(profile.id)]).then(([g, t]) => {
      setGroups(g);
      setTransactions(t);
    });
  }, [profile?.id]);

  if (!profile) return null;

  const successfulTx = transactions.filter((t) => t.status === 'successful' && t.type === 'contribution');
  const avg = profile.contributionCount > 0 ? Math.round(profile.totalContributed / profile.contributionCount) : 0;
  const highest = successfulTx.length > 0 ? Math.max(...successfulTx.map((c) => c.amount)) : 0;
  const last = transactions.find((t) => t.type === 'contribution');

  const chartData: ChartPoint[] = buildTimeline(successfulTx);

  const copyWallet = () => {
    navigator.clipboard?.writeText(wallet?.walletNumber || '');
    toast('success', 'Wallet number copied.');
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-white border border-ink-100 shadow-card">
        <div className="h-32 bg-gradient-to-br from-brand-600 via-brand-700 to-ink-900 relative">
          <div className="absolute inset-0 bg-grid opacity-10" />
        </div>
        <div className="px-6 sm:px-8 pb-6 sm:pb-8 -mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="relative">
                <Avatar name={profile.fullName} color={profile.avatarColor} size="xl" ring className="ring-4 ring-white" />
                <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-success-500 border-2 border-white" />
              </div>
              <div className="pb-1">
                <h1 className="font-display font-extrabold text-2xl text-ink-900">{profile.fullName}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-sm text-ink-500 font-semibold">{profile.umojaId}</span>
                  <Badge tone="brand">Member</Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {profile.pinSet ? (
                <Button variant="outline" size="md" leftIcon={<ShieldCheck className="w-4 h-4" />} disabled>PIN Set</Button>
              ) : (
                <Button variant="outline" size="md" leftIcon={<ShieldCheck className="w-4 h-4" />} onClick={openSetPin}>Set PIN</Button>
              )}
            </div>
          </div>

          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-ink-50 text-ink-500 flex items-center justify-center"><Mail className="w-4 h-4" /></div>
              <div className="min-w-0"><div className="text-xs text-ink-400 font-medium">Email</div><div className="text-sm font-semibold text-ink-900 truncate">{profile.email}</div></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-ink-50 text-ink-500 flex items-center justify-center"><Phone className="w-4 h-4" /></div>
              <div><div className="text-xs text-ink-400 font-medium">Phone</div><div className="text-sm font-semibold text-ink-900">{profile.phone}</div></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-ink-50 text-ink-500 flex items-center justify-center"><Calendar className="w-4 h-4" /></div>
              <div><div className="text-xs text-ink-400 font-medium">Member since</div><div className="text-sm font-semibold text-ink-900">{dateOnly(profile.registeredAt)}</div></div>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ink-900 via-ink-800 to-brand-900 text-white p-5 sm:p-6">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-brand-500/10 rounded-full blur-2xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-brand-200 text-xs font-medium">
              <Wallet className="w-4 h-4" /> UMOJA Wallet
            </div>
            <div className="font-display font-extrabold text-3xl mt-2">{formatKES(wallet?.balance ?? 0)}</div>
            <button onClick={copyWallet} className="mt-2 inline-flex items-center gap-2 text-sm text-brand-200 hover:text-white transition-colors">
              <span className="font-mono font-bold">{wallet?.walletNumber}</span>
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Wallet className="w-5 h-5" />, label: 'Total Contributed', value: formatKES(profile.totalContributed), accent: 'bg-brand-50 text-brand-600' },
          { icon: <Receipt className="w-5 h-5" />, label: 'Contributions', value: String(profile.contributionCount), accent: 'bg-secondary-50 text-secondary-600' },
          { icon: <TrendingUp className="w-5 h-5" />, label: 'Average', value: formatKES(avg), accent: 'bg-accent-50 text-accent-600' },
          { icon: <Award className="w-5 h-5" />, label: 'Highest', value: formatKES(highest), accent: 'bg-sky-50 text-sky-600' },
        ].map((s) => (
          <Card key={s.label} padding="md">
            <div className={classNames('w-11 h-11 rounded-xl flex items-center justify-center mb-3', s.accent)}>{s.icon}</div>
            <div className="text-2xl font-display font-extrabold text-ink-900">{s.value}</div>
            <div className="text-sm text-ink-500 mt-1">{s.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" padding="md">
          <CardHeader title="Contribution Trend" subtitle="Last 6 months" icon={<TrendingUp className="w-5 h-5" />} />
          {chartData.length > 0 ? (
            <AreaChart data={chartData} height={220} />
          ) : (
            <div className="py-12 text-center text-sm text-ink-400">No contribution data yet.</div>
          )}
        </Card>

        <Card padding="md">
          <CardHeader title="Last Contribution" icon={<Clock className="w-5 h-5" />} />
          {last ? (
            <Link to="contributions" className="block p-4 rounded-2xl border border-ink-100 hover:border-brand-200 hover:shadow-card-hover transition-all group">
              <div className="flex items-center gap-3">
                <div className={classNames('w-10 h-10 rounded-xl flex items-center justify-center text-white', last.groupLogoColor)}>
                  <Wallet className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-ink-900 truncate">{last.groupName}</div>
                  <div className="text-xs text-ink-400">{dateOnly(last.createdAt)}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-ink-300 group-hover:text-brand-500" />
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div className="font-display font-bold text-xl text-ink-900">{formatKES(last.amount)}</div>
                <StatusBadge status={last.status} />
              </div>
            </Link>
          ) : (
            <div className="py-8 text-center text-sm text-ink-400">No contributions yet.</div>
          )}
          <div className="mt-4 pt-4 border-t border-ink-100 space-y-3">
            <Row label="Active Groups" value={String(groups.length)} />
            <Row label="Total Contributions" value={String(profile.contributionCount)} />
            <Row label="Account Status" value={<StatusBadge status={profile.status} />} />
            <Row label="Identity" value={<span className="font-mono text-xs font-semibold text-brand-600">{profile.umojaId}</span>} />
          </div>
        </Card>
      </div>

      <Card padding="md">
        <CardHeader title="My Groups" subtitle={`${groups.length} groups joined`} icon={<Building2 className="w-5 h-5" />} action={<Link to="groups" className="text-sm font-semibold text-brand-600 hover:text-brand-700">View all</Link>} />
        {groups.length === 0 ? (
          <div className="py-8 text-center text-sm text-ink-400">No groups joined yet.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {groups.map((g) => (
              <Link to="group-dashboard" params={{ id: g.id }} key={g.id}>
                <div className="p-4 rounded-xl border border-ink-100 hover:border-brand-200 hover:shadow-card-hover transition-all flex items-center gap-3">
                  <div className={classNames('w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0', g.logoColor)}>
                    {g.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-ink-900 truncate text-sm">{g.name}</div>
                    <div className="text-xs text-ink-400">{g.groupId}</div>
                  </div>
                  <StatusBadge status={g.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card padding="md">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-semibold text-ink-900">Account Security</h3>
            <p className="text-sm text-ink-500 mt-1">
              Your UMOJA identity ({profile.umojaId}) is permanent and unique. It stays the same across every group you join or leave.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone={profile.pinSet ? 'success' : 'warning'} dot>{profile.pinSet ? 'PIN set' : 'PIN not set'}</Badge>
              <Badge tone="success" dot>Phone verified</Badge>
              <Badge tone="success" dot>Email verified</Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-ink-500">{label}</span>
      <span className="text-sm font-semibold text-ink-900">{value}</span>
    </div>
  );
}

function buildTimeline(txs: Contribution[]): ChartPoint[] {
  const now = new Date();
  const months: ChartPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('en-KE', { month: 'short' });
    const monthTx = txs.filter((t) => {
      const td = new Date(t.createdAt);
      return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
    });
    months.push({ label, value: monthTx.reduce((s, t) => s + t.amount, 0), count: monthTx.length });
  }
  return months;
}
