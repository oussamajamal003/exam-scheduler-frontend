import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export interface WeakArea {
  area: string;
  score: number; // 0-100 or 0-1 (auto-detected)
}

interface WeakAreasPanelProps {
  weakAreas?: WeakArea[];
  loading?: boolean;
}

const normalize = (v: number) => (v <= 1.0001 ? Math.round(v * 100) : Math.round(v));

const severityFor = (pct: number) =>
  pct < 40
    ? { label: 'Critical', color: 'text-rose-600 dark:text-rose-400', bar: 'bg-rose-500' }
    : pct < 65
      ? { label: 'Weak', color: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' }
      : { label: 'OK', color: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' };

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

export const WeakAreasPanel: React.FC<WeakAreasPanelProps> = ({ weakAreas, loading }) => {
  const items = (weakAreas ?? []).map((w) => ({ ...w, pct: normalize(w.score) }));
  const sorted = [...items].sort((a, b) => a.pct - b.pct).slice(0, 6);

  return (
    <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
      <CardHeader className="border-b border-zinc-100 pb-3 dark:border-zinc-800/70">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          <AlertTriangle className="size-4 text-amber-500" />
          Weak Areas
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-center">
            <CheckCircle2 className="size-7 text-emerald-500" />
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No weak areas detected</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              All evaluation areas are performing well.
            </p>
          </div>
        ) : (
          <ul className="space-y-3.5">
            {sorted.map((w) => {
              const sev = severityFor(w.pct);
              return (
                <li key={w.area} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{w.area}</span>
                    <span className={cn('font-semibold tabular-nums', sev.color)}>
                      {w.pct}/100 · {sev.label}
                    </span>
                  </div>
                  <div className="relative h-1.5 w-full overflow-hidden rounded-none bg-zinc-100 dark:bg-zinc-800/70">
                    <div className={cn('h-full rounded-none transition-all duration-700', sev.bar, widthClassForPct(w.pct))} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
