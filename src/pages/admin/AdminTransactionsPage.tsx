import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Search, Download } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { fetchAllTransactions } from '@/lib/api';
import { formatKES, dateOnly, timeOnly, classNames } from '@/lib/format';
import type { Contribution } from '@/types';

const paymentMethodLabel: Record<string, string> = { m_pesa: 'M-Pesa', bank: 'Bank Transfer', card: 'Card', other: 'Other' };
const PAGE_SIZE = 15;

export function AdminTransactionsPage() {
  const toast = useToast();
  const [transactions, setTransactions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetchAllTransactions(200).then((t) => { setTransactions(t); setLoading(false); });
  }, []);

  const filtered = useMemo(() => transactions.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.paymentReference.toLowerCase().includes(q) || c.contributorName.toLowerCase().includes(q) || c.transactionId.toLowerCase().includes(q) || c.groupName.toLowerCase().includes(q);
    }
    return true;
  }), [transactions, search, statusFilter, typeFilter]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const totalAmount = filtered.filter((c) => c.status === 'successful').reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink-900">All Transactions</h1>
          <p className="text-sm text-ink-500 mt-1">{filtered.length} transactions · {formatKES(totalAmount)} total</p>
        </div>
        <button className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border border-ink-200 bg-white text-ink-700 hover:bg-ink-50 text-sm font-semibold transition-colors" onClick={() => toast('success', 'Export started.')}>
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <Card padding="md">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input placeholder="Search by reference, name, group, or ID..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} leftIcon={<Search className="w-4 h-4" />} className="flex-1" />
          <Select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }} className="min-w-[120px]">
            <option value="all">All Types</option>
            <option value="contribution">Contribution</option>
            <option value="top_up">Top-up</option>
          </Select>
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} className="min-w-[120px]">
            <option value="all">All Status</option>
            <option value="successful">Successful</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </Select>
        </div>
      </Card>

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-sm text-ink-400">Loading...</div>
        ) : paged.length === 0 ? (
          <EmptyState icon={<TrendingUp className="w-8 h-8" />} title="No transactions found" description="Try adjusting your filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/50">
                  {['Date', 'Contributor', 'Group', 'Type', 'Amount', 'Fee', 'Reference', 'Status'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-ink-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {paged.map((c) => (
                  <tr key={c.id} className="hover:bg-ink-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-ink-900">{dateOnly(c.createdAt)}</div>
                      <div className="text-xs text-ink-400">{timeOnly(c.createdAt)}</div>
                    </td>
                    <td className="px-5 py-4"><span className="text-sm font-medium text-ink-900">{c.contributorName || 'Anonymous'}</span></td>
                    <td className="px-5 py-4"><span className="text-sm text-ink-600">{c.groupName}</span></td>
                    <td className="px-5 py-4"><Badge tone={c.type === 'top_up' ? 'success' : 'brand'}>{c.type === 'top_up' ? 'Top-up' : 'Contribution'}</Badge></td>
                    <td className="px-5 py-4"><span className="font-display font-bold text-ink-900">{formatKES(c.amount)}</span></td>
                    <td className="px-5 py-4"><span className="text-sm text-ink-500">{c.fee > 0 ? formatKES(c.fee) : '—'}</span></td>
                    <td className="px-5 py-4"><span className="font-mono text-xs text-ink-600 bg-ink-50 px-2 py-1 rounded">{c.paymentReference}</span></td>
                    <td className="px-5 py-4"><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center gap-1.5 justify-center">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} onClick={() => setPage(i)} className={classNames('w-9 h-9 rounded-lg text-sm font-semibold transition-colors', page === i ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100')}>{i + 1}</button>
          ))}
        </div>
      )}
    </div>
  );
}
