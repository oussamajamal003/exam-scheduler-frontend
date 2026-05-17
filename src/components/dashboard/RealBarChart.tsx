import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface ChartDatum {
  name: string;
  value: number;
}

interface RealBarChartProps {
  title: string;
  data: ChartDatum[];
  icon: LucideIcon;
  loading?: boolean;
  emptyLabel?: string;
  formatValue?: (v: number) => string;
  /** total to compute percent share; if not passed, uses max */
  total?: number;
  /** color tone for the bar fill */
  tone?: 'indigo' | 'emerald' | 'amber' | 'sky' | 'violet' | 'rose';
}

const TONE_BAR: Record<NonNullable<RealBarChartProps['tone']>, string> = {
  indigo: 'bg-gradient-to-r from-indigo-500 to-indigo-400 dark:from-indigo-400 dark:to-indigo-500',
  emerald: 'bg-gradient-to-r from-emerald-500 to-emerald-400 dark:from-emerald-400 dark:to-emerald-500',
  amber: 'bg-gradient-to-r from-amber-500 to-amber-400 dark:from-amber-400 dark:to-amber-500',
  sky: 'bg-gradient-to-r from-sky-500 to-sky-400 dark:from-sky-400 dark:to-sky-500',
  violet: 'bg-gradient-to-r from-violet-500 to-violet-400 dark:from-violet-400 dark:to-violet-500',
  rose: 'bg-gradient-to-r from-rose-500 to-rose-400 dark:from-rose-400 dark:to-rose-500',
};

const widthClassForPct = (pct: number) => {
  if (pct >= 95) return 'w-full';
  if (pct >= 90) return 'w-11/12';
  if (pct >= 80) return 'w-4/5';
  if (pct >= 75) return 'w-3/4';
  if (pct >= 66) return 'w-2/3';
  if (pct >= 60) return 'w-3/5';
  if (pct >= 50) return 'w-1/2';
  if (pct >= 40) return 'w-2/5';
  if (pct >= 33) return 'w-1/3';
  if (pct >= 25) return 'w-1/4';
  if (pct >= 20) return 'w-1/5';
  if (pct >= 10) return 'w-[10%]';
  if (pct > 0) return 'w-[5%]';
  return 'w-0';
};

export const RealBarChart: React.FC<RealBarChartProps> = ({
  title,
  data,
  icon: Icon,
  loading,
  emptyLabel = 'No data yet',
  formatValue = (v) => v.toLocaleString(),
  total,
  tone = 'indigo',
}) => {
  const maxValue = data.length > 0 ? Math.max(...data.map((d) => d.value)) : 0;
  const denom = total ?? maxValue;

  return (
    <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800/70 dark:bg-zinc-950">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{title}</CardTitle>
        <Icon className="size-4 text-zinc-400 dark:text-zinc-500" />
      </CardHeader>
      <CardContent className="pb-5">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-2 flex-1" />
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{emptyLabel}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((item) => {
              const pct = denom > 0 ? Math.max(2, Math.round((item.value / denom) * 100)) : 0;
              return (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-24 shrink-0 truncate text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {item.name}
                  </div>
                  <div className="relative flex-1 overflow-hidden rounded-none bg-zinc-100 dark:bg-zinc-800/70">
                    <div className={cn('h-2 rounded-none transition-all duration-700 ease-out', TONE_BAR[tone], widthClassForPct(pct))} />
                  </div>
                  <div className="w-12 shrink-0 text-right text-xs font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {formatValue(item.value)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
