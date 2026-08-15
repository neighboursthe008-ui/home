import { useState, useEffect } from 'react';
import { Users, Search } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchAllProfiles } from '@/lib/api';
import { formatKES, dateOnly } from '@/lib/format';

export function AdminMembersPage() {
  const [profiles, setProfiles] = useState<Array<{ id: string; umojaId: string; fullName: string; phone: string; email: string; avatarColor: string; status: string; totalContributed: number; contributionCount: number; groupsJoined: number; registeredAt: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAllProfiles().then((p) => { setProfiles(p); setLoading(false); });
  }, []);

  const filtered = profiles.filter((p) =>
    p.fullName.toLowerCase().includes(search.toLowerCase()) ||
    p.umojaId.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink-900">All Members</h1>
        <p className="text-sm text-ink-500 mt-1">{profiles.length} registered users</p>
      </div>

      <Card padding="md">
        <Input placeholder="Search by name, UMOJA ID, email, or phone..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="w-4 h-4" />} className="w-full" />
      </Card>

      {loading ? (
        <Card><div className="py-12 text-center text-sm text-ink-400">Loading...</div></Card>
      ) : filtered.length === 0 ? (
        <Card><EmptyState icon={<Users className="w-8 h-8" />} title="No members found" description="Try a different search." /></Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/50">
                  {['Member', 'UMOJA ID', 'Phone', 'Email', 'Groups', 'Contributions', 'Total', 'Status', 'Joined'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-ink-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-ink-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={p.fullName} color={p.avatarColor} size="sm" />
                        <span className="text-sm font-medium text-ink-900">{p.fullName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><span className="font-mono text-xs text-ink-600">{p.umojaId}</span></td>
                    <td className="px-5 py-3.5"><span className="text-sm text-ink-600">{p.phone}</span></td>
                    <td className="px-5 py-3.5"><span className="text-sm text-ink-600 truncate max-w-[180px] block">{p.email}</span></td>
                    <td className="px-5 py-3.5"><span className="text-sm text-ink-600">{p.groupsJoined}</span></td>
                    <td className="px-5 py-3.5"><span className="text-sm text-ink-600">{p.contributionCount}</span></td>
                    <td className="px-5 py-3.5"><span className="font-display font-bold text-ink-900 text-sm">{formatKES(p.totalContributed)}</span></td>
                    <td className="px-5 py-3.5"><StatusBadge status={p.status} /></td>
                    <td className="px-5 py-3.5"><span className="text-xs text-ink-500">{dateOnly(p.registeredAt)}</span></td>
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
