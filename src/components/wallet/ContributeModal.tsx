import { useState } from 'react';
import { Wallet, Search, ShieldCheck, Loader2, CheckCircle2, ArrowRight, Building2, Users, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth';
import { lookupGroupByWalletNumber, contributeToGroup } from '@/lib/api';
import { formatKES, classNames } from '@/lib/format';
import type { FeeConfig, Group } from '@/types';

export function ContributeModal({ open, onClose, feeConfig, onSuccess, prefillWalletNumber }: {
  open: boolean;
  onClose: () => void;
  feeConfig: FeeConfig | null;
  onSuccess: () => void;
  prefillWalletNumber?: string;
}) {
  const { wallet, profile } = useAuth();
  const toast = useToast();
  const [step, setStep] = useState<'enter_number' | 'group_found' | 'enter_amount' | 'enter_pin' | 'processing' | 'success'>('enter_number');
  const [walletNumber, setWalletNumber] = useState(prefillWalletNumber || '');
  const [group, setGroup] = useState<Group | null>(null);
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setStep('enter_number'); setGroup(null); setAmount(''); setPin(''); setLoading(false);
    if (!prefillWalletNumber) setWalletNumber('');
  };

  const handleLookup = async () => {
    if (!walletNumber || walletNumber.length < 10) { toast('warning', 'Enter a valid wallet number.'); return; }
    setLoading(true);
    const result = await lookupGroupByWalletNumber(walletNumber);
    setLoading(false);
    if (result.error || !result.group) {
      toast('error', result.error || 'Group not found.');
      return;
    }
    setGroup(result.group);
    setStep('group_found');
  };

  const amt = parseInt(amount) || 0;
  const fee = feeConfig ? Math.round((amt * feeConfig.contributionFeePct) / 100) + feeConfig.contributionFeeFlat : 0;
  const total = amt + fee;

  const handleContribute = async () => {
    if (pin.length < 4) { toast('warning', 'Enter your 4-digit PIN.'); return; }
    setStep('processing');
    const result = await contributeToGroup(walletNumber, amt, pin, fee);
    if (result.error) {
      toast('error', result.error);
      setStep('enter_pin');
      return;
    }
    setStep('success');
  };

  const handleClose = () => { reset(); onClose(); };
  const handleDone = () => { reset(); onClose(); onSuccess(); if (group) toast('success', `KES ${amt.toLocaleString()} contributed to ${group.name}.`); };

  return (
    <Modal open={open} onClose={handleClose} title="Contribute to a Group" size="sm">
      {/* Step 1: Enter group wallet number */}
      {step === 'enter_number' && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-ink-50">
            <div className="text-xs text-ink-400 font-medium">Your Wallet Balance</div>
            <div className="font-display font-bold text-xl text-ink-900 mt-0.5">{formatKES(wallet?.balance ?? 0)}</div>
          </div>
          <Input
            label="Group Wallet Number"
            placeholder="e.g. 200839274610"
            value={walletNumber}
            onChange={(e) => setWalletNumber(e.target.value.replace(/[^0-9]/g, ''))}
            leftIcon={<Search className="w-4 h-4" />}
            hint="Enter the 12-digit wallet number of the group you want to contribute to."
          />
          <Button className="w-full" size="lg" onClick={handleLookup} loading={loading} leftIcon={<Search className="w-4 h-4" />}>
            Find Group
          </Button>
        </div>
      )}

      {/* Step 2: Confirm group */}
      {step === 'group_found' && group && (
        <div className="space-y-5">
          <div className="text-center">
            <div className={classNames('w-16 h-16 rounded-2xl flex items-center justify-center text-white font-display font-bold text-xl mx-auto', group.logoColor)}>
              {group.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}
            </div>
            <h3 className="font-display font-bold text-lg text-ink-900 mt-3">{group.name}</h3>
            <p className="text-xs text-ink-400 font-mono mt-0.5">{group.groupId}</p>
          </div>
          <div className="p-4 rounded-xl bg-ink-50 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-ink-400" />
              <span className="text-ink-600">{group.category}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Wallet className="w-4 h-4 text-ink-400" />
              <span className="text-ink-600">Wallet: <span className="font-mono font-semibold text-ink-900">{group.walletNumber}</span></span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-ink-400" />
              <span className="text-ink-600">{group.registeredMembers} registered members</span>
            </div>
          </div>
          <div className="text-xs text-ink-500 p-3 rounded-lg bg-brand-50 border border-brand-100">
            <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-brand-600" />
            Verify this is the correct group before proceeding.
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { setGroup(null); setStep('enter_number'); }}>Back</Button>
            <Button className="flex-1" onClick={() => setStep('enter_amount')} rightIcon={<ArrowRight className="w-4 h-4" />}>Continue</Button>
          </div>
        </div>
      )}

      {/* Step 3: Enter amount */}
      {step === 'enter_amount' && group && (
        <div className="space-y-5">
          <div className="p-3 rounded-xl bg-ink-50 flex items-center gap-3">
            <div className={classNames('w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm', group.logoColor)}>
              {group.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-ink-900 truncate">{group.name}</div>
              <div className="text-xs text-ink-400 font-mono">{group.walletNumber}</div>
            </div>
          </div>
          <Input
            label="Amount (KES)"
            type="number"
            placeholder="e.g. 5000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            leftIcon={<Wallet className="w-4 h-4" />}
            hint={`Available: ${formatKES(wallet?.balance ?? 0)}`}
          />
          {amt > 0 && (
            <div className="p-3 rounded-xl bg-ink-50 space-y-1.5 text-sm">
              <div className="flex justify-between text-ink-600"><span>Contribution</span><span className="font-semibold">{formatKES(amt)}</span></div>
              <div className="flex justify-between text-ink-600"><span>Transaction fee</span><span className="font-semibold">{formatKES(fee)}</span></div>
              <div className="flex justify-between text-ink-900 font-bold pt-1.5 border-t border-ink-200"><span>Total deducted</span><span>{formatKES(total)}</span></div>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep('group_found')}>Back</Button>
            <Button className="flex-1" onClick={() => setStep('enter_pin')} disabled={!amt || amt < 1} rightIcon={<ArrowRight className="w-4 h-4" />}>Continue</Button>
          </div>
        </div>
      )}

      {/* Step 4: Enter PIN */}
      {step === 'enter_pin' && group && (
        <div className="space-y-5">
          <div className="p-3 rounded-xl bg-ink-50 flex items-center justify-between text-sm">
            <span className="text-ink-600">Contributing to</span>
            <span className="font-semibold text-ink-900">{group.name}</span>
          </div>
          <div className="p-3 rounded-xl bg-ink-50 flex items-center justify-between text-sm">
            <span className="text-ink-600">Amount + Fee</span>
            <span className="font-bold text-ink-900">{formatKES(total)}</span>
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1.5">Enter your PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="w-full h-14 rounded-xl border border-ink-200 bg-white text-center text-2xl font-bold tracking-[0.5em] text-ink-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            />
            <p className="mt-1.5 text-xs text-ink-400">Enter your 4-digit transaction PIN to authorize this contribution.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep('enter_amount')}>Back</Button>
            <Button className="flex-1" onClick={handleContribute} disabled={pin.length < 4} leftIcon={<ShieldCheck className="w-4 h-4" />}>Confirm</Button>
          </div>
        </div>
      )}

      {/* Step 5: Processing */}
      {step === 'processing' && (
        <div className="space-y-5 text-center py-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-ink-900">Processing...</h3>
            <p className="text-sm text-ink-500 mt-1">Transferring {formatKES(amt)} to {group?.name}</p>
          </div>
        </div>
      )}

      {/* Step 6: Success */}
      {step === 'success' && group && (
        <div className="space-y-5 text-center py-4">
          <div className="w-16 h-16 rounded-2xl bg-success-100 text-success-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-ink-900">Contribution Successful!</h3>
            <p className="text-sm text-ink-500 mt-1">
              <span className="font-bold text-ink-900">{formatKES(amt)}</span> sent to {group.name}.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-ink-50 space-y-1.5 text-sm text-left">
            <div className="flex justify-between text-ink-600"><span>Group</span><span className="font-semibold text-ink-900">{group.name}</span></div>
            <div className="flex justify-between text-ink-600"><span>Wallet</span><span className="font-mono text-xs">{group.walletNumber}</span></div>
            <div className="flex justify-between text-ink-600"><span>Amount</span><span className="font-semibold">{formatKES(amt)}</span></div>
            <div className="flex justify-between text-ink-600"><span>Fee</span><span className="font-semibold">{formatKES(fee)}</span></div>
          </div>
          <Button className="w-full" size="lg" onClick={handleDone}>Done</Button>
        </div>
      )}
    </Modal>
  );
}
