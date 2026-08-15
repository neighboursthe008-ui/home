import { useState, useEffect } from 'react';
import { Settings, ChevronLeft, Building2, Wallet, Users, ShieldCheck, Save } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from '@/components/router';
import { useAuth } from '@/lib/auth';
import { fetchMyGroups } from '@/lib/api';
import { formatKES, dateOnly, classNames } from '@/lib/format';
import type { Group } from '@/types';

export function GroupSettingsPage({ groupId }: { groupId?: string }) {
  const { navigate } = useRouter();
  const { profile } = useAuth();
  const toast = useToast();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    fetchMyGroups(profile.id).then((groups) => {
      setGroup(groups.find((g) => g.id === groupId) ?? groups[0] ?? null);
      setLoading(false);
    });
  }, [profile?.id, groupId]);

  if (loading) return <div className="py-12 text-center text-sm text-ink-400">Loading settings...</div>;
  if (!group) return <Card><div className="py-8 text-center text-sm text-ink-400">Group not found.</div></Card>;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('group-dashboard', { id: group.id })} className="flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-ink-900 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Group
      </button>

      <div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink-900">Group Settings</h1>
        <p className="text-sm text-ink-500 mt-1">Manage group details, wallet, and founders</p>
      </div>

      {/* Group info */}
      <Card padding="md">
        <CardHeader title="Group Information" subtitle="Basic group details" icon={<Building2 className="w-5 h-5" />} />
        <div className="space-y-4">
          <Input label="Group Name" defaultValue={group.name} />
          <Input label="Group ID" defaultValue={group.groupId} disabled hint="Group ID cannot be changed" />
          <Input label="Category" defaultValue={group.category} />
          <Input label="Description" defaultValue={group.description} />
          <Input label="Location" defaultValue={group.location} />
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-ink-700">Status:</span>
            <StatusBadge status={group.status} />
          </div>
          <Button leftIcon={<Save className="w-4 h-4" />} onClick={() => toast('success', 'Settings saved.')}>Save Changes</Button>
        </div>
      </Card>

      {/* Wallet info */}
      <Card padding="md">
        <CardHeader title="Group Wallet" subtitle="Wallet details for receiving contributions" icon={<Wallet className="w-5 h-5" />} />
        <div className="p-4 rounded-2xl bg-gradient-to-br from-ink-900 to-brand-900 text-white">
          <div className="text-xs text-brand-200 font-medium">Wallet Number</div>
          <div className="font-mono font-bold text-xl mt-1">{group.walletNumber || 'Not assigned'}</div>
          <div className="mt-3 text-xs text-brand-200">Total Collected</div>
          <div className="font-display font-bold text-2xl">{formatKES(group.totalContributions)}</div>
        </div>
      </Card>

      {/* Founders */}
      <Card padding="md">
        <CardHeader title="Group Founders" subtitle="Three verified founders (admins)" icon={<ShieldCheck className="w-5 h-5" />} />
        <div className="grid sm:grid-cols-3 gap-4">
          {group.founders.map((f, i) => (
            <div key={i} className="p-4 rounded-xl border border-ink-100 flex items-center gap-3">
              <Avatar name={f.fullName} color="bg-brand-500" size="md" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-ink-900 truncate">{f.fullName}</div>
                <div className="text-xs text-ink-400 font-mono">{f.phone}</div>
              </div>
              <Badge tone={f.verified ? 'success' : 'warning'} dot>{f.verified ? 'Verified' : 'Pending'}</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Danger zone */}
      <Card padding="md">
        <CardHeader title="Danger Zone" subtitle="Irreversible actions" icon={<Settings className="w-5 h-5" />} />
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl border border-danger-200 bg-danger-50/50">
            <div>
              <div className="font-semibold text-ink-900 text-sm">Suspend Group</div>
              <div className="text-xs text-ink-500 mt-0.5">Temporarily disable contributions</div>
            </div>
            <Button variant="danger" size="sm" onClick={() => toast('warning', 'Suspend requires admin confirmation.')}>Suspend</Button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl border border-danger-200 bg-danger-50/50">
            <div>
              <div className="font-semibold text-ink-900 text-sm">Close Group</div>
              <div className="text-xs text-ink-500 mt-0.5">Permanently close this group</div>
            </div>
            <Button variant="danger" size="sm" onClick={() => toast('warning', 'Close requires admin confirmation.')}>Close</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
