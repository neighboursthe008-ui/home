import { useState, useEffect } from 'react';
import { Activity, TrendingUp } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { AreaChart, DonutChart, BarChart } from '@/components/ui/Charts';
import { fetchAllGroups, fetchAllTransactions } from '@/lib/api';
import { formatCompactKES, classNames } from '@/lib/format';
import type { Contribution, Group, ChartPoint } from '@/types';

export function AdminAnalyticsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [transactions, setTransactions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  useEffect(() => {
    Promise.all([fetchAllGroups(), fetchAllTransactions(200)]).then(([g, t]) => {
      setGroups(g); setTransactions(t); setLoading(false);
    });
  }, []);

  const successful = transactions.filter((t) => t.status === 'successful');
  const chartData: ChartPoint[] = buildMonthlyChart(successful);
  const byMethod = groupByMethod(successful);
  const topGroups = [...groups].sort((a, b) => b.totalContributions - a.totalContributions).slice(0, 10);
  const maxGroupAmount = topGroups.length > 0 ? topGroups[0].totalContributions : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink-900">Platform Analytics</h1>
        <p className="text-sm text-ink-500 mt-1">Platform-wide insights and trends</p>
      </div>

      {loading ? (
        <Card><div className="py-12 text-center text-sm text-ink-400">Loading...</div></Card>
      ) : (
        <>
          <Card padding="md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center"><TrendingUp className="w-5 h-5" /></div>
                <div>
                  <h3 className="font-display font-semibold text-ink-900">Transaction Volume</h3>
                  <p className="text-sm text-ink-500">Monthly totals across platform</p>
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
              <CardHeader title="Payment Methods" subtitle="Distribution" icon={<Activity className="w-5 h-5" />} />
              <DonutChart segments={byMethod} />
            </Card>
            <Card padding="md">
              <CardHeader title="Top Groups" subtitle="By total contributions" icon={<TrendingUp className="w-5 h-5" />} />
              <div className="space-y-2">
                {topGroups.map((g, i) => (
                  <div key={g.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-ink-50 transition-colors">
                    <span className={classNames('w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0', i === 0 ? 'bg-accent-100 text-accent-700' : 'bg-ink-100 text-ink-400')}>{i + 1}</span>
                    <span className="flex-1 text-sm font-medium text-ink-900 truncate">{g.name}</span>
                    <span className="text-sm font-display font-bold text-ink-900">{formatCompactKES(g.totalContributions)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
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
