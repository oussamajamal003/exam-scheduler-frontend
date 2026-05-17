import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { TrendingUp, ArrowUpRight } from 'lucide-react';

interface OptimizationSummaryProps {
  beforeScore?: number | null;
  afterScore?: number | null;
  strategy?: string | null;
  attempted?: boolean;
  loading?: boolean;
}

const toPct = (v?: number | null) => {
  if (v == null || Number.isNaN(v)) return null;
  if (v <= 1.0001) return Math.max(0, Math.min(100, Math.round(v * 100)));
  return Math.max(0, Math.min(100, Math.round(v)));
};

export const OptimizationSummary: React.FC<OptimizationSummaryProps> = ({
  beforeScore,
  afterScore,
  strategy,
  attempted,
  loading,
}) => {
  const before = toPct(beforeScore);
  const after = toPct(afterScore);
  const delta = before != null && after != null ? after - before : null;
  const positive = delta != null && delta > 0;

  return (
    <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
      <CardHeader className="border-b border-zinc-100 pb-3 dark:border-zinc-800/70">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          <TrendingUp className="size-4 text-zinc-400 dark:text-zinc-500" />
          Optimization
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        ) : before == null && after == null ? (
          <div className="flex h-32 flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {attempted === false ? 'Optimization not attempted' : 'No optimization data'}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Run the optimizer to compare before/after quality.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Before</p>
                <p className="text-2xl font-bold tabular-nums text-zinc-700 dark:text-zinc-300">
                  {before ?? '—'}<span className="text-sm text-zinc-400">/100</span>
                </p>
              </div>
              <ArrowUpRight className={cn('size-6 shrink-0', positive ? 'text-emerald-500' : 'text-zinc-400 dark:text-zinc-500')} />
              <div className="flex-1 space-y-1 text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">After</p>
                <p className="text-2xl font-bold tabular-nums text-zinc-950 dark:text-zinc-50">
                  {after ?? '—'}<span className="text-sm text-zinc-400">/100</span>
                </p>
              </div>
            </div>

            {delta != null && (
              <div
                className={cn(
                  'flex items-center justify-between rounded-none border p-3 text-xs font-semibold',
                  positive
                    ? 'border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : delta < 0
                      ? 'border-rose-200/70 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300'
                      : 'border-zinc-200/70 bg-zinc-50 text-zinc-700 dark:border-zinc-800/70 dark:bg-zinc-900/60 dark:text-zinc-300'
                )}
              >
                <span>
                  {positive ? 'Improved' : delta < 0 ? 'Regressed' : 'No change'} by {Math.abs(delta)} pts
                </span>
                {strategy && (
                  <span className="font-medium opacity-80">via {strategy}</span>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
