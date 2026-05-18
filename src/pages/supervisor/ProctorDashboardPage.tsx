import React from 'react';
import {
  Bell,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock4,
  ClipboardList,
  Gauge,
  MapPin,
  Megaphone,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { AnalyticsCard } from '@/components/dashboard/AnalyticsCard';
import { RealBarChart, type ChartDatum } from '@/components/dashboard/RealBarChart';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useProctorDashboard } from '@/hooks/roleDashboards/useRoleDashboards';
import { formatTimeSlotLabel, formatUtcDate, formatUtcTime } from '@/lib/dateTime';
import type { ScheduleAssignment } from '@/schemas/schedule';

const getAssignmentTime = (assignment?: ScheduleAssignment | null) => {
  const value = assignment?.timeSlot?.startTime ?? assignment?.timeSlot?.date;
  const time = value ? new Date(value).getTime() : Number.NaN;
  return Number.isFinite(time) ? time : null;
};

const getCourse = (assignment?: ScheduleAssignment | null) => assignment?.exam?.courseOffering?.course;

const getDutyLabel = (assignment?: ScheduleAssignment | null) => {
  const course = getCourse(assignment);
  return [course?.code, course?.title].filter(Boolean).join(' • ') || 'Exam duty';
};

const getStudentCount = (assignment: ScheduleAssignment) => {
  const registrations = assignment.exam?.courseOffering?.registrations;
  if (registrations?.length) return registrations.length;
  return assignment.exam?.courseOffering?.expectedStudents ?? 0;
};

const isSameLocalDay = (value: number | null, nowMs: number) => {
  if (value == null) return false;
  const current = new Date(nowMs);
  const date = new Date(value);
  return current.getFullYear() === date.getFullYear()
    && current.getMonth() === date.getMonth()
    && current.getDate() === date.getDate();
};

const getWeekRange = (nowMs: number) => {
  const now = new Date(nowMs);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + mondayOffset);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start: start.getTime(), end: end.getTime() };
};

const formatDayLabel = (assignment: ScheduleAssignment) => {
  const time = getAssignmentTime(assignment);
  if (!time) return null;
  return new Date(time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

const formatWeekLabel = (assignment: ScheduleAssignment) => {
  const time = getAssignmentTime(assignment);
  if (!time) return null;
  const date = new Date(time);
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  weekStart.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
  return `Week of ${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
};

const groupCount = <T,>(items: T[], key: (item: T) => string | null | undefined): ChartDatum[] => {
  const counts = new Map<string, number>();
  for (const item of items) {
    const label = key(item);
    if (!label) continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts, ([name, value]) => ({ name, value }));
};

const buildWorkloadByDay = (assignments: ScheduleAssignment[]) => {
  const counts = new Map<string, { label: string; value: number; time: number }>();
  for (const assignment of assignments) {
    const time = getAssignmentTime(assignment);
    if (!time) continue;
    const date = new Date(time);
    const key = date.toISOString().slice(0, 10);
    const label = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const current = counts.get(key) ?? { label, value: 0, time };
    current.value += 1;
    counts.set(key, current);
  }
  return Array.from(counts.values()).sort((a, b) => a.time - b.time);
};

const getBusiestDay = (workloadByDay: ReturnType<typeof buildWorkloadByDay>) => {
  if (workloadByDay.length === 0) return null;
  return workloadByDay.reduce((best, item) => (item.value > best.value ? item : best), workloadByDay[0]);
};

const getWorkloadBalance = (workloadByDay: ReturnType<typeof buildWorkloadByDay>, maxPerDay?: number | null) => {
  if (workloadByDay.length === 0) return { label: 'No published workload', tone: 'secondary' as const, detail: 'No assigned duties yet' };
  const busiest = getBusiestDay(workloadByDay);
  const maxDaily = maxPerDay ?? 2;
  const ratio = busiest ? busiest.value / Math.max(1, maxDaily) : 0;
  if (ratio <= 0.5) return { label: 'Light workload', tone: 'success' as const, detail: `${busiest?.value ?? 0}/${maxDaily} on busiest day` };
  if (ratio <= 1) return { label: 'Balanced workload', tone: 'default' as const, detail: `${busiest?.value ?? 0}/${maxDaily} on busiest day` };
  return { label: 'Heavy workload', tone: 'warning' as const, detail: `${busiest?.value ?? 0}/${maxDaily} on busiest day` };
};

type ProctorUpdate = {
  id: string;
  title: string;
  detail: string;
  date?: string | null;
  kind: 'published' | 'changed' | 'assigned';
};

const buildUpdates = (assignments: ScheduleAssignment[]) => {
  const updates: ProctorUpdate[] = [];
  const schedules = new Map<string, NonNullable<ScheduleAssignment['schedule']>>();

  for (const assignment of assignments) {
    if (assignment.schedule?.id && !schedules.has(assignment.schedule.id)) {
      schedules.set(assignment.schedule.id, assignment.schedule);
    }
  }

  for (const schedule of schedules.values()) {
    updates.push({
      id: `published-${schedule.id}`,
      title: 'Schedule published',
      detail: `${schedule.name} is published and includes your assigned exam duties.`,
      date: schedule.updatedAt ?? schedule.createdAt,
      kind: 'published',
    });

    if (schedule.updatedAt && schedule.createdAt && schedule.updatedAt !== schedule.createdAt) {
      updates.push({
        id: `changed-${schedule.id}`,
        title: 'Assigned exam changed',
        detail: `${schedule.name} was updated. Review the latest room and time details.`,
        date: schedule.updatedAt,
        kind: 'changed',
      });
    }
  }

  for (const assignment of assignments.slice(0, 3)) {
    updates.push({
      id: `assigned-${assignment.id}`,
      title: 'New duty assigned',
      detail: `${getDutyLabel(assignment)} • ${assignment.room?.name ?? 'Room TBD'} • ${formatTimeSlotLabel(assignment.timeSlot)}`,
      date: assignment.schedule?.updatedAt ?? assignment.schedule?.createdAt ?? assignment.timeSlot?.startTime,
      kind: 'assigned',
    });
  }

  return updates
    .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())
    .slice(0, 5);
};

const DashboardSkeleton = () => (
  <div className="space-y-6 p-5 sm:p-6 lg:p-8">
    <div className="space-y-2">
      <Skeleton className="h-3 w-44" />
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-4 w-56" />
    </div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-32" />)}
    </div>
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Skeleton className="h-80" />
      <Skeleton className="h-80" />
    </div>
  </div>
);

const EmptyPublishedDutyState = () => (
  <Card className="overflow-hidden rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
    <CardContent className="grid gap-6 p-0 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="p-8 sm:p-10">
        <div className="flex size-14 items-center justify-center rounded-none bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950">
          <ShieldCheck className="size-7" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">No published assignments</p>
        <h2 className="mt-2 max-w-xl text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          No published proctor duties are assigned to you yet.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Your overview will populate automatically once an admin publishes a schedule that assigns you to exams.
        </p>
      </div>
      <div className="relative min-h-64 overflow-hidden bg-zinc-950 p-8 text-white dark:bg-zinc-100 dark:text-zinc-950">
        <div className="absolute -right-16 -top-16 size-44 rounded-full border border-white/15 dark:border-zinc-900/10" />
        <div className="absolute -bottom-20 left-8 size-48 rounded-full bg-white/10 blur-2xl dark:bg-zinc-900/10" />
        <div className="relative space-y-4">
          {['Published schedules only', 'Your assigned exams only', 'Room, center, time, and student count'].map((item) => (
            <div key={item} className="flex items-center gap-3 border border-white/10 bg-white/5 p-3 backdrop-blur dark:border-zinc-900/10 dark:bg-zinc-900/5">
              <CheckCircle2 className="size-4" />
              <span className="text-sm font-medium">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

export const ProctorDashboardPage: React.FC = () => {
  const dashboardQuery = useProctorDashboard();
  const data = dashboardQuery.data;
  const [nowMs, setNowMs] = React.useState(() => Date.now());

  React.useEffect(() => {
    const intervalId = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  if (dashboardQuery.isLoading) return <DashboardSkeleton />;

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

  const assignments = data.assignments
    .filter((assignment) => assignment.schedule?.isFinal !== false)
    .sort((a, b) => (getAssignmentTime(a) ?? Number.MAX_SAFE_INTEGER) - (getAssignmentTime(b) ?? Number.MAX_SAFE_INTEGER));
  const upcomingAssignments = assignments.filter((assignment) => {
    const time = getAssignmentTime(assignment);
    return time != null && time >= nowMs;
  });
  const todayAssignments = assignments.filter((assignment) => isSameLocalDay(getAssignmentTime(assignment), nowMs));
  const { start, end } = getWeekRange(nowMs);
  const examsThisWeek = upcomingAssignments.filter((assignment) => {
    const time = getAssignmentTime(assignment);
    return time != null && time >= start && time < end;
  }).length;
  const workloadByDay = buildWorkloadByDay(assignments);
  const busiestDay = getBusiestDay(workloadByDay);
  const balance = getWorkloadBalance(workloadByDay, data.profile.maxExamsPerDay);
  const nextAssignment = upcomingAssignments[0] ?? data.nextAssignment ?? null;
  const assignmentsByDay = groupCount(assignments, formatDayLabel);
  const workloadTrend = groupCount(upcomingAssignments, formatWeekLabel);
  const updates = buildUpdates(assignments);
  const hasPublishedAssignments = assignments.length > 0;

  return (
    <div className="space-y-6 p-5 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Proctor Overview</p>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Welcome, {data.profile.user?.name ?? 'Proctor'}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {data.profile.center?.name ?? 'Center not assigned'}{data.profile.department ? ` • ${data.profile.department}` : ''}
          </p>
        </div>
        <Badge variant="secondary">Published schedules only</Badge>
      </div>

      {!hasPublishedAssignments ? (
        <EmptyPublishedDutyState />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AnalyticsCard title="My Assigned Exams" value={assignments.length} icon={ClipboardList} accent="indigo" subtitle="Published duties" />
            <AnalyticsCard title="Today's Assignments" value={todayAssignments.length} icon={Clock4} accent="amber" subtitle="Due today" />
            <AnalyticsCard title="Exams This Week" value={examsThisWeek} icon={CalendarClock} accent="emerald" subtitle="Upcoming this week" />
            <AnalyticsCard title="Workload Summary" value={balance.label} icon={Gauge} accent="sky" subtitle={balance.detail} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
              <CardHeader className="border-b border-zinc-100 pb-3 dark:border-zinc-800/70">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                  <Clock4 className="size-4 text-zinc-400" />
                  Today's Assignments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-5">
                {todayAssignments.length === 0 ? (
                  <p className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">No assigned exams happening today.</p>
                ) : (
                  todayAssignments.map((assignment) => (
                    <div key={assignment.id} className="grid gap-3 rounded-none border border-zinc-200/70 bg-zinc-50/70 p-4 dark:border-zinc-800/70 dark:bg-zinc-900/40 md:grid-cols-[1.2fr_0.9fr_0.8fr]">
                      <div className="min-w-0">
                        <p className="font-semibold text-zinc-950 dark:text-zinc-50">{getDutyLabel(assignment)}</p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {formatUtcTime(assignment.timeSlot?.startTime)} - {formatUtcTime(assignment.timeSlot?.endTime)}
                        </p>
                      </div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-300">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{assignment.room?.name ?? 'Room TBD'}</p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{assignment.room?.center?.name ?? 'Center TBD'}</p>
                      </div>
                      <div className="flex items-center justify-start md:justify-end">
                        <Badge variant="secondary">{getStudentCount(assignment)} students</Badge>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
              <CardHeader className="border-b border-zinc-100 pb-3 dark:border-zinc-800/70">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                  <Gauge className="size-4 text-zinc-400" />
                  Workload Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-none border border-zinc-200/70 p-4 dark:border-zinc-800/70">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">Total assigned exams</p>
                    <p className="mt-2 text-2xl font-bold text-zinc-950 dark:text-zinc-50">{assignments.length}</p>
                  </div>
                  <div className="rounded-none border border-zinc-200/70 p-4 dark:border-zinc-800/70">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">Exams per day</p>
                    <p className="mt-2 text-2xl font-bold text-zinc-950 dark:text-zinc-50">
                      {workloadByDay.length > 0 ? (assignments.length / workloadByDay.length).toFixed(1) : '0'}
                    </p>
                  </div>
                </div>

                <div className="rounded-none border border-zinc-200/70 bg-zinc-50/70 p-4 dark:border-zinc-800/70 dark:bg-zinc-900/40">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Workload balance indicator</p>
                    <Badge variant={balance.tone}>{balance.label}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{balance.detail}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-none border border-zinc-200/70 p-4 dark:border-zinc-800/70">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">Busiest day</p>
                    <p className="mt-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">{busiestDay?.label ?? 'No duties yet'}</p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{busiestDay ? `${busiestDay.value} exams` : 'No published duties'}</p>
                  </div>
                  <div className="rounded-none border border-zinc-200/70 p-4 dark:border-zinc-800/70">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">Upcoming duty</p>
                    <p className="mt-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">{nextAssignment ? getDutyLabel(nextAssignment) : 'No upcoming duty'}</p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{nextAssignment ? formatTimeSlotLabel(nextAssignment.timeSlot) : 'All assigned duties are complete'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <RealBarChart title="Assignments by Day" icon={CalendarClock} data={assignmentsByDay} tone="indigo" emptyLabel="No assignment days yet" />
            <RealBarChart title="Assignments by Center" icon={Building2} data={data.charts.dutiesByCenter} tone="emerald" emptyLabel="No centers assigned yet" />
            <RealBarChart title="Workload Trend" icon={Sparkles} data={workloadTrend} tone="sky" emptyLabel="No upcoming workload trend yet" />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
            <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
              <CardHeader className="border-b border-zinc-100 pb-3 dark:border-zinc-800/70">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                  <UserCheck className="size-4 text-zinc-400" />
                  Upcoming Published Duties
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-5">
                {upcomingAssignments.length === 0 ? (
                  <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">No upcoming duties remain in your published schedules.</p>
                ) : (
                  upcomingAssignments.slice(0, 6).map((assignment) => (
                    <div key={assignment.id} className="grid gap-3 rounded-none border border-zinc-200/70 bg-zinc-50/70 p-4 dark:border-zinc-800/70 dark:bg-zinc-900/40 md:grid-cols-[1.3fr_1fr_0.7fr]">
                      <div>
                        <p className="font-semibold text-zinc-950 dark:text-zinc-50">{getDutyLabel(assignment)}</p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{formatTimeSlotLabel(assignment.timeSlot)}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                        <MapPin className="size-4 text-zinc-400" />
                        <span>{assignment.room?.center?.name ?? 'Center TBD'} • {assignment.room?.name ?? 'Room TBD'}</span>
                      </div>
                      <div className="flex items-center justify-start md:justify-end">
                        <Badge>{getStudentCount(assignment)} students</Badge>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
              <CardHeader className="border-b border-zinc-100 pb-3 dark:border-zinc-800/70">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                  <Bell className="size-4 text-zinc-400" />
                  Notifications / Updates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-5">
                {updates.length === 0 ? (
                  <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">No proctor updates available yet.</p>
                ) : (
                  updates.map((update) => (
                    <div key={update.id} className="flex gap-3 rounded-none border border-zinc-200/70 bg-zinc-50/70 p-3 dark:border-zinc-800/70 dark:bg-zinc-900/45">
                      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-none bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950">
                        {update.kind === 'changed' ? <Sparkles className="size-4" /> : update.kind === 'assigned' ? <UserCheck className="size-4" /> : <Megaphone className="size-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{update.title}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{update.detail}</p>
                        <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">{update.date ? formatUtcDate(update.date) : 'No date available'}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
