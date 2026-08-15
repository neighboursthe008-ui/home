import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Users, TrendingUp, User as UserIcon, Phone, ChevronLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth';

export function AuthLanding({ onLogin, onGoRegister, onGoWizard }: {
  onLogin: () => void;
  onGoRegister: () => void;
  onGoWizard: () => void;
}) {
  const { signIn } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('john.kamau@umoja.app');
  const [password, setPassword] = useState('umoja12345');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);
    if (result.error) {
      toast('error', result.error);
    } else {
      toast('success', 'Welcome back to UMOJA!');
      onLogin();
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left — brand panel */}
      <div className="lg:w-1/2 bg-gradient-to-br from-brand-700 via-brand-800 to-ink-950 text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-brand-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <Logo size="lg" light />
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl leading-tight">
            One person.<br />Many groups.<br />
            <span className="text-brand-300">One identity.</span>
          </h1>
          <p className="mt-5 text-brand-100/80 text-base sm:text-lg leading-relaxed">
            The modern contribution platform for welfare groups, chamas, community causes, and organizations. Complete contribution transparency — built for trust.
          </p>

          <div className="mt-8 space-y-4">
            {[
              { icon: Users, title: 'Unlimited groups', desc: 'One UMOJA ID across every group you join' },
              { icon: TrendingUp, title: 'Digital money only', desc: 'M-Pesa, bank, card — no cash workflow' },
              { icon: ShieldCheck, title: 'Secure & auditable', desc: 'OTP verification, role-based access, full audit trails' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3.5">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                  <f.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{f.title}</div>
                  <div className="text-sm text-brand-100/60">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-sm text-brand-100/40">
          KES contributions · OTP-verified groups · Production-grade security
        </div>
      </div>

      {/* Right — login form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-ink-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Logo size="md" />
          </div>
          <h2 className="font-display font-bold text-2xl text-ink-900">Welcome back</h2>
          <p className="text-sm text-ink-500 mt-1.5">Sign in to your UMOJA account to continue.</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <Input
              label="Email address"
              name="email"
              type="email"
              placeholder="john.kamau@umoja.app"
              leftIcon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="relative">
              <Input
                label="Password"
                name="password"
                type={show ? 'text' : 'password'}
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3.5 top-[38px] text-ink-400 hover:text-ink-600">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-ink-600 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500" defaultChecked />
                Remember me
              </label>
              <a href="#" className="text-sm font-semibold text-brand-600 hover:text-brand-700">Forgot password?</a>
            </div>
            <Button type="submit" size="lg" className="w-full" loading={loading} rightIcon={!loading ? <ArrowRight className="w-4 h-4" /> : undefined}>
              Sign in
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-ink-500">
            New to UMOJA?{' '}
            <button onClick={onGoRegister} className="font-semibold text-brand-600 hover:text-brand-700">Create an account</button>
          </div>
          <div className="mt-3 text-center text-sm text-ink-500">
            <button onClick={onGoWizard} className="font-semibold text-secondary-600 hover:text-secondary-700">Create a new group</button>
          </div>

          <div className="mt-8 p-3.5 rounded-xl bg-brand-50 border border-brand-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center shrink-0 text-xs font-bold">
              DEMO
            </div>
            <p className="text-xs text-brand-700">
              Use <span className="font-semibold">john.kamau@umoja.app</span> / <span className="font-semibold">umoja12345</span> to explore.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Registration form ──
export function RegisterPage({ onBack, onRegistered }: { onBack: () => void; onRegistered: () => void }) {
  const { signUp } = useAuth();
  const toast = useToast();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !email || !password) { toast('warning', 'Please fill in all fields.'); return; }
    if (password.length < 6) { toast('warning', 'Password must be at least 6 characters.'); return; }
    setLoading(true);
    const result = await signUp(email, password, fullName, phone);
    setLoading(false);
    if (result.error) {
      if (result.error.includes("couldn't sign in automatically")) {
        toast('warning', result.error);
        onBack();
        return;
      }
      toast('error', result.error);
      return;
    }
    toast('success', 'Account created! Welcome to UMOJA.');
    onRegistered();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-ink-50">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-ink-900 mb-6">
            <ChevronLeft className="w-4 h-4" /> Back to login
          </button>
        </div>
        <div className="mb-8 text-center">
          <div className="inline-block"><Logo size="md" /></div>
          <h2 className="font-display font-bold text-2xl text-ink-900 mt-6">Create your account</h2>
          <p className="text-sm text-ink-500 mt-1.5">Join UMOJA and get your permanent identity + wallet.</p>
        </div>

        <form className="card-premium p-6 space-y-4" onSubmit={handleSubmit}>
          <Input label="Full name" name="name" placeholder="John Kamau" leftIcon={<UserIcon className="w-4 h-4" />} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Input label="Phone number" name="phone" placeholder="+254 712 345 678" leftIcon={<Phone className="w-4 h-4" />} value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <Input label="Email address" name="email" type="email" placeholder="john.kamau@gmail.com" leftIcon={<Mail className="w-4 h-4" />} value={email} onChange={(e) => setEmail(e.target.value)} required />
          <div className="relative">
            <Input label="Password" name="password" type={show ? 'text' : 'password'} placeholder="••••••••" leftIcon={<Lock className="w-4 h-4" />} value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3.5 top-[38px] text-ink-400 hover:text-ink-600">
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <label className="flex items-start gap-2.5 text-sm text-ink-600 cursor-pointer">
            <input type="checkbox" required className="mt-0.5 w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500" />
            <span>I agree to the UMOJA Terms of Service and Privacy Policy</span>
          </label>
          <Button type="submit" size="lg" className="w-full" loading={loading}>Create account</Button>
        </form>

        <div className="mt-6 text-center text-sm text-ink-500">
          Already have an account?{' '}
          <button onClick={onBack} className="font-semibold text-brand-600 hover:text-brand-700">Sign in</button>
        </div>
      </div>
    </div>
  );
}
