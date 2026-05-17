import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarClock, ArrowRight } from 'lucide-react';
import type { Schedule } from '@/schemas/schedule';

interface ScheduleOverviewProps {
  schedules?: Schedule[];
  loading?: boolean;
  onOpen?: (schedule: Schedule) => void;
  onViewAll?: () => void;
}

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
};

export const ScheduleOverview: React.FC<ScheduleOverviewProps> = ({
  schedules,
  loading,
  onOpen,
  onViewAll,
}) => {
  const top = (schedules ?? [])
    .slice()
    .sort((a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime())
    .slice(0, 5);

  return (
    <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
      <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800/70">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          <CalendarClock className="size-4 text-zinc-400 dark:text-zinc-500" />
          Recent Schedules
        </CardTitle>
        {onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll} className="h-8 text-xs">
            View all
            <ArrowRight className="size-3.5" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        ) : top.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No schedules yet</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Generate your first schedule to see it here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
            {top.map((s) => {
              const assignments = s._count?.assignments ?? s.assignments?.length ?? 0;
              return (
                <li
                  key={s.id}
                  className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                        {s.name}
                      </p>
                      <Badge
                        className={
                          s.isFinal
                            ? 'border border-emerald-200 bg-emerald-50 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'border border-zinc-200 bg-zinc-50 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'
                        }
                      >
                        {s.isFinal ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {assignments} {assignments === 1 ? 'assignment' : 'assignments'} · Updated {formatDate(s.updatedAt ?? s.createdAt)}
                    </p>
                  </div>
                  {onOpen && (
                    <Button variant="outline" size="sm" className="h-8 w-fit rounded-none text-xs" onClick={() => onOpen(s)}>
                      Open
                      <ArrowRight className="size-3.5" />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
