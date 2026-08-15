import { useState, useEffect } from 'react';
import { Users, Search, ChevronLeft, MoreVertical, UserPlus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRouter } from '@/components/router';
import { useAuth } from '@/lib/auth';
import { fetchGroupMembers } from '@/lib/api';
import { formatKES, dateOnly, classNames } from '@/lib/format';
import type { GroupMemberRow } from '@/types';

export function MembersPage({ groupId }: { groupId?: string }) {
  const { navigate } = useRouter();
  const { profile } = useAuth();
  const [members, setMembers] = useState<GroupMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!groupId) return;
    fetchGroupMembers(groupId).then((m) => { setMembers(m); setLoading(false); });
  }, [groupId]);

  const filtered = members.filter((m) =>
    m.fullName.toLowerCase().includes(search.toLowerCase()) ||
    m.umojaId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('group-dashboard', { id: groupId || '' })} className="flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-ink-900 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Group
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink-900">Members</h1>
          <p className="text-sm text-ink-500 mt-1">{members.length} members in this group</p>
        </div>
        <Button leftIcon={<UserPlus className="w-4 h-4" />}>Invite Member</Button>
      </div>

      <Card padding="md">
        <Input placeholder="Search members by name or UMOJA ID..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="w-4 h-4" />} className="w-full" />
      </Card>

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-sm text-ink-400">Loading members...</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Users className="w-8 h-8" />} title="No members found" description="Try a different search." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/50">
                  {['Member', 'UMOJA ID', 'Phone', 'Role', 'Status', 'Total', 'Joined', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-ink-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-ink-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={m.fullName} color={m.avatarColor} size="sm" />
                        <span className="text-sm font-medium text-ink-900">{m.fullName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><span className="font-mono text-xs text-ink-600">{m.umojaId}</span></td>
                    <td className="px-5 py-3.5"><span className="text-sm text-ink-600">{m.phone}</span></td>
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
    </div>
  );
}
