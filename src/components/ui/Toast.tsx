import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { classNames } from '@/lib/format';

type ToastKind = 'success' | 'error' | 'info' | 'warning';
interface Toast { id: string; kind: ToastKind; message: string }

const ToastCtx = createContext<(kind: ToastKind, message: string) => void>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

const icons = {
  success: CheckCircle2, error: XCircle, info: Info, warning: AlertCircle,
};
const tones = {
  success: 'text-success-600 bg-success-50', error: 'text-danger-600 bg-danger-50',
  info: 'text-sky-600 bg-sky-50', warning: 'text-warning-600 bg-warning-50',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const remove = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <ToastCtx.Provider value={push}>
      {children}
      {createPortal(
        <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2.5 w-full max-w-sm pointer-events-none">
          {toasts.map((t) => {
            const Icon = icons[t.kind];
            return (
              <div key={t.id} className="pointer-events-auto bg-white rounded-xl shadow-card-hover border border-ink-100 p-4 flex items-start gap-3 animate-slide-in-right">
                <div className={classNames('shrink-0 w-8 h-8 rounded-lg flex items-center justify-center', tones[t.kind])}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="flex-1 text-sm font-medium text-ink-800 pt-1">{t.message}</p>
                <button onClick={() => remove(t.id)} className="text-ink-300 hover:text-ink-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastCtx.Provider>
  );
}
