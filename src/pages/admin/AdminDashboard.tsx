import { useState, useEffect } from 'react';
import { Building2, Users, Wallet, TrendingUp, Activity } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { AreaChart, DonutChart } from '@/components/ui/Charts';
import { fetchAllGroups, fetchAllProfiles, fetchAllTransactions } from '@/lib/api';
import { formatKES, formatCompactKES, classNames } from '@/lib/format';
import type { Contribution, ChartPoint } from '@/types';

export function AdminDashboard() {
  const [groups, setGroups] = useState<number>(0);
  const [profiles, setProfiles] = useState<number>(0);
  const [transactions, setTransactions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchAllGroups(), fetchAllProfiles(), fetchAllTransactions(100)]).then(([g, p, t]) => {
      setGroups(g.length); setProfiles(p.length); setTransactions(t); setLoading(false);
    });
  }, []);

  const totalAmount = transactions.filter((t) => t.status === 'successful').reduce((s, t) => s + t.amount, 0);
  const chartData: ChartPoint[] = buildMonthlyChart(transactions.filter((t) => t.status === 'successful'));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink-900">Admin Dashboard</h1>
        <p className="text-sm text-ink-500 mt-1">Platform-wide overview</p>
      </div>

      {loading ? (
        <Card><div className="py-12 text-center text-sm text-ink-400">Loading...</div></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<Building2 className="w-5 h-5" />} label="Total Groups" value={String(groups)} sublabel="All groups" sparkData={[2, 3, 3, 4, 5, groups]} delay={0} />
            <StatCard icon={<Users className="w-5 h-5" />} label="Total Members" value={String(profiles)} sublabel="Registered users" accent="bg-secondary-50 text-secondary-600" sparkColor="#14b8a6" sparkData={[1, 2, 3, 4, 5, profiles]} delay={80} />
            <StatCard icon={<Wallet className="w-5 h-5" />} label="Total Volume" value={formatCompactKES(totalAmount)} sublabel="All transactions" accent="bg-accent-50 text-accent-600" sparkColor="#f59e0b" sparkData={[10, 20, 30, 40, 50, 60]} delay={160} />
            <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Transactions" value={String(transactions.length)} sublabel="All-time" accent="bg-sky-50 text-sky-600" sparkColor="#0ea5e9" sparkData={[5, 10, 15, 20, 25, transactions.length]} delay={240} />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2" padding="md">
              <CardHeader title="Platform Transaction Volume" subtitle="Monthly totals" icon={<Activity className="w-5 h-5" />} />
              {chartData.length > 0 ? <AreaChart data={chartData} height={240} /> : <div className="py-12 text-center text-sm text-ink-400">No data yet.</div>}
            </Card>
            <Card padding="md">
              <CardHeader title="Transaction Types" subtitle="By type" icon={<TrendingUp className="w-5 h-5" />} />
              <DonutChart segments={[
                { label: 'Contributions', value: transactions.filter((t) => t.type === 'contribution').length, color: 'bg-brand-500' },
                { label: 'Top-ups', value: transactions.filter((t) => t.type === 'top_up').length, color: 'bg-sky-500' },
              ]} />
            </Card>
          </div>

          <Card padding="md">
            <CardHeader title="Recent Transactions" subtitle="Latest platform-wide" icon={<TrendingUp className="w-5 h-5" />} />
            <div className="space-y-1">
              {transactions.slice(0, 10).map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-ink-50 transition-colors">
                  <div className={classNames('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', t.type === 'top_up' ? 'bg-sky-50 text-sky-600' : 'bg-brand-50 text-brand-600')}>
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-ink-900 text-sm truncate">{t.contributorName || 'Anonymous'}</div>
                    <div className="text-xs text-ink-400">{t.groupName}</div>
                  </div>
                  <div className="font-display font-bold text-ink-900 text-sm">{formatKES(t.amount)}</div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function buildMonthlyChart(txs: Contribution[]): ChartPoint[] {
  const now = new Date();
  const months: ChartPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('en-KE', { month: 'short' });
    const monthTx = txs.filter((t) => { const td = new Date(t.createdAt); return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear(); });
    months.push({ label, value: monthTx.reduce((s, t) => s + t.amount, 0), count: monthTx.length });
  }
  return months;
}
