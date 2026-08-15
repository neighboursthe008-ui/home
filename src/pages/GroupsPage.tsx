import { useState, useEffect } from 'react';
import { Plus, Search, Building2, Users, Wallet, MapPin, Copy } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GroupAvatar } from '@/components/ui/Avatar';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Link, useRouter } from '@/components/router';
import { useAuth } from '@/lib/auth';
import { fetchMyGroups } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { formatCompactKES, classNames } from '@/lib/format';
import type { Group } from '@/types';

const roleLabel: Record<string, string> = {
  super_admin: 'Super Admin', group_admin: 'Group Admin', treasurer: 'Treasurer',
  secretary: 'Secretary', member: 'Member', viewer: 'Viewer',
};

export function GroupsPage() {
  const { navigate } = useRouter();
  const { profile } = useAuth();
  const toast = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'pending'>('all');

  useEffect(() => {
    if (!profile?.id) return;
    fetchMyGroups(profile.id).then((g) => { setGroups(g); setLoading(false); });
  }, [profile?.id]);

  const filtered = groups.filter((g) => {
    if (filter === 'active' && g.status !== 'active') return false;
    if (filter === 'pending' && g.status !== 'pending_verification') return false;
    if (search) {
      const q = search.toLowerCase();
      return g.name.toLowerCase().includes(q) || g.groupId.toLowerCase().includes(q) || g.category.toLowerCase().includes(q) || (g.walletNumber || '').includes(q);
    }
    return true;
  });

  const copyWallet = (e: React.MouseEvent, num: string) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard?.writeText(num);
    toast('success', 'Wallet number copied.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink-900">My Groups</h1>
          <p className="text-sm text-ink-500 mt-1">{groups.length} groups · One UMOJA ID across all of them.</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => navigate('dashboard')}>Create New Group</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Search by name, ID, category, or wallet number..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="w-4 h-4" />} className="flex-1" />
        <div className="flex gap-2">
          {(['all', 'active', 'pending'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={classNames(
              'px-4 h-11 rounded-xl text-sm font-semibold transition-colors capitalize',
              filter === f ? 'bg-brand-600 text-white' : 'bg-white border border-ink-200 text-ink-600 hover:bg-ink-50',
            )}>
              {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Pending'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Card><div className="py-12 text-center text-sm text-ink-400">Loading groups...</div></Card>
      ) : filtered.length === 0 ? (
        <Card><EmptyState icon={<Building2 className="w-8 h-8" />} title="No groups found" description="Create a new group or adjust your search." action={<Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => navigate('dashboard')}>Create Group</Button>} /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((g) => (
            <Link to="group-dashboard" params={{ id: g.id }} key={g.id}>
              <Card hover padding="md" className="h-full">
                <div className="flex items-start gap-3">
                  <GroupAvatar name={g.name} color={g.logoColor} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-ink-900 truncate">{g.name}</div>
                    <div className="text-xs text-ink-400 font-mono mt-0.5">{g.groupId}</div>
                    <div className="mt-2"><StatusBadge status={g.status} /></div>
                  </div>
                </div>
                <p className="text-sm text-ink-500 mt-3 line-clamp-2">{g.description}</p>
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <Badge tone="neutral">{g.category}</Badge>
                  {g.myRole && <Badge tone="brand">{roleLabel[g.myRole]}</Badge>}
                </div>

                {/* Wallet number */}
                {g.walletNumber && (
                  <div className="mt-3 p-2.5 rounded-lg bg-ink-50 flex items-center gap-2">
                    <Wallet className="w-3.5 h-3.5 text-ink-400 shrink-0" />
                    <span className="text-xs text-ink-500">Wallet:</span>
                    <span className="font-mono text-xs font-bold text-ink-900 flex-1">{g.walletNumber}</span>
                    <button onClick={(e) => copyWallet(e, g.walletNumber!)} className="text-ink-400 hover:text-brand-600 transition-colors">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Admins */}
                {g.founders.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-ink-100">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-ink-400 mb-1.5">Group Admins</div>
                    <div className="text-xs text-ink-600 truncate">
                      {g.founders.map((f) => f.fullName).join(', ')}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-ink-100 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-xs text-ink-400 font-medium">Total</div>
                    <div className="font-display font-bold text-ink-900 text-sm mt-0.5">{formatCompactKES(g.totalContributions)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-ink-400 font-medium">Members</div>
                    <div className="font-display font-bold text-ink-900 text-sm mt-0.5">{g.registeredMembers}</div>
                  </div>
                  <div>
                    <div className="text-xs text-ink-400 font-medium">My Share</div>
                    <div className="font-display font-bold text-brand-600 text-sm mt-0.5">{formatCompactKES(g.myTotalContributed)}</div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}

          <button onClick={() => navigate('dashboard')} className="rounded-2xl border-2 border-dashed border-ink-200 hover:border-brand-300 hover:bg-brand-50/30 transition-all flex flex-col items-center justify-center p-8 min-h-[260px] group">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-7 h-7" />
            </div>
            <div className="font-display font-semibold text-ink-900 mt-3">Create New Group</div>
            <div className="text-xs text-ink-500 mt-1 text-center max-w-[200px]">Three founders, OTP-verified, ready in minutes.</div>
          </button>
        </div>
      )}
    </div>
  );
}
