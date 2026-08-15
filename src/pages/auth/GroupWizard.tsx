import { useState } from 'react';
import {
  Building2, Check, ChevronLeft, ChevronRight, Upload,
  UserCheck, ShieldCheck, Phone, CreditCard, User as UserIcon,
  Loader2, PartyPopper, Copy,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { classNames } from '@/lib/format';

interface Founder {
  fullName: string;
  nationalId: string;
  phone: string;
  verified: boolean;
  otpSent: boolean;
}

const steps = ['Group Information', 'Founder 1', 'Founder 2', 'Founder 3', 'Verification'];
const demoOtp = '284917';

export function GroupWizard({ onComplete, onBack }: { onComplete: () => void; onBack: () => void }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Group info
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [category, setCategory] = useState('');
  const [purpose, setPurpose] = useState('');
  const [location, setLocation] = useState('');

  // Founders
  const [founders, setFounders] = useState<Founder[]>([
    { fullName: '', nationalId: '', phone: '', verified: false, otpSent: false },
    { fullName: '', nationalId: '', phone: '', verified: false, otpSent: false },
    { fullName: '', nationalId: '', phone: '', verified: false, otpSent: false },
  ]);

  // OTP input per founder
  const [otpInputs, setOtpInputs] = useState(['', '', '']);
  const [activeFounder, setActiveFounder] = useState(0);

  const next = () => {
    if (step === 0) {
      if (!groupName || !category) { toast('warning', 'Please fill in the group name and category.'); return; }
    }
    if (step >= 1 && step <= 3) {
      const f = founders[step - 1];
      if (!f.fullName || !f.nationalId || !f.phone) { toast('warning', 'Please complete all founder details.'); return; }
    }
    setStep((s) => Math.min(s + 1, 4));
  };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const sendOtp = (idx: number) => {
    if (!founders[idx].phone) { toast('warning', 'Enter a phone number first.'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setFounders((fs) => fs.map((f, i) => i === idx ? { ...f, otpSent: true } : f));
      setActiveFounder(idx);
      toast('success', `OTP sent to ${founders[idx].phone}. Demo code: ${demoOtp}`);
    }, 1200);
  };

  const verifyOtp = (idx: number) => {
    if (otpInputs[idx] !== demoOtp) { toast('error', 'Invalid OTP. Use the demo code shown above.'); return; }
    setFounders((fs) => fs.map((f, i) => i === idx ? { ...f, verified: true } : f));
    toast('success', `Founder ${idx + 1} verified successfully.`);
  };

  const allVerified = founders.every((f) => f.verified);

  const complete = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onComplete(); }, 1500);
  };

  return (
    <div className="min-h-screen bg-ink-50 py-6 sm:py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-ink-900">
            <ChevronLeft className="w-4 h-4" /> Back to login
          </button>
          <Logo size="sm" />
        </div>

        {/* Step indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className={classNames(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all shrink-0',
                  i < step ? 'bg-brand-500 text-white' :
                  i === step ? 'bg-brand-600 text-white ring-4 ring-brand-100' :
                  'bg-ink-100 text-ink-400',
                )}>
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={classNames('flex-1 h-0.5 mx-1 sm:mx-2 transition-colors', i < step ? 'bg-brand-500' : 'bg-ink-200')} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs font-semibold">
            <span className={classNames(step === 0 ? 'text-ink-900' : 'text-ink-400')}>{steps[0]}</span>
            <span className={classNames(step === 4 ? 'text-ink-900' : 'text-ink-400 hidden sm:inline')}>{steps[4]}</span>
          </div>
        </div>

        {/* Card */}
        <div className="card-premium p-6 sm:p-8 animate-slide-up">
          {/* Step 0 — Group info */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display font-bold text-xl text-ink-900">Group Information</h2>
                <p className="text-sm text-ink-500 mt-1">Tell us about the group you're creating.</p>
              </div>
              <div className="flex gap-4">
                <div className="shrink-0">
                  <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-ink-200 flex items-center justify-center text-ink-400 hover:border-brand-400 hover:text-brand-500 cursor-pointer transition-colors">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] text-ink-400 mt-1 text-center w-20">Logo</p>
                </div>
                <div className="flex-1 space-y-4">
                  <Input label="Group name" placeholder="e.g. Good Hope Welfare" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
                  <Input label="Description" placeholder="What is this group about?" value={groupDesc} onChange={(e) => setGroupDesc(e.target.value)} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Select category</option>
                  <option>Welfare</option>
                  <option>Development</option>
                  <option>Investment</option>
                  <option>Family Support</option>
                  <option>Agriculture</option>
                  <option>Education</option>
                  <option>Religious</option>
                  <option>Other</option>
                </Select>
                <Input label="Location" placeholder="e.g. Nairobi, Kenya" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              <Input label="Purpose" placeholder="e.g. Emergency support & mutual aid" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
            </div>
          )}

          {/* Steps 1-3 — Founder info + OTP */}
          {(step >= 1 && step <= 3) && (
            <FounderStep
              index={step - 1}
              founder={founders[step - 1]}
              otpInput={otpInputs[step - 1]}
              loading={loading}
              demoOtp={demoOtp}
              onFounderChange={(field, val) => setFounders((fs) => fs.map((f, i) => i === step - 1 ? { ...f, [field]: val } : f))}
              onOtpChange={(val) => setOtpInputs((o) => o.map((x, i) => i === step - 1 ? val : x))}
              onSendOtp={() => sendOtp(step - 1)}
              onVerifyOtp={() => verifyOtp(step - 1)}
            />
          )}

          {/* Step 4 — Verification summary */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className={classNames(
                  'w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 transition-all',
                  allVerified ? 'bg-success-100 text-success-600' : 'bg-warning-100 text-warning-600',
                )}>
                  {allVerified ? <PartyPopper className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
                </div>
                <h2 className="font-display font-bold text-xl text-ink-900">
                  {allVerified ? 'Group ready to activate!' : 'Pending verification'}
                </h2>
                <p className="text-sm text-ink-500 mt-1 max-w-sm mx-auto">
                  {allVerified
                    ? 'All three founders have verified. Your group will be activated with status ACTIVE.'
                    : 'All three founders must verify their OTP before the group can be activated.'}
                </p>
                <div className="mt-3 inline-flex items-center gap-2">
                  <Badge tone={allVerified ? 'success' : 'warning'} dot>
                    {allVerified ? 'Ready to activate' : 'Pending verification'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                {founders.map((f, i) => (
                  <div key={i} className={classNames(
                    'flex items-center gap-4 p-4 rounded-xl border transition-all',
                    f.verified ? 'border-success-200 bg-success-50/50' : 'border-warning-200 bg-warning-50/50',
                  )}>
                    <div className={classNames(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      f.verified ? 'bg-success-500 text-white' : 'bg-warning-500 text-white',
                    )}>
                      {f.verified ? <Check className="w-5 h-5" /> : <Loader2 className="w-5 h-5 animate-spin" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-ink-900 truncate">{f.fullName || `Founder ${i + 1}`}</div>
                      <div className="text-sm text-ink-500">{f.phone || 'Phone not entered'}</div>
                    </div>
                    <Badge tone={f.verified ? 'success' : 'warning'}>
                      {f.verified ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>

              {!allVerified && (
                <div className="p-4 rounded-xl bg-brand-50 border border-brand-100">
                  <p className="text-sm text-brand-700">
                    <span className="font-semibold">Next step:</span> Founders who haven't verified need to enter the OTP sent to their phone. The group remains <span className="font-semibold">PENDING VERIFICATION</span> until all three verify.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-ink-100">
            <Button variant="outline" onClick={prev} leftIcon={<ChevronLeft className="w-4 h-4" />} disabled={step === 0}>
              Back
            </Button>
            {step < 4 ? (
              <Button onClick={next} rightIcon={<ChevronRight className="w-4 h-4" />}>
                Continue
              </Button>
            ) : allVerified ? (
              <Button variant="success" onClick={complete} loading={loading} leftIcon={<PartyPopper className="w-4 h-4" />}>
                Activate Group
              </Button>
            ) : (
              <Button variant="outline" disabled>
                Complete verification
              </Button>
            )}
          </div>
        </div>

        {/* Info note */}
        <p className="text-center text-xs text-ink-400 mt-6">
          Every group requires exactly three founders with OTP verification. This ensures shared accountability.
        </p>
      </div>
    </div>
  );
}

// ── Founder step component ──
function FounderStep({
  index, founder, otpInput, loading, demoOtp,
  onFounderChange, onOtpChange, onSendOtp, onVerifyOtp,
}: {
  index: number;
  founder: Founder;
  otpInput: string;
  loading: boolean;
  demoOtp: string;
  onFounderChange: (field: keyof Founder, val: string) => void;
  onOtpChange: (val: string) => void;
  onSendOtp: () => void;
  onVerifyOtp: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center">
          <UserIcon className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-display font-bold text-xl text-ink-900">Founder {index + 1}</h2>
          <p className="text-sm text-ink-500">Enter details and verify via OTP.</p>
        </div>
      </div>

      <Input
        label="Full name"
        placeholder="e.g. Grace Wanjiru"
        leftIcon={<UserIcon className="w-4 h-4" />}
        value={founder.fullName}
        onChange={(e) => onFounderChange('fullName', e.target.value)}
        disabled={founder.verified}
      />
      <Input
        label="National ID number"
        placeholder="e.g. 12345678"
        leftIcon={<CreditCard className="w-4 h-4" />}
        value={founder.nationalId}
        onChange={(e) => onFounderChange('nationalId', e.target.value)}
        disabled={founder.verified}
      />
      <Input
        label="Mobile number"
        placeholder="e.g. +254 712 345 678"
        leftIcon={<Phone className="w-4 h-4" />}
        value={founder.phone}
        onChange={(e) => onFounderChange('phone', e.target.value)}
        disabled={founder.verified}
        hint="An OTP will be sent to this number for verification."
      />

      {/* OTP section */}
      {founder.verified ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-success-50 border border-success-200">
          <div className="w-8 h-8 rounded-lg bg-success-500 text-white flex items-center justify-center">
            <Check className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-success-700">Founder {index + 1} verified successfully.</p>
        </div>
      ) : !founder.otpSent ? (
        <Button variant="outline" onClick={onSendOtp} loading={loading} leftIcon={<ShieldCheck className="w-4 h-4" />}>
          Send OTP
        </Button>
      ) : (
        <div className="space-y-3 p-4 rounded-xl bg-brand-50 border border-brand-100">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-ink-700">Enter OTP</label>
            <button onClick={onSendOtp} className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              Resend OTP
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              placeholder="6-digit code"
              value={otpInput}
              onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, ''))}
              className="flex-1 h-12 rounded-xl border border-brand-200 bg-white text-center text-lg font-bold tracking-[0.3em] text-ink-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            />
            <Button onClick={onVerifyOtp} leftIcon={<UserCheck className="w-4 h-4" />}>Verify</Button>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-ink-500">Demo code:</span>
            <code className="px-2 py-0.5 rounded bg-white border border-brand-200 font-mono font-semibold text-brand-700">{demoOtp}</code>
            <button onClick={() => { navigator.clipboard?.writeText(demoOtp); }} className="text-ink-400 hover:text-ink-600">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
