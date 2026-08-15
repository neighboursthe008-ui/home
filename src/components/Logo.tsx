import { classNames } from '@/lib/format';

export function Logo({ size = 'md', light }: { size?: 'sm' | 'md' | 'lg'; light?: boolean }) {
  const sizes = {
    sm: { box: 'w-8 h-8 rounded-lg', text: 'text-lg', icon: 18 },
    md: { box: 'w-10 h-10 rounded-xl', text: 'text-xl', icon: 22 },
    lg: { box: 'w-12 h-12 rounded-2xl', text: 'text-2xl', icon: 28 },
  };
  const s = sizes[size];
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className={classNames(
        'flex items-center justify-center bg-gradient-to-br from-brand-500 to-secondary-600 text-white shadow-md shadow-brand-500/20',
        s.box,
      )}>
        <svg width={s.icon} height={s.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          {/* U mark — interconnected nodes representing community */}
          <circle cx="12" cy="5" r="2.5" />
          <circle cx="5" cy="17" r="2.5" />
          <circle cx="19" cy="17" r="2.5" />
          <path d="M12 7.5v3.5M12 11l-5 4M12 11l5 4M7 17h10" />
        </svg>
      </div>
      <span className={classNames('font-display font-extrabold tracking-tight', s.text, light ? 'text-white' : 'text-ink-900')}>
        UMOJA
      </span>
    </div>
  );
}
