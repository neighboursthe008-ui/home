import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, Wallet } from '@/types';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  wallet: Wallet | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfileAndWallet = useCallback(async (uid: string) => {
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (prof) {
      setProfile({
        id: prof.id,
        umojaId: prof.umoja_id,
        fullName: prof.full_name,
        phone: prof.phone,
        email: prof.email,
        avatarColor: prof.avatar_color,
        pinSet: !!prof.pin_hash,
        phoneVerified: prof.phone_verified,
        status: prof.status,
        totalContributed: prof.total_contributed,
        contributionCount: prof.contribution_count,
        lastContributionAt: prof.last_contribution_at,
        groupsJoined: prof.groups_joined,
        registeredAt: prof.created_at,
      });
    }

    const { data: wal } = await supabase
      .from('wallets')
      .select('*')
      .eq('owner_type', 'personal')
      .eq('owner_id', uid)
      .maybeSingle();

    if (wal) {
      setWallet({
        id: wal.id,
        walletNumber: wal.wallet_number,
        ownerType: 'personal',
        ownerId: wal.owner_id,
        balance: wal.balance,
        createdAt: wal.created_at,
      });
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        loadProfileAndWallet(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        (async () => {
          await loadProfileAndWallet(sess.user.id);
          setLoading(false);
        })();
      } else {
        setProfile(null);
        setWallet(null);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [loadProfileAndWallet]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string, phone: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } },
    });
    if (error) return { error: error.message };

    // If Supabase returned a session, the user is already signed in
    if (data.session) return { error: null };

    // No session yet — email confirmation may be pending. Try signing in immediately
    // (the database trigger auto-confirms the email, so this should work)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      return { error: `Account created, but couldn't sign in automatically: ${signInError.message}. Please try signing in manually.` };
    }

    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setWallet(null);
    setSession(null);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfileAndWallet(user.id);
  }, [user, loadProfileAndWallet]);

  return (
    <AuthCtx.Provider value={{ session, user, profile, wallet, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
