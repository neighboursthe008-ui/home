import { useState, useEffect } from 'react';
import {
  Wallet, Calendar, Building2, Receipt, TrendingUp, ArrowUpRight,
  Plus, Search, FileBarChart, UserPlus, ArrowDownToLine, ShieldCheck,
  Copy, AlertCircle,
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { GroupAvatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { AreaChart } from '@/components/ui/Charts';
import { EmptyState } from '@/components/ui/EmptyState';
import { Link, useRouter } from '@/components/router';
import { useAuth } from '@/lib/auth';
import { useWalletUI } from '@/lib/wallet-ui';
import { fetchMyGroups, fetchMyTransactions } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { formatKES, formatCompactKES, dayLabel, timeOnly, classNames, greeting } from '@/lib/format';
import type { Group, Contribution, ChartPoint } from '@/types';

export function MemberDashboard() {
  const { navigate } = useRouter();
  const { profile, wallet } = useAuth();
  const { openTopUp, openContribute, openSetPin } = useWalletUI();
  const toast = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [transactions, setTransactions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    Promise.all([
      fetchMyGroups(profile.id),
      fetchMyTransactions(profile.id),
    ]).then(([g, t]) => {
      setGroups(g);
      setTransactions(t);
      setLoading(false);
    });
  }, [profile?.id]);

  if (!profile) return null;

  const activeGroups = groups.filter((g) => g.status === 'active').length;
  const successfulTx = transactions.filter((t) => t.status === 'successful' && t.type === 'contribution');
  const thisMonth = successfulTx
    .filter((t) => new Date(t.createdAt).getMonth() === new Date().getMonth())
    .reduce((s, t) => s + t.amount, 0);

  // Build chart from transactions
  const chartData: ChartPoint[] = buildTimeline(successfulTx);

  // Group recent by day
  const recent = transactions.slice(0, 8);
  const groupedByDay: Record<string, Contribution[]> = {};
  recent.forEach((c) => { const d = dayLabel(c.createdAt); (groupedByDay[d] ??= []).push(c); });

  const copyWalletNumber = () => {
    navigator.clipboard?.writeText(wallet?.walletNumber || '');
    toast('success', 'Wallet number copied.');
  };

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-ink-900 text-white p-6 sm:p-8">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-brand-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-secondary-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-brand-200 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-success-400 animate-pulse" />
              {greeting()}, welcome back
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl mt-1">{profile.fullName}</h1>
            <p className="text-brand-100/70 text-sm mt-1.5 font-mono">
              {profile.umojaId} · One identity across {profile.groupsJoined} groups
            </p>
          </div>
          <div className="flex gap-2.5 flex-wrap">
            <Button variant="secondary" size="md" leftIcon={<Plus className="w-4 h-4" />} onClick={() => navigate('groups')}>
              New Group
            </Button>
            <Button variant="outline" size="md" leftIcon={<ArrowDownToLine className="w-4 h-4" />} className="bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={openTopUp}>
              Top Up
            </Button>
            <Button variant="outline" size="md" leftIcon={<Wallet className="w-4 h-4" />} className="bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => openContribute()}>
              Contribute
            </Button>
          </div>
        </div>
      </div>

      {/* Wallet card + summary cards */}
      <div className="grid lg:grid-cols-4 gap-4">
        {/* Wallet card */}
        <div className="lg:col-span-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-ink-900 via-ink-800 to-brand-900 text-white p-5 sm:p-6">
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-brand-500/10 rounded-full blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-brand-200 text-xs font-medium">
              <Wallet className="w-4 h-4" /> UMOJA Wallet
            </div>
            <div className="font-display font-extrabold text-3xl mt-2">{formatKES(wallet?.balance ?? 0)}</div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-brand-200">Wallet No.</span>
              <button onClick={copyWalletNumber} className="font-mono text-sm font-bold text-white flex items-center gap-1.5 hover:text-brand-200 transition-colors">
                {wallet?.walletNumber}
                <Copy className="w-3 h-3" />
              </button>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" className="w-full" leftIcon={<ArrowDownToLine className="w-3.5 h-3.5" />} onClick={openTopUp}>Top Up</Button>
              <Button size="sm" variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20" leftIcon={<Wallet className="w-3.5 h-3.5" />} onClick={() => openContribute()}>Contribute</Button>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <StatCard
          icon={<Wallet className="w-5 h-5" />}
          label="Total Contributed"
          value={formatKES(profile.totalContributed)}
          sublabel="All-time across all groups"
          sparkData={chartData.map((d) => d.value / 1000)}
          delay={0}
          className="lg:col-span-1"
        />
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          label="This Month"
          value={formatKES(thisMonth)}
          sublabel={new Date().toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}
          sparkData={[2, 5, 7.5, 10, 15, 22]}
          accent="bg-secondary-50 text-secondary-600"
          sparkColor="#14b8a6"
          delay={80}
          className="lg:col-span-1"
        />
        <StatCard
          icon={<Building2 className="w-5 h-5" />}
          label="Groups"
          value={String(groups.length)}
          sublabel={`${activeGroups} active`}
          sparkData={[1, 2, 3, 4, 4, 5]}
          accent="bg-accent-50 text-accent-600"
          sparkColor="#f59e0b"
          delay={160}
          className="lg:col-span-1"
        />
      </div>

      {/* PIN setup prompt */}
      {!profile.pinSet && (
        <div className="p-4 rounded-2xl bg-warning-50 border border-warning-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-warning-100 text-warning-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-warning-800 text-sm">Set your transaction PIN</div>
            <div className="text-xs text-warning-700 mt-0.5">You need a 4-digit PIN to make contributions and wallet transfers.</div>
          </div>
          <Button size="sm" variant="outline" onClick={openSetPin} leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}>Set PIN</Button>
        </div>
      )}

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <Card className="lg:col-span-2" padding="md">
          <CardHeader
            title="Recent Activity"
            subtitle="Your latest transactions across all groups"
            icon={<TrendingUp className="w-5 h-5" />}
            action={<Link to="contributions" className="text-sm font-semibold text-brand-600 hover:text-brand-700">View all</Link>}
          />
          {loading ? (
            <div className="py-8 text-center text-sm text-ink-400">Loading...</div>
          ) : recent.length === 0 ? (
            <EmptyState icon={<Wallet className="w-8 h-8" />} title="No transactions yet" description="Your contributions and top-ups will appear here." />
          ) : (
            <div className="space-y-1">
              {Object.entries(groupedByDay).map(([day, items]) => (
                <div key={day}>
                  <div className="text-xs font-bold uppercase tracking-wider text-ink-400 py-2.5">{day}</div>
                  {items.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 sm:gap-4 p-3 rounded-xl hover:bg-ink-50 transition-colors">
                      <div className={classNames('w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0', c.groupLogoColor)}>
                        {c.type === 'top_up' ? <ArrowDownToLine className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-ink-900 truncate">{c.type === 'top_up' ? 'Wallet Top-up' : c.groupName}</div>
                        <div className="text-xs text-ink-400 flex items-center gap-2 mt-0.5">
                          <span className="font-mono">{c.paymentReference}</span>
                          <span>·</span>
                          <span>{timeOnly(c.createdAt)}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-display font-bold text-ink-900">{c.type === 'top_up' ? '+' : ''}{formatKES(c.amount)}</div>
                        {c.fee > 0 && <div className="text-[10px] text-ink-400">Fee: {formatKES(c.fee)}</div>}
                        <StatusBadge status={c.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Contribution chart */}
        <Card padding="md">
          <CardHeader title="Contribution Trend" subtitle="Last 6 months" icon={<TrendingUp className="w-5 h-5" />} />
          {chartData.length > 0 ? (
            <AreaChart data={chartData} height={200} />
          ) : (
            <EmptyState icon={<TrendingUp className="w-8 h-8" />} title="No data yet" description="Make contributions to see your trend." />
          )}
          <div className="mt-4 pt-4 border-t border-ink-100 grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xs text-ink-400 font-medium">Average</div>
              <div className="font-display font-bold text-ink-900 text-sm mt-0.5">{formatKES(profile.contributionCount > 0 ? Math.round(profile.totalContributed / profile.contributionCount) : 0)}</div>
            </div>
            <div>
              <div className="text-xs text-ink-400 font-medium">Transactions</div>
              <div className="font-display font-bold text-ink-900 text-sm mt-0.5">{profile.contributionCount}</div>
            </div>
            <div>
              <div className="text-xs text-ink-400 font-medium">Groups</div>
              <div className="font-display font-bold text-ink-900 text-sm mt-0.5">{groups.length}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* My Groups */}
      <Card padding="md">
        <CardHeader
          title="My Groups"
          subtitle={`${groups.length} groups · ${activeGroups} active`}
          icon={<Building2 className="w-5 h-5" />}
          action={
            <div className="flex gap-2">
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => navigate('groups')}>New</Button>
            </div>
          }
        />
        {loading ? (
          <div className="py-8 text-center text-sm text-ink-400">Loading...</div>
        ) : groups.length === 0 ? (
          <EmptyState icon={<Building2 className="w-8 h-8" />} title="No groups yet" description="Create or join a group to get started." action={<Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => navigate('groups')}>Create Group</Button>} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((g) => (
              <Link to="group-dashboard" params={{ id: g.id }} key={g.id} className="block group">
                <div className="p-4 rounded-2xl border border-ink-100 hover:border-brand-200 hover:shadow-card-hover transition-all duration-300 group-hover:-translate-y-0.5">
                  <div className="flex items-start gap-3">
                    <GroupAvatar name={g.name} color={g.logoColor} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-ink-900 truncate">{g.name}</div>
                      <div className="text-xs text-ink-400 font-mono">{g.groupId}</div>
                      {g.walletNumber && <div className="text-xs text-ink-400 font-mono mt-0.5">{g.walletNumber}</div>}
                    </div>
                    <StatusBadge status={g.status} />
                  </div>
                  {/* Admins */}
                  {g.founders.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-ink-100">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-ink-400 mb-1.5">Admins</div>
                      <div className="text-xs text-ink-600 truncate">
                        {g.founders.map((f) => f.fullName).join(', ')}
                      </div>
                    </div>
                  )}
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <div className="text-xs text-ink-400 font-medium">Total collected</div>
                      <div className="font-display font-bold text-lg text-ink-900 mt-0.5">{formatCompactKES(g.totalContributions)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-ink-400">Your share</div>
                      <div className="text-sm font-semibold text-brand-600">{formatKES(g.myTotalContributed)}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: <Wallet className="w-5 h-5" />, label: 'Make a Contribution', desc: 'Send money to a group', onClick: () => openContribute(), accent: 'bg-brand-50 text-brand-600' },
          { icon: <ArrowDownToLine className="w-5 h-5" />, label: 'Top Up Wallet', desc: 'Load your wallet via M-Pesa', onClick: openTopUp, accent: 'bg-secondary-50 text-secondary-600' },
          { icon: <Plus className="w-5 h-5" />, label: 'Create a Group', desc: 'Start a new contribution group', onClick: () => navigate('groups'), accent: 'bg-accent-50 text-accent-600' },
        ].map((a) => (
          <button key={a.label} onClick={a.onClick} className="text-left">
            <Card hover padding="md" className="flex items-center gap-4">
              <div className={classNames('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', a.accent)}>{a.icon}</div>
              <div className="flex-1">
                <div className="font-semibold text-ink-900 text-sm">{a.label}</div>
                <div className="text-xs text-ink-500 mt-0.5">{a.desc}</div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-ink-300" />
            </Card>
          </button>
        ))}
      </div>
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
    months.push({
      label,
      value: monthTx.reduce((s, t) => s + t.amount, 0),
      count: monthTx.length,
    });
  }
  return months;
}
