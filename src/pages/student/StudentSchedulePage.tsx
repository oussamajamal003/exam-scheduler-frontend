import React from 'react';
import { CalendarClock, MapPin, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageSpinner } from '@/components/shared/PageSpinner';
import { useStudentDashboard } from '@/hooks/roleDashboards/useRoleDashboards';
import { formatTimeSlotLabel } from '@/lib/dateTime';

export const StudentSchedulePage: React.FC = () => {
  const dashboardQuery = useStudentDashboard();
  const assignments = dashboardQuery.data?.assignments ?? [];

  if (dashboardQuery.isLoading) return <PageSpinner label="Loading student schedule" />;

  return (
    <div className="space-y-5 p-5 sm:p-6 lg:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">My Exam Schedule</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Published exams for your registrations</h1>
      </div>

      <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            <CalendarClock className="size-4 text-zinc-400" />
            Exam Assignments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {dashboardQuery.isError ? (
            <p className="py-8 text-center text-sm text-rose-600 dark:text-rose-300">Unable to load your schedule.</p>
          ) : assignments.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">No published exam assignments are available yet.</p>
          ) : (
            assignments.map((assignment) => {
              const course = assignment.exam?.courseOffering?.course;
              return (
                <div key={assignment.id} className="grid gap-4 rounded-none border border-zinc-200/70 bg-zinc-50/70 p-4 dark:border-zinc-800/70 dark:bg-zinc-900/40 lg:grid-cols-[1.4fr_1fr_1fr]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-zinc-950 dark:text-zinc-50">{[course?.code, course?.title].filter(Boolean).join(' • ') || 'Exam'}</p>
                      <Badge>{assignment.exam?.status ?? 'SCHEDULED'}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{formatTimeSlotLabel(assignment.timeSlot)}</p>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-zinc-400" />
                    <span>{assignment.room?.center?.name ?? 'Center TBD'} • {assignment.room?.name ?? 'Room TBD'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                    <UserCheck className="mt-0.5 size-4 shrink-0 text-zinc-400" />
                    <span>{assignment.proctor?.user?.name ?? 'Proctor TBD'}</span>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};
