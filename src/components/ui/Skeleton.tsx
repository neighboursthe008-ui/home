import { classNames } from '@/lib/format';

export function Skeleton({ className }: { className?: string }) {
  return <div className={classNames('skeleton rounded-lg', className)} />;
}

export function SkeletonCard() {
  return (
    <div className="card-premium p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}

export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonChart() {
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-2 h-48">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="flex-1" />
        ))}
      </div>
      <Skeleton className="h-4 w-full" />
    </div>
  );
}
