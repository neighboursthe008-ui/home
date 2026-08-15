import { useState, useEffect } from 'react';
import { FileBarChart, ChevronLeft, Download, Calendar, TrendingUp, Users, Wallet } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from '@/components/router';
import { fetchGroupTransactions, fetchGroupMembers } from '@/lib/api';
import { formatKES, formatCompactKES, dateOnly, classNames } from '@/lib/format';
import type { Contribution, GroupMemberRow } from '@/types';

export function ReportsPage({ groupId }: { groupId?: string }) {
  const { navigate } = useRouter();
  const toast = useToast();
  const [transactions, setTransactions] = useState<Contribution[]>([]);
  const [members, setMembers] = useState<GroupMemberRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;
    Promise.all([fetchGroupTransactions(groupId), fetchGroupMembers(groupId)]).then(([t, m]) => {
      setTransactions(t); setMembers(m); setLoading(false);
    });
  }, [groupId]);

  const successful = transactions.filter((t) => t.status === 'successful');
  const totalAmount = successful.reduce((s, t) => s + t.amount, 0);
  const totalFees = successful.reduce((s, t) => s + t.fee, 0);
  const sortedMembers = [...members].sort((a, b) => b.totalContributed - a.totalContributed);

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('group-dashboard', { id: groupId || '' })} className="flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-ink-900 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Group
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink-900">Reports</h1>
          <p className="text-sm text-ink-500 mt-1">Financial summaries and member contributions</p>
        </div>
        <Button variant="outline" leftIcon={<Download className="w-4 h-4" />} onClick={() => toast('success', 'Report exported.')}>Export PDF</Button>
      </div>

      {loading ? (
        <Card><div className="py-12 text-center text-sm text-ink-400">Loading report...</div></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <Wallet className="w-5 h-5" />, label: 'Total Collected', value: formatKES(totalAmount), accent: 'bg-brand-50 text-brand-600' },
              { icon: <TrendingUp className="w-5 h-5" />, label: 'Total Fees', value: formatKES(totalFees), accent: 'bg-accent-50 text-accent-600' },
              { icon: <Users className="w-5 h-5" />, label: 'Active Members', value: String(members.filter((m) => m.status === 'active').length), accent: 'bg-secondary-50 text-secondary-600' },
              { icon: <FileBarChart className="w-5 h-5" />, label: 'Transactions', value: String(successful.length), accent: 'bg-sky-50 text-sky-600' },
            ].map((s) => (
              <Card key={s.label} padding="md">
                <div className={classNames('w-11 h-11 rounded-xl flex items-center justify-center mb-3', s.accent)}>{s.icon}</div>
                <div className="text-2xl font-display font-extrabold text-ink-900">{s.value}</div>
                <div className="text-sm text-ink-500 mt-1">{s.label}</div>
              </Card>
            ))}
          </div>

          <Card padding="md">
            <CardHeader title="Member Contribution Report" subtitle="Sorted by total contributed" icon={<Users className="w-5 h-5" />} />
            {sortedMembers.length === 0 ? (
              <EmptyState icon={<Users className="w-8 h-8" />} title="No data" description="No members have contributed yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-ink-100 bg-ink-50/50">
                      {['#', 'Member', 'UMOJA ID', 'Role', 'Total Contributed', '% of Total'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-ink-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {sortedMembers.map((m, i) => (
                      <tr key={m.id} className="hover:bg-ink-50/50 transition-colors">
                        <td className="px-4 py-3"><span className="text-sm font-bold text-ink-400">{i + 1}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={m.fullName} color={m.avatarColor} size="sm" />
                            <span className="text-sm font-medium text-ink-900">{m.fullName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><span className="font-mono text-xs text-ink-600">{m.umojaId}</span></td>
                        <td className="px-4 py-3"><span className="text-sm text-ink-600 capitalize">{m.role.replace('_', ' ')}</span></td>
                        <td className="px-4 py-3"><span className="font-display font-bold text-ink-900">{formatKES(m.totalContributed)}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 rounded-full bg-ink-100 overflow-hidden">
                              <div className="h-full bg-brand-500 rounded-full" style={{ width: `${totalAmount > 0 ? (m.totalContributed / totalAmount) * 100 : 0}%` }} />
                            </div>
                            <span className="text-xs text-ink-500 font-semibold">{totalAmount > 0 ? ((m.totalContributed / totalAmount) * 100).toFixed(1) : '0'}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card padding="md">
            <CardHeader title="Monthly Summary" subtitle="Contributions by month" icon={<Calendar className="w-5 h-5" />} />
            <div className="space-y-2">
              {getMonthlySummary(successful).map((m) => (
                <div key={m.label} className="flex items-center gap-4 p-3 rounded-xl hover:bg-ink-50 transition-colors">
                  <div className="w-24 text-sm font-semibold text-ink-900">{m.label}</div>
                  <div className="flex-1 h-6 rounded-lg bg-ink-100 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-lg flex items-center justify-end px-2" style={{ width: `${m.maxAmount > 0 ? (m.amount / m.maxAmount) * 100 : 0}%` }}>
                      <span className="text-[10px] font-bold text-white">{formatCompactKES(m.amount)}</span>
                    </div>
                  </div>
                  <div className="text-xs text-ink-500 w-20 text-right">{m.count} txns</div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function getMonthlySummary(txs: Contribution[]) {
  const map: Record<string, { amount: number; count: number }> = {};
  txs.forEach((t) => {
    const d = new Date(t.createdAt);
    const label = d.toLocaleDateString('en-KE', { month: 'short', year: 'numeric' });
    if (!map[label]) map[label] = { amount: 0, count: 0 };
    map[label].amount += t.amount;
    map[label].count++;
  });
  const entries = Object.entries(map).map(([label, v]) => ({ label, ...v }));
  const maxAmount = Math.max(...entries.map((e) => e.amount), 1);
  return entries.map((e) => ({ ...e, maxAmount })).reverse();
}
