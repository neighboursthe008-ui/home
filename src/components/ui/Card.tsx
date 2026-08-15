import type { ReactNode } from 'react';
import { classNames } from '@/lib/format';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const padMap = { none: '', sm: 'p-4', md: 'p-5 sm:p-6', lg: 'p-6 sm:p-8' };

export function Card({ children, className, hover, padding = 'md', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={classNames(
        'card-premium',
        padMap[padding],
        hover && 'transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, icon }: { title: string; subtitle?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div className="flex items-start gap-3">
        {icon && <div className="shrink-0 mt-0.5 text-brand-600">{icon}</div>}
        <div>
          <h3 className="font-display font-semibold text-ink-900 text-base sm:text-lg">{title}</h3>
          {subtitle && <p className="text-sm text-ink-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
