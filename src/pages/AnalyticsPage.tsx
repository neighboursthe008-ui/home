import { useState, useEffect } from 'react';
import { Activity, ChevronLeft, TrendingUp, Users, Calendar } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { AreaChart, BarChart, DonutChart } from '@/components/ui/Charts';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRouter } from '@/components/router';
import { fetchGroupTransactions, fetchGroupMembers } from '@/lib/api';
import { formatCompactKES, classNames } from '@/lib/format';
import type { Contribution, GroupMemberRow, ChartPoint } from '@/types';

export function AnalyticsPage({ groupId }: { groupId?: string }) {
  const { navigate } = useRouter();
  const [transactions, setTransactions] = useState<Contribution[]>([]);
  const [members, setMembers] = useState<GroupMemberRow[]>([]);
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;
    Promise.all([fetchGroupTransactions(groupId), fetchGroupMembers(groupId)]).then(([t, m]) => {
      setTransactions(t); setMembers(m); setLoading(false);
    });
  }, [groupId]);

  const successful = transactions.filter((t) => t.status === 'successful');
  const chartData: ChartPoint[] = buildMonthlyChart(successful);
  const byMethod = groupByMethod(successful);
  const byDay = groupByDay(successful);

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('group-dashboard', { id: groupId || '' })} className="flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-ink-900 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Group
      </button>

      <div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink-900">Analytics</h1>
        <p className="text-sm text-ink-500 mt-1">Contribution patterns and insights</p>
      </div>

      {loading ? (
        <Card><div className="py-12 text-center text-sm text-ink-400">Loading analytics...</div></Card>
      ) : successful.length === 0 ? (
        <Card><EmptyState icon={<Activity className="w-8 h-8" />} title="No data yet" description="Analytics will appear once contributions are made." /></Card>
      ) : (
        <>
          <Card padding="md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center"><TrendingUp className="w-5 h-5" /></div>
                <div>
                  <h3 className="font-display font-semibold text-ink-900">Contribution Trend</h3>
                  <p className="text-sm text-ink-500">Monthly collection overview</p>
                </div>
              </div>
              <div className="flex bg-ink-100 rounded-lg p-0.5">
                {(['area', 'bar'] as const).map((t) => (
                  <button key={t} onClick={() => setChartType(t)} className={classNames('px-3 py-1 text-xs font-semibold rounded-md transition-colors capitalize', chartType === t ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500')}>{t}</button>
                ))}
              </div>
            </div>
            {chartType === 'area' ? <AreaChart data={chartData} height={260} /> : <BarChart data={chartData} height={260} />}
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card padding="md">
              <CardHeader title="Payment Methods" subtitle="Distribution by method" icon={<Users className="w-5 h-5" />} />
              <DonutChart segments={byMethod} />
            </Card>

            <Card padding="md">
              <CardHeader title="Contributions by Day of Week" subtitle="When members contribute most" icon={<Calendar className="w-5 h-5" />} />
              <BarChart data={byDay} height={220} />
            </Card>
          </div>

          <Card padding="md">
            <CardHeader title="Contributor Leaderboard" subtitle="Top contributors by amount" icon={<TrendingUp className="w-5 h-5" />} />
            <div className="space-y-2">
              {[...members].sort((a, b) => b.totalContributed - a.totalContributed).slice(0, 10).map((m, i) => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-ink-50 transition-colors">
                  <div className={classNames('w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0', i === 0 ? 'bg-accent-100 text-accent-700' : i === 1 ? 'bg-ink-200 text-ink-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-ink-100 text-ink-400')}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-ink-900 truncate">{m.fullName}</div>
                    <div className="text-xs text-ink-400">{m.umojaId}</div>
                  </div>
                  <div className="font-display font-bold text-ink-900">{formatCompactKES(m.totalContributed)}</div>
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

function groupByMethod(txs: Contribution[]) {
  const map: Record<string, number> = {};
  txs.forEach((t) => { map[t.paymentMethod] = (map[t.paymentMethod] || 0) + 1; });
  const colorMap: Record<string, string> = { m_pesa: 'bg-brand-500', bank: 'bg-secondary-500', card: 'bg-accent-500', other: 'bg-sky-500' };
  const labelMap: Record<string, string> = { m_pesa: 'M-Pesa', bank: 'Bank', card: 'Card', other: 'Other' };
  return Object.entries(map).map(([k, v]) => ({ label: labelMap[k] || k, value: v, color: colorMap[k] || 'bg-ink-400' }));
}

function groupByDay(txs: Contribution[]): ChartPoint[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const counts = [0, 0, 0, 0, 0, 0, 0];
  txs.forEach((t) => { counts[new Date(t.createdAt).getDay()]++; });
  return days.map((label, i) => ({ label, value: counts[i], count: counts[i] }));
}
