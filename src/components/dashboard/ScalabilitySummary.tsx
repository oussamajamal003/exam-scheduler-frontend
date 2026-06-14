import React from 'react';
import { Gauge, TimerReset, ShieldCheck, BarChart3, Sparkles } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import type { ScalabilityEvaluation } from '@/hooks/dashboard/useDashboardAnalytics';

interface ScalabilitySummaryProps {
  metrics?: ScalabilityEvaluation | null;
  loading?: boolean;
}

const formatTimestamp = (value?: string | null) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return value;
  }
};

const formatDuration = (ms?: number | null, seconds?: number | null) => {
  if (ms == null && seconds == null) return '—';
  const msLabel = ms == null ? null : `${ms} ms`;
  const secondsLabel = seconds == null ? null : `${seconds.toFixed(2)} sec`;
  return [msLabel, secondsLabel].filter(Boolean).join(' / ');
};

const formatNumber = (value?: number | null) => {
  if (value == null || Number.isNaN(value)) return '—';
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
};

const formatPercent = (value?: number | null) => {
  if (value == null || Number.isNaN(value)) return '—';
  return `${Number.isInteger(value) ? value : value.toFixed(2)}%`;
};

const MetricBox: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="rounded-none border border-zinc-200/70 bg-zinc-50/80 p-3 dark:border-zinc-800/70 dark:bg-zinc-900/50">
    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</p>
    <p className="mt-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">{value}</p>
  </div>
);

const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({
  title,
  icon,
  children,
}) => (
  <div className="rounded-none border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
      {icon}
      <span>{title}</span>
    </div>
    {children}
  </div>
);

export const ScalabilitySummary: React.FC<ScalabilitySummaryProps> = ({ metrics, loading }) => {
  return (
    <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
      <CardHeader className="border-b border-zinc-100 pb-3 dark:border-zinc-800/70">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          <BarChart3 className="size-4 text-zinc-400 dark:text-zinc-500" />
          Large Dataset Testing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : metrics == null ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-center">
            <Sparkles className="size-6 text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
              No scalability evaluation recorded
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Generate a large dataset schedule to capture performance and quality telemetry.
            </p>
          </div>
        ) : (
          <>
            <SectionCard title="Schedule Generation Time" icon={<TimerReset className="size-3.5 text-indigo-500" />}>
              <div className="grid gap-3 md:grid-cols-3">
                <MetricBox label="Start Timestamp" value={formatTimestamp(metrics.generation.startedAt)} />
                <MetricBox label="End Timestamp" value={formatTimestamp(metrics.generation.endedAt)} />
                <MetricBox label="Duration" value={formatDuration(metrics.generation.durationMs, metrics.generation.durationSeconds)} />
              </div>
            </SectionCard>

            <SectionCard title="Scheduling Success Rate" icon={<Gauge className="size-3.5 text-emerald-500" />}>
              <div className="grid gap-3 md:grid-cols-3">
                <MetricBox label="Exams Scheduled" value={formatNumber(metrics.successRate.examsScheduled)} />
                <MetricBox label="Exams Failed" value={formatNumber(metrics.successRate.examsFailed)} />
                <MetricBox label="Success Percentage" value={formatPercent(metrics.successRate.successPercentage)} />
              </div>
            </SectionCard>

            <SectionCard title="Constraint Validation Results" icon={<ShieldCheck className="size-3.5 text-rose-500" />}>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <MetricBox label="Student Conflicts" value={formatNumber(metrics.constraintValidation.studentConflicts)} />
                <MetricBox label="Room Capacity Violations" value={formatNumber(metrics.constraintValidation.roomCapacityViolations)} />
                <MetricBox label="Room Double-Booking Violations" value={formatNumber(metrics.constraintValidation.roomDoubleBookingViolations)} />
                <MetricBox label="Proctor Double-Booking Violations" value={formatNumber(metrics.constraintValidation.proctorDoubleBookingViolations)} />
              </div>
            </SectionCard>

            <SectionCard title="Resource Utilization Metrics" icon={<BarChart3 className="size-3.5 text-sky-500" />}>
              <div className="grid gap-3 md:grid-cols-3">
                <MetricBox label="Room Utilization" value={formatPercent(metrics.resourceUtilization.roomUtilization)} />
                <MetricBox label="Proctor Utilization" value={formatPercent(metrics.resourceUtilization.proctorUtilization)} />
                <MetricBox label="Timeslot Utilization" value={formatPercent(metrics.resourceUtilization.timeslotUtilization)} />
              </div>
            </SectionCard>

            <SectionCard title="Quality Metrics" icon={<Gauge className="size-3.5 text-amber-500" />}>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <MetricBox label="Room Utilization Score" value={formatPercent(metrics.qualityMetrics.roomUtilizationScore)} />
                <MetricBox label="Proctor Balance Score" value={formatPercent(metrics.qualityMetrics.proctorBalanceScore)} />
                <MetricBox label="Student Spacing Score" value={formatPercent(metrics.qualityMetrics.studentSpacingScore)} />
                <MetricBox label="Distribution Score" value={formatPercent(metrics.qualityMetrics.distributionScore)} />
                <MetricBox label="Overall Quality Score" value={formatPercent(metrics.qualityMetrics.overallQualityScore)} />
              </div>
            </SectionCard>
          </>
        )}
      </CardContent>
    </Card>
  );
};
