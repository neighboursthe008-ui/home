import { useState, useEffect } from 'react';
import { Search, Building2, Users, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { GroupAvatar, Avatar } from '@/components/ui/Avatar';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Link } from '@/components/router';
import { searchAll } from '@/lib/api';
import { formatCompactKES, classNames } from '@/lib/format';
import type { Group } from '@/types';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [profiles, setProfiles] = useState<Array<{ id: string; umojaId: string; fullName: string; phone: string; avatarColor: string; totalContributed: number }>>([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setGroups([]); setProfiles([]); setSearched(false);
      return;
    }
    const timer = setTimeout(() => {
      searchAll(query.trim()).then((r) => {
        setGroups(r.groups);
        setProfiles(r.profiles);
        setSearched(true);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink-900">Search</h1>
        <p className="text-sm text-ink-500 mt-1">Find groups and members across UMOJA</p>
      </div>

      <Card padding="md">
        <Input
          placeholder="Search by name, UMOJA ID, phone, group ID, category..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
          className="w-full"
          autoFocus
        />
      </Card>

      {!query.trim() && (
        <Card><EmptyState icon={<Search className="w-8 h-8" />} title="Start searching" description="Type a name, ID, or phone number to find groups and members." /></Card>
      )}

      {searched && query.trim() && (
        <>
          {/* Groups results */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-ink-400" />
              <h2 className="font-display font-semibold text-ink-900">Groups ({groups.length})</h2>
            </div>
            {groups.length === 0 ? (
              <Card padding="sm"><div className="py-4 text-center text-sm text-ink-400">No groups found</div></Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((g) => (
                  <Link to="group-dashboard" params={{ id: g.id }} key={g.id}>
                    <Card hover padding="md" className="h-full">
                      <div className="flex items-start gap-3">
                        <GroupAvatar name={g.name} color={g.logoColor} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-ink-900 truncate">{g.name}</div>
                          <div className="text-xs text-ink-400 font-mono">{g.groupId}</div>
                          <div className="mt-2"><StatusBadge status={g.status} /></div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Badge tone="neutral">{g.category}</Badge>
                        <span className="text-xs text-ink-400">{formatCompactKES(g.totalContributions)}</span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Members results */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-ink-400" />
              <h2 className="font-display font-semibold text-ink-900">Members ({profiles.length})</h2>
            </div>
            {profiles.length === 0 ? (
              <Card padding="sm"><div className="py-4 text-center text-sm text-ink-400">No members found</div></Card>
            ) : (
              <Card padding="none" className="overflow-hidden">
                <div className="divide-y divide-ink-100">
                  {profiles.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 p-4 hover:bg-ink-50/50 transition-colors">
                      <Avatar name={p.fullName} color={p.avatarColor} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-ink-900 truncate">{p.fullName}</div>
                        <div className="text-xs text-ink-400 font-mono">{p.umojaId}</div>
                      </div>
                      <span className="text-sm text-ink-500">{formatCompactKES(p.totalContributed)}</span>
                      <ArrowRight className="w-4 h-4 text-ink-300" />
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
