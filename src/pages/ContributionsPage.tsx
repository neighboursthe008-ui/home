import { useState, useEffect, useMemo } from 'react';
import {
  Wallet, Search, Download, Eye, ArrowDownToLine,
  ArrowUpRight, Calendar, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { GroupAvatar } from '@/components/ui/Avatar';
import { useAuth } from '@/lib/auth';
import { useWalletUI } from '@/lib/wallet-ui';
import { fetchMyTransactions, fetchMyGroups } from '@/lib/api';
import type { Contribution, Group } from '@/types';
import { formatKES, fullDate, dateOnly, timeOnly, classNames } from '@/lib/format';

const PAGE_SIZE = 8;

const paymentMethodLabel: Record<string, string> = {
  m_pesa: 'M-Pesa', bank: 'Bank Transfer', card: 'Card', other: 'Other',
};

export function ContributionsPage() {
  const { profile } = useAuth();
  const { openContribute, openTopUp } = useWalletUI();
  const toast = useToast();
  const [transactions, setTransactions] = useState<Contribution[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Contribution | null>(null);

  useEffect(() => {
    if (!profile?.id) return;
    Promise.all([fetchMyTransactions(profile.id), fetchMyGroups(profile.id)]).then(([t, g]) => {
      setTransactions(t);
      setGroups(g);
      setLoading(false);
    });
  }, [profile?.id]);

  const filtered = useMemo(() => {
    return transactions.filter((c) => {
      if (groupFilter !== 'all' && c.groupId !== groupFilter) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          c.paymentReference.toLowerCase().includes(q) ||
          c.groupName.toLowerCase().includes(q) ||
          c.transactionId.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [transactions, search, groupFilter, statusFilter]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const totalAmount = filtered.filter((c) => c.status === 'successful' && c.type === 'contribution').reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink-900">My Contributions</h1>
          <p className="text-sm text-ink-500 mt-1">Complete history across all your groups.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="md" leftIcon={<ArrowDownToLine className="w-4 h-4" />} onClick={openTopUp}>Top Up</Button>
          <Button size="md" leftIcon={<Wallet className="w-4 h-4" />} onClick={() => openContribute()}>Contribute</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Transactions', value: String(filtered.length) },
          { label: 'Total Contributed', value: formatKES(totalAmount) },
          { label: 'Successful', value: String(filtered.filter((c) => c.status === 'successful').length) },
          { label: 'Pending', value: String(filtered.filter((c) => c.status === 'pending').length) },
        ].map((s) => (
          <div key={s.label} className="card-premium px-4 py-3">
            <div className="text-xs text-ink-400 font-medium">{s.label}</div>
            <div className="font-display font-bold text-ink-900 text-lg mt-0.5">{s.value}</div>
          </div>
        ))}
      </div>

      <Card padding="md">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search by reference, group, or ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            leftIcon={<Search className="w-4 h-4" />}
            className="flex-1"
          />
          <Select value={groupFilter} onChange={(e) => { setGroupFilter(e.target.value); setPage(0); }} className="min-w-[140px]">
            <option value="all">All Groups</option>
            {groups.filter((g) => g.id).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select>
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} className="min-w-[120px]">
            <option value="all">All Status</option>
            <option value="successful">Successful</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </Select>
        </div>
      </Card>

      <Card padding="none" className="hidden lg:block overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-sm text-ink-400">Loading transactions...</div>
        ) : paged.length === 0 ? (
          <EmptyState icon={<Wallet className="w-8 h-8" />} title="No transactions found" description="Make your first contribution to see it here." action={<Button onClick={() => openContribute()} leftIcon={<Wallet className="w-4 h-4" />}>Contribute</Button>} />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/50">
                {['Date', 'Group', 'Type', 'Amount', 'Fee', 'Reference', 'Status', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-ink-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {paged.map((c) => (
                <tr key={c.id} className="hover:bg-ink-50/50 transition-colors group cursor-pointer" onClick={() => setSelected(c)}>
                  <td className="px-5 py-4">
                    <div className="text-sm font-medium text-ink-900">{dateOnly(c.createdAt)}</div>
                    <div className="text-xs text-ink-400">{timeOnly(c.createdAt)}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <GroupAvatar name={c.groupName} color={c.groupLogoColor} size="sm" />
                      <span className="text-sm font-medium text-ink-900">{c.groupName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={c.type === 'top_up' ? 'success' : 'brand'}>{c.type === 'top_up' ? 'Top-up' : 'Contribution'}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-display font-bold text-ink-900">{c.type === 'top_up' ? '+' : ''}{formatKES(c.amount)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-ink-500">{c.fee > 0 ? formatKES(c.fee) : '—'}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs text-ink-600 bg-ink-50 px-2 py-1 rounded">{c.paymentReference}</span>
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={c.status} /></td>
                  <td className="px-5 py-4">
                    <Eye className="w-4 h-4 text-ink-300 group-hover:text-brand-500 transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {paged.map((c) => (
          <Card key={c.id} padding="sm" onClick={() => setSelected(c)}>
            <div className="flex items-center gap-3">
              <GroupAvatar name={c.groupName} color={c.groupLogoColor} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-ink-900 truncate">{c.type === 'top_up' ? 'Wallet Top-up' : c.groupName}</div>
                <div className="text-xs text-ink-400">{dateOnly(c.createdAt)} · {timeOnly(c.createdAt)}</div>
              </div>
              <StatusBadge status={c.status} />
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="font-display font-bold text-lg text-ink-900">{formatKES(c.amount)}</div>
                <div className="text-xs text-ink-400 font-mono">{c.paymentReference}</div>
              </div>
              {c.fee > 0 && <div className="text-xs text-ink-500">Fee: {formatKES(c.fee)}</div>}
            </div>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink-500">Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} leftIcon={<ChevronLeft className="w-4 h-4" />}>Prev</Button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i)} className={classNames('w-9 h-9 rounded-lg text-sm font-semibold transition-colors', page === i ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100')}>{i + 1}</button>
            ))}
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} rightIcon={<ChevronRight className="w-4 h-4" />}>Next</Button>
          </div>
        </div>
      )}

      <ContributionModal contribution={selected} onClose={() => setSelected(null)} onDownload={() => toast('success', `Receipt ${selected?.transactionId} downloaded.`)} />
    </div>
  );
}

function ContributionModal({ contribution, onClose, onDownload }: { contribution: Contribution | null; onClose: () => void; onDownload: () => void }) {
  if (!contribution) return null;
  const c = contribution;
  return (
    <Modal open={!!c} onClose={onClose} title="Transaction Details" size="md" footer={
      <>
        <Button variant="outline" onClick={onClose}>Close</Button>
        <Button onClick={onDownload} leftIcon={<Download className="w-4 h-4" />}>Download Receipt</Button>
      </>
    }>
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-ink-50">
          <GroupAvatar name={c.groupName} color={c.groupLogoColor} size="lg" />
          <div className="flex-1">
            <div className="font-display font-bold text-lg text-ink-900">{formatKES(c.amount)}</div>
            <div className="text-sm text-ink-500">{c.type === 'top_up' ? 'Wallet Top-up' : c.groupName}</div>
          </div>
          <StatusBadge status={c.status} />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {[
            { label: 'Transaction ID', value: c.transactionId },
            { label: 'Payment Reference', value: c.paymentReference },
            { label: 'Payment Method', value: paymentMethodLabel[c.paymentMethod] || c.paymentMethod },
            { label: 'Type', value: c.type === 'top_up' ? 'Wallet Top-up' : 'Contribution' },
            { label: 'Date', value: dateOnly(c.createdAt) },
            { label: 'Time', value: timeOnly(c.createdAt) },
            { label: 'Amount', value: formatKES(c.amount) },
            { label: 'Fee', value: c.fee > 0 ? formatKES(c.fee) : 'Free' },
          ].map((row) => (
            <div key={row.label}>
              <div className="text-xs text-ink-400 font-medium">{row.label}</div>
              <div className="text-sm font-semibold text-ink-900 mt-0.5 font-mono">{row.value}</div>
            </div>
          ))}
        </div>
        <div className="p-4 rounded-xl border border-ink-100">
          <div className="flex items-center gap-2 text-xs text-ink-500 mb-2"><Calendar className="w-3.5 h-3.5" /> Full timestamp</div>
          <div className="text-sm text-ink-700">{fullDate(c.createdAt)}</div>
        </div>
      </div>
    </Modal>
  );
}
