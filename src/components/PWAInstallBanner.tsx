import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { classNames } from '@/lib/format';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'umoja-pwa-install-dismissed';
const DISMISS_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const age = Date.now() - parseInt(dismissed, 10);
      if (age < DISMISS_TTL) return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted' || outcome === 'dismissed') {
      setVisible(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className={classNames(
      'fixed bottom-0 inset-x-0 z-50 lg:bottom-0 lg:left-64 lg:right-0',
      'animate-slide-up',
    )}>
      <div className="mx-4 mb-4 lg:mx-6 lg:mb-6">
        <div className="bg-ink-900 text-white rounded-2xl shadow-2xl border border-ink-700/50 overflow-hidden">
          <div className="flex items-center gap-3 p-3 sm:p-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-secondary-600 flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-sm sm:text-base">Install UMOJA</h3>
              <p className="text-xs text-ink-300 mt-0.5 hidden sm:block">Add to your home screen for a faster, full-screen experience.</p>
              <p className="text-xs text-ink-300 mt-0.5 sm:hidden">Faster, full-screen app experience.</p>
            </div>
            <Button variant="primary" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={handleInstall} className="shrink-0">
              <span className="hidden sm:inline">Install</span>
              <span className="sm:hidden">Get</span>
            </Button>
            <button onClick={handleDismiss} className="shrink-0 w-8 h-8 rounded-lg hover:bg-ink-700 flex items-center justify-center text-ink-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
