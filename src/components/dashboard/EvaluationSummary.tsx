import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Gauge, ShieldCheck, Sparkles } from 'lucide-react';

interface EvaluationSummaryProps {
  qualityScore?: number | null;
  hardConstraintScore?: number | null;
  softConstraintScore?: number | null;
  loading?: boolean;
}

const toPct = (v?: number | null) => {
  if (v == null || Number.isNaN(v)) return null;
  // Scores may be in 0-1 or 0-100 range; normalize.
  if (v <= 1.0001) return Math.max(0, Math.min(100, Math.round(v * 100)));
  return Math.max(0, Math.min(100, Math.round(v)));
};

const scoreColor = (pct: number) =>
  pct >= 85
    ? 'text-emerald-600 dark:text-emerald-400'
    : pct >= 65
      ? 'text-sky-600 dark:text-sky-400'
      : pct >= 40
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-rose-600 dark:text-rose-400';

const ringColor = (pct: number) =>
  pct >= 85
    ? 'stroke-emerald-500'
    : pct >= 65
      ? 'stroke-sky-500'
      : pct >= 40
        ? 'stroke-amber-500'
        : 'stroke-rose-500';

const ScoreRing: React.FC<{ value: number; label: string }> = ({ value, label }) => {
  const size = 88;
  const radius = 38;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative inline-flex">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={8}
            className="fill-none stroke-zinc-100 dark:stroke-zinc-800"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            className={cn('fill-none transition-all duration-700 ease-out', ringColor(value))}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-xl font-bold tabular-nums', scoreColor(value))}>{value}</span>
          <span className="text-[9px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">/ 100</span>
        </div>
      </div>
      <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">{label}</span>
    </div>
  );
};

export const EvaluationSummary: React.FC<EvaluationSummaryProps> = ({
  qualityScore,
  hardConstraintScore,
  softConstraintScore,
  loading,
}) => {
  const quality = toPct(qualityScore);
  const hard = toPct(hardConstraintScore);
  const soft = toPct(softConstraintScore);

  return (
    <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
      <CardHeader className="border-b border-zinc-100 pb-3 dark:border-zinc-800/70">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          <Gauge className="size-4 text-zinc-400 dark:text-zinc-500" />
          Evaluation Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        {loading ? (
          <div className="flex items-center justify-around gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="size-22 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : quality == null && hard == null && soft == null ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-center">
            <Sparkles className="size-6 text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">No evaluation yet</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Generate or publish a schedule to see quality metrics.
            </p>
          </div>
        ) : (
          <div className="flex items-start justify-around gap-3">
            {quality != null && <ScoreRing value={quality} label="Quality" />}
            {hard != null && <ScoreRing value={hard} label="Hard Rules" />}
            {soft != null && <ScoreRing value={soft} label="Soft Rules" />}
          </div>
        )}

        {!loading && (quality != null || hard != null || soft != null) && (
          <div className="mt-5 flex items-center gap-2 rounded-none border border-zinc-200/60 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-zinc-800/70 dark:bg-zinc-900/60 dark:text-zinc-400">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            Hard constraints are mandatory rules (e.g. no overlaps). Soft constraints reflect preferences (e.g. spacing).
          </div>
        )}
      </CardContent>
    </Card>
  );
};
