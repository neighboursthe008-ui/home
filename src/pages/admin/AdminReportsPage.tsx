import { useState, useEffect } from 'react';
import { FileBarChart, Download, Building2, Users, Wallet, TrendingUp } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { fetchAllGroups, fetchAllProfiles, fetchAllTransactions } from '@/lib/api';
import { formatKES, formatCompactKES, dateOnly, classNames } from '@/lib/format';
import type { Contribution, Group } from '@/types';

export function AdminReportsPage() {
  const toast = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [profiles, setProfiles] = useState<Array<{ id: string; fullName: string; umojaId: string; totalContributed: number; contributionCount: number; groupsJoined: number; status: string; registeredAt: string }>>([]);
  const [transactions, setTransactions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchAllGroups(), fetchAllProfiles(), fetchAllTransactions(200)]).then(([g, p, t]) => {
      setGroups(g); setProfiles(p); setTransactions(t); setLoading(false);
    });
  }, []);

  const successful = transactions.filter((t) => t.status === 'successful');
  const totalAmount = successful.reduce((s, t) => s + t.amount, 0);
  const totalFees = successful.reduce((s, t) => s + t.fee, 0);
  const topGroups = [...groups].sort((a, b) => b.totalContributions - a.totalContributions).slice(0, 10);
  const topMembers = [...profiles].sort((a, b) => b.totalContributed - a.totalContributed).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink-900">Platform Reports</h1>
          <p className="text-sm text-ink-500 mt-1">Financial summaries across the platform</p>
        </div>
        <Button variant="outline" leftIcon={<Download className="w-4 h-4" />} onClick={() => toast('success', 'Report exported.')}>Export PDF</Button>
      </div>

      {loading ? (
        <Card><div className="py-12 text-center text-sm text-ink-400">Loading...</div></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <Wallet className="w-5 h-5" />, label: 'Total Volume', value: formatKES(totalAmount), accent: 'bg-brand-50 text-brand-600' },
              { icon: <TrendingUp className="w-5 h-5" />, label: 'Total Fees', value: formatKES(totalFees), accent: 'bg-accent-50 text-accent-600' },
              { icon: <Building2 className="w-5 h-5" />, label: 'Total Groups', value: String(groups.length), accent: 'bg-secondary-50 text-secondary-600' },
              { icon: <Users className="w-5 h-5" />, label: 'Total Members', value: String(profiles.length), accent: 'bg-sky-50 text-sky-600' },
            ].map((s) => (
              <Card key={s.label} padding="md">
                <div className={classNames('w-11 h-11 rounded-xl flex items-center justify-center mb-3', s.accent)}>{s.icon}</div>
                <div className="text-2xl font-display font-extrabold text-ink-900">{s.value}</div>
                <div className="text-sm text-ink-500 mt-1">{s.label}</div>
              </Card>
            ))}
          </div>

          <Card padding="md">
            <CardHeader title="Top Groups by Volume" subtitle="Highest total contributions" icon={<Building2 className="w-5 h-5" />} />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-ink-100 bg-ink-50/50">
                    {['#', 'Group', 'ID', 'Members', 'Transactions', 'Total'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-ink-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {topGroups.map((g, i) => (
                    <tr key={g.id} className="hover:bg-ink-50/50 transition-colors">
                      <td className="px-4 py-3"><span className="text-sm font-bold text-ink-400">{i + 1}</span></td>
                      <td className="px-4 py-3"><span className="text-sm font-medium text-ink-900">{g.name}</span></td>
                      <td className="px-4 py-3"><span className="font-mono text-xs text-ink-600">{g.groupId}</span></td>
                      <td className="px-4 py-3"><span className="text-sm text-ink-600">{g.registeredMembers}</span></td>
                      <td className="px-4 py-3"><span className="text-sm text-ink-600">{g.transactionCount}</span></td>
                      <td className="px-4 py-3"><span className="font-display font-bold text-ink-900">{formatKES(g.totalContributions)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card padding="md">
            <CardHeader title="Top Members by Contributions" subtitle="Highest total contributed" icon={<Users className="w-5 h-5" />} />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-ink-100 bg-ink-50/50">
                    {['#', 'Member', 'UMOJA ID', 'Groups', 'Contributions', 'Total'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-ink-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {topMembers.map((p, i) => (
                    <tr key={p.id} className="hover:bg-ink-50/50 transition-colors">
                      <td className="px-4 py-3"><span className="text-sm font-bold text-ink-400">{i + 1}</span></td>
                      <td className="px-4 py-3"><span className="text-sm font-medium text-ink-900">{p.fullName}</span></td>
                      <td className="px-4 py-3"><span className="font-mono text-xs text-ink-600">{p.umojaId}</span></td>
                      <td className="px-4 py-3"><span className="text-sm text-ink-600">{p.groupsJoined}</span></td>
                      <td className="px-4 py-3"><span className="text-sm text-ink-600">{p.contributionCount}</span></td>
                      <td className="px-4 py-3"><span className="font-display font-bold text-ink-900">{formatKES(p.totalContributed)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
