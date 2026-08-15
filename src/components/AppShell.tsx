import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  LayoutDashboard, Wallet, Users, Building2, Bell, User,
  Search, Menu, X, LogOut, Settings, ChevronDown, Plus,
  TrendingUp, FileBarChart, Activity, ShieldCheck,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useRouter, type Route } from '@/components/router';
import { useAuth } from '@/lib/auth';
import { fetchMyGroups, fetchNotifications } from '@/lib/api';
import { classNames, greeting, formatCompactKES } from '@/lib/format';
import type { Group } from '@/types';

interface NavItem { label: string; icon: ReactNode; route: Route; badge?: number }

const memberNav: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px]" />, route: 'dashboard' },
  { label: 'My Contributions', icon: <Wallet className="w-[18px] h-[18px]" />, route: 'contributions' },
  { label: 'My Groups', icon: <Building2 className="w-[18px] h-[18px]" />, route: 'groups' },
  { label: 'Notifications', icon: <Bell className="w-[18px] h-[18px]" />, route: 'notifications' },
];

const groupAdminNav: NavItem[] = [
  { label: 'Group Dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px]" />, route: 'group-dashboard' },
  { label: 'Members', icon: <Users className="w-[18px] h-[18px]" />, route: 'members' },
  { label: 'Contributions', icon: <Wallet className="w-[18px] h-[18px]" />, route: 'transactions' },
  { label: 'Transactions', icon: <TrendingUp className="w-[18px] h-[18px]" />, route: 'transactions' },
  { label: 'Reports', icon: <FileBarChart className="w-[18px] h-[18px]" />, route: 'reports' },
  { label: 'Analytics', icon: <Activity className="w-[18px] h-[18px]" />, route: 'analytics' },
  { label: 'Activity Log', icon: <ShieldCheck className="w-[18px] h-[18px]" />, route: 'activity-log' },
  { label: 'Group Settings', icon: <Settings className="w-[18px] h-[18px]" />, route: 'group-settings' },
];

const masterAdminNav: NavItem[] = [
  { label: 'Admin Dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px]" />, route: 'admin-dashboard' },
  { label: 'Groups', icon: <Building2 className="w-[18px] h-[18px]" />, route: 'admin-groups' },
  { label: 'Members', icon: <Users className="w-[18px] h-[18px]" />, route: 'admin-members' },
  { label: 'Transactions', icon: <TrendingUp className="w-[18px] h-[18px]" />, route: 'admin-transactions' },
  { label: 'Analytics', icon: <Activity className="w-[18px] h-[18px]" />, route: 'admin-analytics' },
  { label: 'Reports', icon: <FileBarChart className="w-[18px] h-[18px]" />, route: 'admin-reports' },
  { label: 'Settings', icon: <Settings className="w-[18px] h-[18px]" />, route: 'admin-settings' },
];

const mobileNav: NavItem[] = [
  { label: 'Home', icon: <LayoutDashboard className="w-5 h-5" />, route: 'dashboard' },
  { label: 'Groups', icon: <Building2 className="w-5 h-5" />, route: 'groups' },
  { label: 'Contributions', icon: <Wallet className="w-5 h-5" />, route: 'contributions' },
  { label: 'Alerts', icon: <Bell className="w-5 h-5" />, route: 'notifications' },
  { label: 'Profile', icon: <User className="w-5 h-5" />, route: 'profile' },
];

export function AppShell({ children, navSet = 'member', groupId, onNavigate }: {
  children?: ReactNode;
  navSet?: 'member' | 'groupAdmin' | 'masterAdmin';
  groupId?: string;
  onNavigate?: (route: Route, params?: Record<string, string>) => void;
}) {
  const { route, navigate } = useRouter();
  const { profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [groupSwitcherOpen, setGroupSwitcherOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (profile?.id) {
      fetchMyGroups(profile.id).then(setGroups);
      fetchNotifications(profile.id).then((ns) => setUnreadCount(ns.filter((n) => !n.read).length));
    }
  }, [profile?.id]);

  const nav = navSet === 'member' ? memberNav : navSet === 'groupAdmin' ? groupAdminNav : masterAdminNav;
  const activeGroup = groups.find((g) => g.id === groupId) ?? groups[0];

  const handleNavigate = useCallback((r: Route, p?: Record<string, string>) => {
    navigate(r, p);
    onNavigate?.(r, p);
    setSidebarOpen(false);
  }, [navigate, onNavigate]);

  const handleLogout = async () => {
    await signOut();
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Desktop sidebar */}
      <aside className={classNames(
        'fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-ink-100 flex flex-col',
        'transition-transform duration-300 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="h-16 flex items-center justify-between px-5 border-b border-ink-100 shrink-0">
          <Logo />
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-ink-400 hover:text-ink-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-400">Menu</div>
          {nav.map((item) => (
            <button
              key={item.route}
              onClick={() => handleNavigate(item.route, item.route === 'group-dashboard' && activeGroup ? { id: activeGroup.id } : undefined)}
              className={classNames(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                route === item.route
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
              )}
            >
              <span className={classNames(route === item.route ? 'text-brand-600' : 'text-ink-400')}>{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.route === 'notifications' && unreadCount > 0 && (
                <span className="bg-danger-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Group switcher */}
        {groups.length > 0 && (
          <div className="px-3 pb-4 border-t border-ink-100 pt-4">
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-400">Current Group</div>
            <button
              onClick={() => setGroupSwitcherOpen(!groupSwitcherOpen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-ink-50 transition-colors"
            >
              <div className={classNames('w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs', activeGroup?.logoColor)}>
                {activeGroup?.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-semibold text-ink-900 truncate">{activeGroup?.name}</div>
                <div className="text-xs text-ink-400">{activeGroup?.groupId}</div>
              </div>
              <ChevronDown className={classNames('w-4 h-4 text-ink-400 transition-transform', groupSwitcherOpen && 'rotate-180')} />
            </button>
            {groupSwitcherOpen && (
              <div className="mt-2 space-y-1 animate-slide-up">
                {groups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => { handleNavigate('group-dashboard', { id: g.id }); setGroupSwitcherOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-ink-50 transition-colors text-left"
                  >
                    <div className={classNames('w-6 h-6 rounded-md flex items-center justify-center text-white font-bold text-[10px]', g.logoColor)}>
                      {g.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-ink-700 truncate">{g.name}</div>
                      <div className="text-[10px] text-ink-400">{formatCompactKES(g.totalContributions)}</div>
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => { handleNavigate('groups'); setGroupSwitcherOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Create New Group
                </button>
              </div>
            )}
          </div>
        )}

        {/* User card + logout */}
        <div className="px-3 pb-4 border-t border-ink-100 pt-3 space-y-1">
          <button onClick={() => handleNavigate('profile')} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-ink-50 transition-colors">
            <Avatar name={profile.fullName} color={profile.avatarColor} size="sm" ring />
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-semibold text-ink-900 truncate">{profile.fullName}</div>
              <div className="text-xs text-ink-400 font-mono">{profile.umojaId}</div>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-ink-500 hover:bg-danger-50 hover:text-danger-600 transition-colors text-sm font-medium"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-ink-950/30 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-md border-b border-ink-100 flex items-center justify-between px-4 sm:px-6 gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-ink-600 hover:text-ink-900">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-ink-900">{greeting()}, {profile.fullName.split(' ')[0]}</p>
              <p className="text-xs text-ink-400">Welcome back to UMOJA</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => handleNavigate('search')}
              className="flex items-center gap-2 h-9 px-3 sm:px-4 rounded-xl bg-ink-50 hover:bg-ink-100 text-ink-400 text-sm transition-colors w-36 sm:w-56"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search members, groups...</span>
              <span className="sm:hidden">Search</span>
            </button>
            <button onClick={() => handleNavigate('notifications')} className="relative h-9 w-9 rounded-xl hover:bg-ink-100 flex items-center justify-center text-ink-600 transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-danger-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                  {unreadCount}
                </span>
              )}
            </button>
            <div className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 rounded-xl hover:bg-ink-100 transition-colors py-1 pl-1 pr-2">
                <Avatar name={profile.fullName} color={profile.avatarColor} size="sm" />
                <ChevronDown className={classNames('w-4 h-4 text-ink-400 transition-transform hidden sm:block', userMenuOpen && 'rotate-180')} />
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-12 z-40 w-52 bg-white rounded-xl shadow-lg border border-ink-100 py-2 animate-slide-up">
                    <div className="px-3 py-2 border-b border-ink-100">
                      <div className="text-sm font-semibold text-ink-900 truncate">{profile.fullName}</div>
                      <div className="text-xs text-ink-400 font-mono">{profile.umojaId}</div>
                    </div>
                    <button onClick={() => { handleNavigate('profile'); setUserMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-ink-600 hover:bg-ink-50 transition-colors">
                      <User className="w-4 h-4" /> View Profile
                    </button>
                    <button onClick={() => { handleLogout(); setUserMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-danger-600 hover:bg-danger-50 transition-colors">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        {children}
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-ink-100 px-2 py-1.5 flex items-center justify-around safe-area">
        {mobileNav.map((item) => (
          <button
            key={item.route}
            onClick={() => handleNavigate(item.route)}
            className={classNames(
              'relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors',
              route === item.route ? 'text-brand-600' : 'text-ink-400',
            )}
          >
            {item.icon}
            <span className="text-[10px] font-semibold">{item.label}</span>
            {item.route === 'notifications' && unreadCount > 0 && (
              <span className="absolute top-0.5 right-1 bg-danger-500 text-white text-[8px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
