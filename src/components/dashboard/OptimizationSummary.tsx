import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Gauge } from 'lucide-react';

interface FinalScheduleQualitySummaryProps {
  overallQuality?: number | null;
  roomUtilization?: number | null;
  proctorBalance?: number | null;
  studentSpacing?: number | null;
  distribution?: number | null;
  loading?: boolean;
}

const toPct = (value?: number | null) => {
  if (value == null || Number.isNaN(value)) return null;
  if (value <= 1.0001) return Math.max(0, Math.min(100, Math.round(value * 100)));
  return Math.max(0, Math.min(100, Math.round(value)));
};

const metricWeights = [
  { key: 'roomUtilization', label: 'Room Utilization', weight: '25%' },
  { key: 'proctorBalance', label: 'Proctor Balance', weight: '30%' },
  { key: 'studentSpacing', label: 'Student Spacing', weight: '30%' },
  { key: 'distribution', label: 'Distribution', weight: '15%' },
] as const;

export const FinalScheduleQualitySummary: React.FC<FinalScheduleQualitySummaryProps> = ({
  overallQuality,
  roomUtilization,
  proctorBalance,
  studentSpacing,
  distribution,
  loading,
}) => {
  const score = toPct(overallQuality);
  const metricValues = {
    roomUtilization: toPct(roomUtilization),
    proctorBalance: toPct(proctorBalance),
    studentSpacing: toPct(studentSpacing),
    distribution: toPct(distribution),
  };

  return (
    <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
      <CardHeader className="border-b border-zinc-100 pb-3 dark:border-zinc-800/70">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          <Gauge className="size-4 text-zinc-400 dark:text-zinc-500" />
          Final Schedule Quality
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        ) : score == null ? (
          <div className="flex h-32 flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              No final quality data available
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Generate a schedule to compute the final KPI aggregate.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Overall Quality
                </p>
                <p className="mt-1 text-4xl font-black tabular-nums tracking-tight text-zinc-950 dark:text-zinc-50">
                  {score}<span className="text-base font-semibold text-zinc-400">/100</span>
                </p>
              </div>
              <div className={cn(
                'rounded-none border px-3 py-2 text-xs font-semibold',
                score >= 85
                  ? 'border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : score >= 65
                    ? 'border-sky-200/70 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-300'
                    : score >= 45
                      ? 'border-amber-200/70 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300'
                      : 'border-rose-200/70 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300'
              )}>
                Weighted final KPI aggregate
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {metricWeights.map((metric) => {
                const value = metricValues[metric.key];
                return (
                  <div key={metric.key} className="rounded-none border border-zinc-200/70 bg-zinc-50/80 p-3 dark:border-zinc-800/70 dark:bg-zinc-900/50">
                    <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      <span>{metric.label}</span>
                      <span>{metric.weight}</span>
                    </div>
                    <p className="mt-2 text-2xl font-black tabular-nums tracking-tight text-zinc-950 dark:text-zinc-50">
                      {value != null ? `${value}%` : '—'}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
