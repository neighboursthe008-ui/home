import { useState, useEffect } from 'react';
import { Settings, Save, Percent, DollarSign } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth';
import { getFeeConfig, updateFeeConfig } from '@/lib/api';
import type { FeeConfig } from '@/types';

export function AdminSettingsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [config, setConfig] = useState<FeeConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeeConfig().then((c) => { setConfig(c); setLoading(false); });
  }, []);

  const handleSave = async () => {
    if (!config || !user) return;
    setSaving(true);
    try {
      await updateFeeConfig(config, user.id);
      toast('success', 'Fee configuration updated.');
    } catch {
      toast('error', 'Failed to update fee configuration.');
    }
    setSaving(false);
  };

  if (loading) return <div className="py-12 text-center text-sm text-ink-400">Loading settings...</div>;
  if (!config) return <Card><div className="py-8 text-center text-sm text-ink-400">No fee configuration found.</div></Card>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink-900">Platform Settings</h1>
        <p className="text-sm text-ink-500 mt-1">Configure transaction fees and platform behavior</p>
      </div>

      <Card padding="md">
        <CardHeader title="Transaction Fees" subtitle="Fees charged for each transaction type" icon={<Settings className="w-5 h-5" />} />
        <div className="space-y-6">
          {/* Top-up fees */}
          <div>
            <h4 className="text-sm font-bold text-ink-900 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-brand-600" /> Wallet Top-Up Fees
            </h4>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Percentage Fee (%)"
                type="number"
                step="0.1"
                value={config.topUpFeePct}
                onChange={(e) => setConfig({ ...config, topUpFeePct: parseFloat(e.target.value) || 0 })}
                leftIcon={<Percent className="w-4 h-4" />}
                hint="Charged as a percentage of the top-up amount"
              />
              <Input
                label="Flat Fee (KES)"
                type="number"
                value={config.topUpFeeFlat}
                onChange={(e) => setConfig({ ...config, topUpFeeFlat: parseInt(e.target.value) || 0 })}
                leftIcon={<DollarSign className="w-4 h-4" />}
                hint="Added on top of the percentage fee"
              />
            </div>
          </div>

          {/* Contribution fees */}
          <div>
            <h4 className="text-sm font-bold text-ink-900 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-secondary-600" /> Contribution Fees
            </h4>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Percentage Fee (%)"
                type="number"
                step="0.1"
                value={config.contributionFeePct}
                onChange={(e) => setConfig({ ...config, contributionFeePct: parseFloat(e.target.value) || 0 })}
                leftIcon={<Percent className="w-4 h-4" />}
                hint="Charged on each contribution"
              />
              <Input
                label="Flat Fee (KES)"
                type="number"
                value={config.contributionFeeFlat}
                onChange={(e) => setConfig({ ...config, contributionFeeFlat: parseInt(e.target.value) || 0 })}
                leftIcon={<DollarSign className="w-4 h-4" />}
                hint="Added on top of the percentage fee"
              />
            </div>
          </div>

          {/* Wallet transfer fees */}
          <div>
            <h4 className="text-sm font-bold text-ink-900 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-accent-600" /> Wallet Transfer Fees
            </h4>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Percentage Fee (%)"
                type="number"
                step="0.1"
                value={config.walletTransferFeePct}
                onChange={(e) => setConfig({ ...config, walletTransferFeePct: parseFloat(e.target.value) || 0 })}
                leftIcon={<Percent className="w-4 h-4" />}
                hint="Charged on wallet-to-wallet transfers"
              />
              <Input
                label="Flat Fee (KES)"
                type="number"
                value={config.walletTransferFeeFlat}
                onChange={(e) => setConfig({ ...config, walletTransferFeeFlat: parseInt(e.target.value) || 0 })}
                leftIcon={<DollarSign className="w-4 h-4" />}
                hint="Added on top of the percentage fee"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-ink-100">
            <Button leftIcon={<Save className="w-4 h-4" />} loading={saving} onClick={handleSave}>Save Configuration</Button>
          </div>
        </div>
      </Card>

      {/* Fee preview */}
      <Card padding="md">
        <CardHeader title="Fee Preview" subtitle="Example fees for common amounts" icon={<DollarSign className="w-5 h-5" />} />
        <div className="grid sm:grid-cols-3 gap-4">
          {[1000, 5000, 10000].map((amt) => {
            const topUpFee = Math.round((amt * config.topUpFeePct) / 100) + config.topUpFeeFlat;
            const contribFee = Math.round((amt * config.contributionFeePct) / 100) + config.contributionFeeFlat;
            return (
              <div key={amt} className="p-4 rounded-xl bg-ink-50">
                <div className="font-display font-bold text-ink-900 text-lg">KES {amt.toLocaleString()}</div>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between text-ink-600"><span>Top-up fee</span><span className="font-semibold">KES {topUpFee.toLocaleString()}</span></div>
                  <div className="flex justify-between text-ink-600"><span>Contribution fee</span><span className="font-semibold">KES {contribFee.toLocaleString()}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
