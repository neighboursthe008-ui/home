import { useState } from 'react';
import { Wallet, Plus, ArrowDownToLine, Copy, Eye, EyeOff, Phone, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth';
import { topUpWallet } from '@/lib/api';
import { formatKES, classNames } from '@/lib/format';
import type { FeeConfig } from '@/types';

export function TopUpModal({ open, onClose, feeConfig, onSuccess }: {
  open: boolean;
  onClose: () => void;
  feeConfig: FeeConfig | null;
  onSuccess: () => void;
}) {
  const { profile, wallet, refreshProfile } = useAuth();
  const toast = useToast();
  const [step, setStep] = useState<'input' | 'stk_push' | 'success'>('input');
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [loading, setLoading] = useState(false);

  const amt = parseInt(amount) || 0;
  const fee = feeConfig ? Math.round((amt * feeConfig.topUpFeePct) / 100) + feeConfig.topUpFeeFlat : 0;
  const total = amt + fee;

  const reset = () => { setStep('input'); setAmount(''); setLoading(false); };

  const handleStkPush = async () => {
    if (amt < 10) { toast('warning', 'Minimum top-up amount is KES 10.'); return; }
    if (!phone) { toast('warning', 'Enter your phone number.'); return; }
    setLoading(true);
    setStep('stk_push');
    // Simulate STK push delay
    setTimeout(async () => {
      const result = await topUpWallet(amt, phone, fee);
      if (result.error) {
        toast('error', result.error);
        setStep('input');
        setLoading(false);
      } else {
        setStep('success');
        setLoading(false);
        await refreshProfile();
      }
    }, 2500);
  };

  const handleClose = () => { reset(); onClose(); };
  const handleDone = () => { reset(); onClose(); onSuccess(); toast('success', `KES ${amt.toLocaleString()} added to your wallet.`); };

  return (
    <Modal open={open} onClose={handleClose} title="Top Up Wallet" size="sm">
      {step === 'input' && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-600 to-ink-900 text-white">
            <div className="text-xs text-brand-200 font-medium">Wallet Balance</div>
            <div className="font-display font-bold text-2xl mt-0.5">{formatKES(wallet?.balance ?? 0)}</div>
            <div className="text-xs text-brand-200 font-mono mt-1">{wallet?.walletNumber}</div>
          </div>
          <Input
            label="Amount (KES)"
            type="number"
            placeholder="e.g. 1000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            leftIcon={<Wallet className="w-4 h-4" />}
            hint="Minimum KES 10"
          />
          <Input
            label="M-Pesa Phone Number"
            placeholder="+254 712 345 678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Phone className="w-4 h-4" />}
            hint="An STK push will be sent to this number."
          />
          {amt > 0 && (
            <div className="p-3 rounded-xl bg-ink-50 space-y-1.5 text-sm">
              <div className="flex justify-between text-ink-600"><span>Amount</span><span className="font-semibold">{formatKES(amt)}</span></div>
              {fee > 0 && <div className="flex justify-between text-ink-600"><span>Transaction fee</span><span className="font-semibold">{formatKES(fee)}</span></div>}
              <div className="flex justify-between text-ink-900 font-bold pt-1.5 border-t border-ink-200"><span>Total charged</span><span>{formatKES(total)}</span></div>
            </div>
          )}
          <Button className="w-full" size="lg" leftIcon={<ShieldCheck className="w-4 h-4" />} onClick={handleStkPush} disabled={!amt || amt < 10}>
            Send STK Push
          </Button>
        </div>
      )}

      {step === 'stk_push' && (
        <div className="space-y-5 text-center py-4">
          <div className="w-16 h-16 rounded-2xl bg-success-100 text-success-600 flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-ink-900">STK Push Sent</h3>
            <p className="text-sm text-ink-500 mt-1">
              Enter your M-Pesa PIN on your phone to authorize the payment of <span className="font-bold text-ink-900">{formatKES(total)}</span> to wallet <span className="font-mono text-xs">{wallet?.walletNumber}</span>.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-success-50 border border-success-200 text-sm text-success-700 flex items-center gap-2 justify-center">
            <Phone className="w-4 h-4" /> Waiting for confirmation...
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="space-y-5 text-center py-4">
          <div className="w-16 h-16 rounded-2xl bg-success-100 text-success-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-ink-900">Top-Up Successful!</h3>
            <p className="text-sm text-ink-500 mt-1">
              <span className="font-bold text-ink-900">{formatKES(amt)}</span> has been added to your wallet.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-ink-50 space-y-1.5 text-sm text-left">
            <div className="flex justify-between text-ink-600"><span>New balance</span><span className="font-bold text-ink-900">{formatKES((wallet?.balance ?? 0) + amt)}</span></div>
            <div className="flex justify-between text-ink-600"><span>Fee charged</span><span className="font-semibold">{formatKES(fee)}</span></div>
          </div>
          <Button className="w-full" size="lg" onClick={handleDone}>Done</Button>
        </div>
      )}
    </Modal>
  );
}
