import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Sparkles, ArrowRight, GraduationCap } from 'lucide-react';

interface DashboardHeaderProps {
  userName?: string | null;
  semesterName?: string | null;
  semesterRange?: string | null;
  scheduleStatusLabel?: string;
  scheduleStatusTone?: 'neutral' | 'success' | 'warning' | 'info';
  onGenerateSchedule?: () => void;
  onViewSchedules?: () => void;
}

const TONE_BADGE: Record<NonNullable<DashboardHeaderProps['scheduleStatusTone']>, string> = {
  neutral: 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300',
  warning: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300',
  info: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-300',
};

const greetingFor = (hour: number) =>
  hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userName,
  semesterName,
  semesterRange,
  scheduleStatusLabel,
  scheduleStatusTone = 'neutral',
  onGenerateSchedule,
  onViewSchedules,
}) => {
  const greeting = greetingFor(new Date().getHours());

  return (
    <Card className="overflow-hidden rounded-none border border-zinc-200/70 bg-linear-to-br from-white via-white to-zinc-50 shadow-sm dark:border-zinc-800/70 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900">
      <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.5fr_1fr] lg:p-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            <Sparkles className="size-3.5" />
            Scheduling Command Center
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
              {greeting}{userName ? `, ${userName.split(' ')[0]}` : ''}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Live operational snapshot of exam scheduling quality, resource readiness, and optimization insights.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {onGenerateSchedule && (
              <Button
                onClick={onGenerateSchedule}
                className="h-10 rounded-none bg-zinc-950 px-5 text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Generate Schedule
                <ArrowRight className="size-4" />
              </Button>
            )}
            {onViewSchedules && (
              <Button
                onClick={onViewSchedules}
                variant="outline"
                className="h-10 rounded-none border-zinc-200 bg-white px-5 text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                View Schedules
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-2.5">
          <div className="flex items-center justify-between rounded-none border border-zinc-200/60 bg-white/80 p-4 backdrop-blur-sm dark:border-zinc-800/60 dark:bg-zinc-900/50">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Active Semester
              </p>
              <p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                {semesterName ?? 'No semester'}
              </p>
              {semesterRange && (
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{semesterRange}</p>
              )}
            </div>
            <GraduationCap className="size-5 shrink-0 text-zinc-400 dark:text-zinc-500" />
          </div>
          <div className="flex items-center justify-between rounded-none border border-zinc-200/60 bg-white/80 p-4 backdrop-blur-sm dark:border-zinc-800/60 dark:bg-zinc-900/50">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Scheduling Status
              </p>
              {scheduleStatusLabel ? (
                <Badge className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${TONE_BADGE[scheduleStatusTone]}`}>
                  {scheduleStatusLabel}
                </Badge>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">—</p>
              )}
            </div>
            <CalendarDays className="size-5 shrink-0 text-zinc-400 dark:text-zinc-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
