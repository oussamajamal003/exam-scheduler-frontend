import React from 'react';
import { BookOpen, Building2, CalendarClock, ClipboardList, Users, UserCheck } from 'lucide-react';
import { AnalyticsCard } from '@/components/dashboard/AnalyticsCard';
import { RealBarChart } from '@/components/dashboard/RealBarChart';
import { SmartStatusCard } from '@/components/dashboard/SmartStatusCard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageSpinner } from '@/components/shared/PageSpinner';
import { useProctorDashboard } from '@/hooks/roleDashboards/useRoleDashboards';
import { formatTimeSlotLabel } from '@/lib/dateTime';

const getDutyLabel = (assignment?: { exam?: { courseOffering?: { course?: { code?: string | null; title?: string | null } | null } | null } | null }) => {
  const course = assignment?.exam?.courseOffering?.course;
  return [course?.code, course?.title].filter(Boolean).join(' • ') || 'Exam duty';
};

export const ProctorDashboardPage: React.FC = () => {
  const dashboardQuery = useProctorDashboard();
  const data = dashboardQuery.data;
  const nextAssignment = data?.nextAssignment;

  if (dashboardQuery.isLoading) return <PageSpinner label="Loading proctor dashboard" />;

  if (dashboardQuery.isError) {
    return (
      <div className="p-5 sm:p-6 lg:p-8">
        <Card className="rounded-none border-rose-200 bg-rose-50 dark:border-rose-900/70 dark:bg-rose-950/25">
          <CardContent className="p-5 text-sm font-medium text-rose-700 dark:text-rose-300">
            Unable to load your proctor dashboard.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 p-5 sm:p-6 lg:p-8">
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Proctor Workspace</p>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Welcome, {data.profile.user?.name ?? 'Proctor'}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{data.profile.center?.name ?? 'Center not assigned'}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <AnalyticsCard title="Assigned Duties" value={data.summary.assignedDuties} icon={ClipboardList} accent="indigo" subtitle="Published schedules" />
        <AnalyticsCard title="Upcoming Duties" value={data.summary.upcomingDuties} icon={CalendarClock} accent="amber" subtitle="Still ahead" />
        <AnalyticsCard title="Related Students" value={data.summary.relatedStudents} icon={Users} accent="sky" subtitle="Across assigned exams" />
        <AnalyticsCard title="Assigned Courses" value={data.summary.assignedCourses} icon={BookOpen} accent="emerald" subtitle="Unique courses" />
        <AnalyticsCard title="Centers" value={data.summary.centers} icon={Building2} accent="violet" subtitle="Duty locations" />
      </div>

      <SmartStatusCard
        title={nextAssignment ? getDutyLabel(nextAssignment) : 'No published duty yet'}
        description={nextAssignment ? formatTimeSlotLabel(nextAssignment.timeSlot) : 'Your duties will appear when final schedules assign you to exams.'}
        statusLabel={nextAssignment ? 'Next Duty' : 'Waiting'}
        tone={nextAssignment ? 'info' : 'warning'}
        icon={UserCheck}
        metadata={[
          { label: 'Room', value: nextAssignment?.room?.name ?? '—' },
          { label: 'Center', value: nextAssignment?.room?.center?.name ?? '—' },
          { label: 'Students', value: nextAssignment?.exam?.courseOffering?.registrations?.length ?? 0 },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <RealBarChart title="Duties by Day" icon={CalendarClock} data={data.charts.dutiesByDay} tone="indigo" emptyLabel="No duties by day yet" />
        <RealBarChart title="Duties by Center" icon={Building2} data={data.charts.dutiesByCenter} tone="emerald" emptyLabel="No duty centers yet" />
        <RealBarChart title="Duties by Course" icon={BookOpen} data={data.charts.dutiesByCourse} tone="sky" emptyLabel="No assigned courses yet" />
      </div>

      <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Upcoming Duties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.assignments.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">No published proctor duties are assigned to you yet.</p>
          ) : (
            data.assignments.slice(0, 6).map((assignment) => (
              <div key={assignment.id} className="grid gap-3 rounded-none border border-zinc-200/70 bg-zinc-50/70 p-4 dark:border-zinc-800/70 dark:bg-zinc-900/40 md:grid-cols-[1.4fr_1fr_1fr]">
                <div>
                  <p className="font-semibold text-zinc-950 dark:text-zinc-50">{getDutyLabel(assignment)}</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{formatTimeSlotLabel(assignment.timeSlot)}</p>
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-300">{assignment.room?.center?.name ?? 'Center TBD'} • {assignment.room?.name ?? 'Room TBD'}</div>
                <div className="flex items-center justify-start md:justify-end">
                  <Badge>{assignment.exam?.courseOffering?.registrations?.length ?? 0} students</Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
