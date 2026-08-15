import { useState, useEffect } from 'react';
import {
  Wallet, Users, Building2, Receipt, TrendingUp, Calendar,
  ArrowUpRight, Search, UserPlus, Download, MoreVertical, Trophy,
  CheckCircle2, Clock, ShieldCheck, ChevronLeft, Copy,
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { GroupAvatar, Avatar } from '@/components/ui/Avatar';
import { AreaChart, DonutChart } from '@/components/ui/Charts';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRouter } from '@/components/router';
import { useAuth } from '@/lib/auth';
import { useWalletUI } from '@/lib/wallet-ui';
import { useToast } from '@/components/ui/Toast';
import { fetchMyGroups, fetchGroupTransactions, fetchGroupMembers } from '@/lib/api';
import { formatKES, formatCompactKES, dayLabel, timeOnly, dateOnly, classNames, relativeTime } from '@/lib/format';
import type { Group, Contribution, GroupMemberRow, ChartPoint } from '@/types';

export function GroupDashboard({ groupId }: { groupId?: string }) {
  const { navigate } = useRouter();
  const { profile } = useAuth();
  const { openContribute } = useWalletUI();
  const toast = useToast();
  const [group, setGroup] = useState<Group | null>(null);
  const [transactions, setTransactions] = useState<Contribution[]>([]);
  const [members, setMembers] = useState<GroupMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [contributorSearch, setContributorSearch] = useState('');

  useEffect(() => {
    if (!profile?.id) return;
    Promise.all([
      fetchMyGroups(profile.id),
      groupId ? fetchGroupTransactions(groupId) : Promise.resolve([]),
      groupId ? fetchGroupMembers(groupId) : Promise.resolve([]),
    ]).then(([groups, txs, mems]) => {
      const g = groups.find((x) => x.id === groupId) ?? groups[0];
      setGroup(g ?? null);
      setTransactions(txs);
      setMembers(mems);
      setLoading(false);
    });
  }, [profile?.id, groupId]);

  if (loading) {
    return <div className="py-12 text-center text-sm text-ink-400">Loading group...</div>;
  }

  if (!group) {
    return <Card><EmptyState icon={<Building2 className="w-8 h-8" />} title="Group not found" description="This group may have been removed." /></Card>;
  }

  const copyWallet = () => {
    if (group.walletNumber) {
      navigator.clipboard?.writeText(group.walletNumber);
      toast('success', 'Group wallet number copied.');
    }
  };

  // Build chart from transactions
  const chartData: ChartPoint[] = buildGroupChart(transactions);
  const topContributors = [...members].sort((a, b) => b.totalContributed - a.totalContributed).slice(0, 5);
  const filteredMembers = members.filter((m) => m.fullName.toLowerCase().includes(contributorSearch.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button onClick={() => navigate('dashboard')} className="flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-ink-900 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* Group header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 via-ink-800 to-brand-900 text-white p-6 sm:p-8">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute -top-20 -right-10 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={classNames('w-16 h-16 rounded-2xl flex items-center justify-center font-display font-bold text-white text-xl shadow-lg', group.logoColor)}>
              {group.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-extrabold text-2xl sm:text-3xl">{group.name}</h1>
                <StatusBadge status={group.status} />
              </div>
              <div className="text-sm text-ink-300 font-mono mt-1">{group.groupId} · {group.category}</div>

              {/* Wallet number */}
              {group.walletNumber && (
                <button onClick={copyWallet} className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                  <Wallet className="w-3.5 h-3.5 text-brand-300" />
                  <span className="text-xs text-brand-200">Wallet:</span>
                  <span className="font-mono text-sm font-bold text-white">{group.walletNumber}</span>
                  <Copy className="w-3 h-3 text-brand-300" />
                </button>
              )}

              {/* Admins */}
              {group.founders.length > 0 && (
                <div className="mt-2 text-sm text-ink-300">
                  <span className="text-ink-400">Admins: </span>
                  {group.founders.map((f, i) => (
                    <span key={i} className="text-ink-200">
                      {f.fullName}{i < group.founders.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              )}

              <div className="text-sm text-ink-400 mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Created {dateOnly(group.createdAt)}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="md" leftIcon={<Wallet className="w-4 h-4" />} onClick={() => openContribute(group.walletNumber)}>
              Contribute
            </Button>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Wallet className="w-5 h-5" />} label="Total Contributions" value={formatKES(group.totalContributions)} sublabel={`${group.transactionCount} transactions`} sparkData={chartData.map((d) => d.value / 1000)} delay={0} />
        <StatCard icon={<Users className="w-5 h-5" />} label="Contributors" value={group.contributorCount.toLocaleString()} sublabel="Registered + non-registered" accent="bg-secondary-50 text-secondary-600" sparkColor="#14b8a6" sparkData={[830, 920, 1020, 1100, 1180, 1245]} delay={80} />
        <StatCard icon={<Receipt className="w-5 h-5" />} label="This Month" value={formatKES(group.contributionsThisMonth)} sublabel={new Date().toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })} accent="bg-accent-50 text-accent-600" sparkColor="#f59e0b" sparkData={[28, 35, 42, 38, 51, 61]} delay={160} />
        <StatCard icon={<Building2 className="w-5 h-5" />} label="Transactions" value={group.transactionCount.toLocaleString()} sublabel="All-time" accent="bg-sky-50 text-sky-600" sparkColor="#0ea5e9" sparkData={[412, 478, 534, 589, 645, 688]} delay={240} />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card padding="md" className="lg:col-span-1">
          <CardHeader title="Contributor Breakdown" subtitle="Registered vs non-registered" icon={<Users className="w-5 h-5" />} />
          <DonutChart
            segments={[
              { label: 'Registered Members', value: group.registeredMembers, color: 'bg-brand-500' },
              { label: 'Non-Registered', value: group.nonRegisteredContributors, color: 'bg-sky-500' },
            ]}
          />
        </Card>

        <Card padding="md" className="lg:col-span-2">
          <CardHeader title="Contribution Graph" subtitle="Amount collected over time" icon={<TrendingUp className="w-5 h-5" />} />
          {chartData.length > 0 ? (
            <AreaChart data={chartData} height={240} />
          ) : (
            <EmptyState icon={<TrendingUp className="w-8 h-8" />} title="No contribution data yet" description="Contributions will appear here as members contribute." />
          )}
        </Card>
      </div>

      {/* Top contributors + recent transactions */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card padding="md">
          <CardHeader title="Top Contributors" subtitle="Highest total contributed" icon={<Trophy className="w-5 h-5" />} />
          {topContributors.length > 0 ? (
            <div className="space-y-2">
              {topContributors.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-ink-50 transition-colors">
                  <div className={classNames('w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0', i === 0 ? 'bg-accent-100 text-accent-700' : i === 1 ? 'bg-ink-200 text-ink-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-ink-100 text-ink-400')}>
                    {i + 1}
                  </div>
                  <Avatar name={c.fullName} color={c.avatarColor} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-ink-900 truncate">{c.fullName}</div>
                    <div className="text-xs text-ink-400 font-mono">{c.umojaId}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-display font-bold text-ink-900">{formatCompactKES(c.totalContributed)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Users className="w-8 h-8" />} title="No contributors yet" description="Members will appear here once they contribute." />
          )}
        </Card>

        <Card padding="md">
          <CardHeader title="Recent Transactions" subtitle="Latest contributions to this group" icon={<Receipt className="w-5 h-5" />} />
          {transactions.length > 0 ? (
            <div className="space-y-1">
              {transactions.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-ink-50 transition-colors">
                  <div className={classNames('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', t.contributorKind === 'registered' ? 'bg-brand-50 text-brand-600' : 'bg-sky-50 text-sky-600')}>
                    {t.contributorKind === 'registered' ? <CheckCircle2 className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-ink-900 text-sm truncate">{t.contributorName || 'Anonymous'}</div>
                    <div className="text-xs text-ink-400 font-mono">{t.paymentReference}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-display font-bold text-ink-900 text-sm">{formatKES(t.amount)}</div>
                    <StatusBadge status={t.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Receipt className="w-8 h-8" />} title="No transactions yet" description="Contributions will appear here." />
          )}
        </Card>
      </div>

      {/* Members table */}
      <Card padding="none" className="overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-ink-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-50 text-secondary-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-ink-900 text-base sm:text-lg">Group Members</h3>
                <p className="text-sm text-ink-500">{members.length} members</p>
              </div>
            </div>
            <Input placeholder="Search members..." value={contributorSearch} onChange={(e) => setContributorSearch(e.target.value)} leftIcon={<Search className="w-4 h-4" />} className="w-full sm:w-56" />
          </div>
        </div>
        {filteredMembers.length === 0 ? (
          <EmptyState icon={<Users className="w-8 h-8" />} title="No members found" description="Try a different search." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/50">
                  {['Member', 'UMOJA ID', 'Role', 'Status', 'Total', 'Joined', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-ink-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-ink-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={m.fullName} color={m.avatarColor} size="sm" />
                        <span className="text-sm font-medium text-ink-900">{m.fullName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><span className="font-mono text-xs text-ink-600">{m.umojaId}</span></td>
                    <td className="px-5 py-3.5"><Badge tone="brand">{m.role.replace('_', ' ')}</Badge></td>
                    <td className="px-5 py-3.5"><StatusBadge status={m.status} /></td>
                    <td className="px-5 py-3.5"><span className="font-display font-bold text-ink-900">{formatKES(m.totalContributed)}</span></td>
                    <td className="px-5 py-3.5"><span className="text-xs text-ink-500">{dateOnly(m.joinedAt)}</span></td>
                    <td className="px-5 py-3.5"><button className="text-ink-400 hover:text-ink-700"><MoreVertical className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Founders/Admins card */}
      <Card padding="md">
        <CardHeader title="Group Founders" subtitle="Three verified founders (admins)" icon={<ShieldCheck className="w-5 h-5" />} />
        <div className="grid sm:grid-cols-3 gap-4">
          {group.founders.map((f, i) => (
            <div key={i} className="p-4 rounded-xl border border-ink-100 flex items-center gap-3">
              <Avatar name={f.fullName} color="bg-brand-500" size="md" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-ink-900 truncate">{f.fullName}</div>
                <div className="text-xs text-ink-400 font-mono">{f.phone}</div>
              </div>
              {f.verified ? (
                <div className="w-7 h-7 rounded-lg bg-success-50 text-success-600 flex items-center justify-center"><CheckCircle2 className="w-4 h-4" /></div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-warning-50 text-warning-600 flex items-center justify-center"><Clock className="w-4 h-4" /></div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function buildGroupChart(txs: Contribution[]): ChartPoint[] {
  const now = new Date();
  const months: ChartPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('en-KE', { month: 'short' });
    const monthTx = txs.filter((t) => {
      const td = new Date(t.createdAt);
      return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear() && t.status === 'successful';
    });
    months.push({
      label,
      value: monthTx.reduce((s, t) => s + t.amount, 0),
      count: monthTx.length,
    });
  }
  return months;
}
