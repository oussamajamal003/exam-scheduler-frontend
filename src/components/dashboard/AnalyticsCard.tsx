import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';

interface AnalyticsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; direction: 'up' | 'down' | 'neutral'; label?: string };
  accent?: 'zinc' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet';
  loading?: boolean;
}

const ACCENTS: Record<NonNullable<AnalyticsCardProps['accent']>, { ring: string; iconBg: string; iconText: string }> = {
  zinc: { ring: 'ring-zinc-200/70 dark:ring-zinc-800/70', iconBg: 'bg-zinc-100 dark:bg-zinc-900', iconText: 'text-zinc-700 dark:text-zinc-300' },
  indigo: { ring: 'ring-indigo-200/70 dark:ring-indigo-900/60', iconBg: 'bg-indigo-50 dark:bg-indigo-950/50', iconText: 'text-indigo-600 dark:text-indigo-400' },
  emerald: { ring: 'ring-emerald-200/70 dark:ring-emerald-900/60', iconBg: 'bg-emerald-50 dark:bg-emerald-950/50', iconText: 'text-emerald-600 dark:text-emerald-400' },
  amber: { ring: 'ring-amber-200/70 dark:ring-amber-900/60', iconBg: 'bg-amber-50 dark:bg-amber-950/50', iconText: 'text-amber-600 dark:text-amber-400' },
  rose: { ring: 'ring-rose-200/70 dark:ring-rose-900/60', iconBg: 'bg-rose-50 dark:bg-rose-950/50', iconText: 'text-rose-600 dark:text-rose-400' },
  sky: { ring: 'ring-sky-200/70 dark:ring-sky-900/60', iconBg: 'bg-sky-50 dark:bg-sky-950/50', iconText: 'text-sky-600 dark:text-sky-400' },
  violet: { ring: 'ring-violet-200/70 dark:ring-violet-900/60', iconBg: 'bg-violet-50 dark:bg-violet-950/50', iconText: 'text-violet-600 dark:text-violet-400' },
};

const useCountUp = (target: number, duration = 800) => {
  const [value, setValue] = React.useState(0);
  React.useEffect(() => {
    if (!Number.isFinite(target)) return;
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const animate = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
};

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accent = 'zinc',
  loading,
}) => {
  const accentClasses = ACCENTS[accent];
  const isNumericValue = typeof value === 'number';
  const animated = useCountUp(isNumericValue ? value : 0);
  const displayValue = isNumericValue ? animated.toLocaleString() : value;

  const TrendIcon = trend?.direction === 'up' ? TrendingUp : trend?.direction === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend?.direction === 'up'
      ? 'text-emerald-600 dark:text-emerald-400'
      : trend?.direction === 'down'
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-zinc-500 dark:text-zinc-400';

  return (
    <Card
      className={cn(
        'group relative overflow-hidden rounded-none border border-zinc-200/70 bg-white shadow-sm ring-1 ring-transparent transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800/70 dark:bg-zinc-950',
        accentClasses.ring
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              {title}
            </p>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold tracking-tight text-zinc-950 tabular-nums dark:text-zinc-50">
                {displayValue}
              </p>
            )}
            {loading ? (
              <Skeleton className="h-3 w-32" />
            ) : (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {trend && (
                  <span className={cn('inline-flex items-center gap-1 font-semibold', trendColor)}>
                    <TrendIcon className="size-3.5" />
                    {trend.value > 0 ? `+${trend.value}` : trend.value}
                    {trend.label && <span className="font-normal text-zinc-500 dark:text-zinc-400">{trend.label}</span>}
                  </span>
                )}
                {subtitle && (
                  <span className="text-zinc-500 dark:text-zinc-400">{subtitle}</span>
                )}
              </div>
            )}
          </div>
          <div className={cn('rounded-none p-2.5 transition-transform group-hover:scale-105', accentClasses.iconBg, accentClasses.iconText)}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
