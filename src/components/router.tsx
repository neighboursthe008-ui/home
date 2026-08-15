import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

export type Route =
  | 'dashboard'
  | 'contributions'
  | 'groups'
  | 'group-dashboard'
  | 'contributors'
  | 'notifications'
  | 'profile'
  | 'transactions'
  | 'reports'
  | 'analytics'
  | 'members'
  | 'activity-log'
  | 'group-settings'
  | 'admin-dashboard'
  | 'admin-groups'
  | 'admin-members'
  | 'admin-transactions'
  | 'admin-analytics'
  | 'admin-reports'
  | 'admin-administrators'
  | 'admin-system-logs'
  | 'admin-settings'
  | 'search';

interface RouterContextType {
  route: Route;
  params: Record<string, string>;
  navigate: (route: Route, params?: Record<string, string>) => void;
}

export const RouterContext = createContext<RouterContextType>({
  route: 'dashboard',
  params: {},
  navigate: () => {},
});

export function useRouter() {
  return useContext(RouterContext);
}

export function Link({ to, params, children, className, onClick }: {
  to: Route;
  params?: Record<string, string>;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const { navigate } = useRouter();
  return (
    <a
      href="#"
      onClick={(e) => { e.preventDefault(); navigate(to, params); onClick?.(); }}
      className={className}
    >
      {children}
    </a>
  );
}
