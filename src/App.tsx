import { useState, useCallback } from 'react';
import { RouterContext, type Route } from '@/components/router';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider, useAuth } from '@/lib/auth';
import { WalletProvider } from '@/lib/wallet-ui';
import { AppShell } from '@/components/AppShell';
import { AuthLanding, RegisterPage } from '@/pages/auth/AuthLanding';
import { GroupWizard } from '@/pages/auth/GroupWizard';
import { MemberDashboard } from '@/pages/MemberDashboard';
import { ContributionsPage } from '@/pages/ContributionsPage';
import { GroupsPage } from '@/pages/GroupsPage';
import { GroupDashboard } from '@/pages/GroupDashboard';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { MembersPage } from '@/pages/MembersPage';
import { GroupTransactionsPage } from '@/pages/GroupTransactionsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { ActivityLogPage } from '@/pages/ActivityLogPage';
import { GroupSettingsPage } from '@/pages/GroupSettingsPage';
import { SearchPage } from '@/pages/SearchPage';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminGroupsPage } from '@/pages/admin/AdminGroupsPage';
import { AdminMembersPage } from '@/pages/admin/AdminMembersPage';
import { AdminTransactionsPage } from '@/pages/admin/AdminTransactionsPage';
import { AdminAnalyticsPage } from '@/pages/admin/AdminAnalyticsPage';
import { AdminReportsPage } from '@/pages/admin/AdminReportsPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';
import { Logo } from '@/components/Logo';

type AuthView = 'landing' | 'register' | 'wizard';

function AuthGate() {
  const { session, loading, profile } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('landing');
  const [route, setRoute] = useState<Route>('dashboard');
  const [params, setParams] = useState<Record<string, string>>({});
  const [groupId, setGroupId] = useState<string | undefined>(undefined);

  const navigate = useCallback((r: Route, p: Record<string, string> = {}) => {
    setRoute(r);
    setParams(p);
    if (p.id) setGroupId(p.id);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50">
        <div className="text-center">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-brand-200 border-t-brand-600 rounded-full mb-3" />
          <p className="text-sm text-ink-500">Loading UMOJA...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    if (authView === 'register') {
      return (
        <ToastProvider>
          <RegisterPage
            onBack={() => setAuthView('landing')}
            onRegistered={() => setAuthView('landing')}
          />
        </ToastProvider>
      );
    }
    if (authView === 'wizard') {
      return (
        <ToastProvider>
          <GroupWizard onComplete={() => { setAuthView('landing'); }} onBack={() => setAuthView('landing')} />
        </ToastProvider>
      );
    }
    return (
      <ToastProvider>
        <AuthLanding
          onLogin={() => {}}
          onGoRegister={() => setAuthView('register')}
          onGoWizard={() => setAuthView('wizard')}
        />
      </ToastProvider>
    );
  }

  const renderRoute = () => {
    switch (route) {
      case 'dashboard': return <MemberDashboard />;
      case 'contributions': return <ContributionsPage />;
      case 'groups': return <GroupsPage />;
      case 'group-dashboard': return <GroupDashboard groupId={groupId} />;
      case 'contributors': return <GroupDashboard groupId={groupId} />;
      case 'notifications': return <NotificationsPage />;
      case 'profile': return <ProfilePage />;
      case 'members': return <MembersPage groupId={groupId} />;
      case 'transactions': return <GroupTransactionsPage groupId={groupId} />;
      case 'reports': return <ReportsPage groupId={groupId} />;
      case 'analytics': return <AnalyticsPage groupId={groupId} />;
      case 'activity-log': return <ActivityLogPage groupId={groupId} />;
      case 'group-settings': return <GroupSettingsPage groupId={groupId} />;
      case 'search': return <SearchPage />;
      case 'admin-dashboard': return <AdminDashboard />;
      case 'admin-groups': return <AdminGroupsPage />;
      case 'admin-members': return <AdminMembersPage />;
      case 'admin-transactions': return <AdminTransactionsPage />;
      case 'admin-analytics': return <AdminAnalyticsPage />;
      case 'admin-reports': return <AdminReportsPage />;
      case 'admin-settings': return <AdminSettingsPage />;
      default: return <MemberDashboard />;
    }
  };

  const navSet: 'member' | 'groupAdmin' | 'masterAdmin' =
    route.startsWith('admin-') ? 'masterAdmin' :
    ['group-dashboard', 'members', 'transactions', 'reports', 'analytics', 'activity-log', 'group-settings'].includes(route) ? 'groupAdmin' :
    'member';

  return (
    <RouterContext.Provider value={{ route, params, navigate }}>
      <ToastProvider>
        <WalletProvider>
          <AppShell navSet={navSet} groupId={groupId} onNavigate={navigate}>
            <main className="px-4 sm:px-6 py-6 max-w-7xl mx-auto w-full">
              {renderRoute()}
            </main>
          </AppShell>
        </WalletProvider>
        <PWAInstallBanner />
      </ToastProvider>
    </RouterContext.Provider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
