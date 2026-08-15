import { classNames, initials } from '@/lib/format';

interface AvatarProps {
  name: string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  ring?: boolean;
}

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

export function Avatar({ name, color = 'bg-ink-500', size = 'md', className, ring }: AvatarProps) {
  return (
    <div className={classNames(
      'rounded-full flex items-center justify-center font-semibold text-white shrink-0',
      color, sizeMap[size], ring && 'ring-2 ring-white shadow-sm', className,
    )}>
      {initials(name)}
    </div>
  );
}

export function GroupAvatar({ name, color, size = 'md', className }: { name: string; color: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeMap = { sm: 'w-9 h-9 text-sm rounded-xl', md: 'w-11 h-11 text-base rounded-xl', lg: 'w-14 h-14 text-lg rounded-2xl' };
  return (
    <div className={classNames(
      'flex items-center justify-center font-display font-bold text-white shrink-0 shadow-sm',
      color, sizeMap[size], className,
    )}>
      {initials(name)}
    </div>
  );
}
