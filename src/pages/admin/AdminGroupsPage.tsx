import { useState, useEffect } from 'react';
import { Building2, Search, Wallet, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { GroupAvatar } from '@/components/ui/Avatar';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchAllGroups } from '@/lib/api';
import { formatKES, formatCompactKES, dateOnly, classNames } from '@/lib/format';
import type { Group } from '@/types';

export function AdminGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchAllGroups().then((g) => { setGroups(g); setLoading(false); });
  }, []);

  const filtered = groups.filter((g) => {
    if (statusFilter !== 'all' && g.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return g.name.toLowerCase().includes(q) || g.groupId.toLowerCase().includes(q) || (g.walletNumber || '').includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink-900">All Groups</h1>
        <p className="text-sm text-ink-500 mt-1">{groups.length} groups on the platform</p>
      </div>

      <Card padding="md">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input placeholder="Search by name, ID, or wallet number..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="w-4 h-4" />} className="flex-1" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 rounded-xl border border-ink-200 bg-white px-3.5 text-sm cursor-pointer outline-none focus:border-brand-500">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending_verification">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </Card>

      {loading ? (
        <Card><div className="py-12 text-center text-sm text-ink-400">Loading...</div></Card>
      ) : filtered.length === 0 ? (
        <Card><EmptyState icon={<Building2 className="w-8 h-8" />} title="No groups found" description="Try adjusting your filters." /></Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/50">
                  {['Group', 'ID', 'Category', 'Wallet', 'Members', 'Total', 'Status', 'Created'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-ink-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filtered.map((g) => (
                  <tr key={g.id} className="hover:bg-ink-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <GroupAvatar name={g.name} color={g.logoColor} size="sm" />
                        <span className="text-sm font-medium text-ink-900">{g.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><span className="font-mono text-xs text-ink-600">{g.groupId}</span></td>
                    <td className="px-5 py-3.5"><Badge tone="neutral">{g.category}</Badge></td>
                    <td className="px-5 py-3.5"><span className="font-mono text-xs text-ink-600">{g.walletNumber || '—'}</span></td>
                    <td className="px-5 py-3.5"><span className="text-sm text-ink-600">{g.registeredMembers}</span></td>
                    <td className="px-5 py-3.5"><span className="font-display font-bold text-ink-900 text-sm">{formatCompactKES(g.totalContributions)}</span></td>
                    <td className="px-5 py-3.5"><StatusBadge status={g.status} /></td>
                    <td className="px-5 py-3.5"><span className="text-xs text-ink-500">{dateOnly(g.createdAt)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
