import { useState, useEffect } from 'react';
import { ShieldCheck, ChevronLeft, Search } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRouter } from '@/components/router';
import { fetchAuditLog } from '@/lib/api';
import { fullDate, classNames } from '@/lib/format';

export function ActivityLogPage({ groupId }: { groupId?: string }) {
  const { navigate } = useRouter();
  const [entries, setEntries] = useState<Array<{ id: string; actor: string; action: string; object: string; createdAt: string; result: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAuditLog(100).then((e) => { setEntries(e); setLoading(false); });
  }, []);

  const filtered = entries.filter((e) =>
    e.action.toLowerCase().includes(search.toLowerCase()) ||
    e.actor.toLowerCase().includes(search.toLowerCase()) ||
    e.object.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('group-dashboard', { id: groupId || '' })} className="flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-ink-900 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Group
      </button>

      <div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink-900">Activity Log</h1>
        <p className="text-sm text-ink-500 mt-1">Audit trail of all actions in the system</p>
      </div>

      <Card padding="md">
        <Input placeholder="Search by action, actor, or object..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="w-4 h-4" />} className="w-full" />
      </Card>

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-sm text-ink-400">Loading activity log...</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<ShieldCheck className="w-8 h-8" />} title="No activity logged" description="Actions will be recorded here automatically." />
        ) : (
          <div className="divide-y divide-ink-100">
            {filtered.map((e) => (
              <div key={e.id} className="flex items-center gap-4 p-4 hover:bg-ink-50/50 transition-colors">
                <div className={classNames('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', e.result === 'success' ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-600')}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink-900">{e.action}</span>
                    <Badge tone={e.result === 'success' ? 'success' : 'danger'}>{e.result}</Badge>
                  </div>
                  <div className="text-xs text-ink-400 mt-0.5">
                    by <span className="font-semibold text-ink-600">{e.actor}</span>
                    {e.object && <> · <span className="font-mono">{e.object}</span></>}
                  </div>
                </div>
                <div className="text-xs text-ink-400 shrink-0">{fullDate(e.createdAt)}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
