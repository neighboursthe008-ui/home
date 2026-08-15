import { useState } from 'react';
import { ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { setPin } from '@/lib/api';

export function SetPinModal({ open, onClose, onSuccess }: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const toast = useToast();
  const [pin, setPinVal] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const reset = () => { setPinVal(''); setConfirm(''); setLoading(false); setDone(false); };

  const handleSubmit = async () => {
    if (pin.length < 4) { toast('warning', 'PIN must be 4 digits.'); return; }
    if (pin !== confirm) { toast('error', 'PINs do not match.'); return; }
    setLoading(true);
    const result = await setPin(pin);
    setLoading(false);
    if (result.error) { toast('error', result.error); return; }
    setDone(true);
    toast('success', 'Transaction PIN set successfully.');
  };

  const handleDone = () => { reset(); onClose(); onSuccess(); };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Set Transaction PIN" size="sm">
      {done ? (
        <div className="space-y-5 text-center py-4">
          <div className="w-16 h-16 rounded-2xl bg-success-100 text-success-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-ink-900">PIN Set Successfully</h3>
            <p className="text-sm text-ink-500 mt-1">You can now make contributions and wallet transfers securely.</p>
          </div>
          <Button className="w-full" size="lg" onClick={handleDone}>Continue</Button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="p-3 rounded-xl bg-brand-50 border border-brand-100 text-sm text-brand-700 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Your PIN is required to authorize every contribution and wallet transfer. Choose a 4-digit PIN you can remember.</span>
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1.5">New PIN (4 digits)</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={pin}
              onChange={(e) => setPinVal(e.target.value.replace(/\D/g, ''))}
              className="w-full h-14 rounded-xl border border-ink-200 bg-white text-center text-2xl font-bold tracking-[0.5em] text-ink-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1.5">Confirm PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ''))}
              className="w-full h-14 rounded-xl border border-ink-200 bg-white text-center text-2xl font-bold tracking-[0.5em] text-ink-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            />
          </div>
          <Button className="w-full" size="lg" onClick={handleSubmit} loading={loading} disabled={pin.length < 4 || confirm.length < 4}>
            Set PIN
          </Button>
        </div>
      )}
    </Modal>
  );
}
