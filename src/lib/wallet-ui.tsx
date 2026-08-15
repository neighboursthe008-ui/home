import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { TopUpModal } from '@/components/wallet/TopUpModal';
import { ContributeModal } from '@/components/wallet/ContributeModal';
import { SetPinModal } from '@/components/wallet/SetPinModal';
import { useAuth } from '@/lib/auth';
import { getFeeConfig } from '@/lib/api';
import type { FeeConfig } from '@/types';

interface WalletUI {
  openTopUp: () => void;
  openContribute: (prefillWalletNumber?: string) => void;
  openSetPin: () => void;
  feeConfig: FeeConfig | null;
}

const WalletCtx = createContext<WalletUI | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [showTopUp, setShowTopUp] = useState(false);
  const [showContribute, setShowContribute] = useState(false);
  const [showSetPin, setShowSetPin] = useState(false);
  const [prefillWallet, setPrefillWallet] = useState<string | undefined>(undefined);
  const [feeConfig, setFeeConfig] = useState<FeeConfig | null>(null);

  useEffect(() => {
    if (user) {
      getFeeConfig().then(setFeeConfig);
    }
  }, [user]);

  const openTopUp = useCallback(() => setShowTopUp(true), []);
  const openContribute = useCallback((prefill?: string) => {
    setPrefillWallet(prefill);
    setShowContribute(true);
  }, []);
  const openSetPin = useCallback(() => setShowSetPin(true), []);

  const refreshAll = useCallback(() => {
    getFeeConfig().then(setFeeConfig);
  }, []);

  return (
    <WalletCtx.Provider value={{ openTopUp, openContribute, openSetPin, feeConfig }}>
      {children}
      <TopUpModal open={showTopUp} onClose={() => setShowTopUp(false)} feeConfig={feeConfig} onSuccess={refreshAll} />
      <ContributeModal open={showContribute} onClose={() => setShowContribute(false)} feeConfig={feeConfig} onSuccess={refreshAll} prefillWalletNumber={prefillWallet} />
      <SetPinModal open={showSetPin} onClose={() => setShowSetPin(false)} onSuccess={refreshAll} />
    </WalletCtx.Provider>
  );
}

export function useWalletUI() {
  const ctx = useContext(WalletCtx);
  if (!ctx) throw new Error('useWalletUI must be used within WalletProvider');
  return ctx;
}
