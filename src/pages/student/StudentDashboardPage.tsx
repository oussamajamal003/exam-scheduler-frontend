import React from 'react';
import {
  Bell,
  Building2,
  BookOpen,
  CalendarClock,
  Clock4,
  GraduationCap,
  Info,
  MapPin,
  Megaphone,
  School,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { AnalyticsCard } from '@/components/dashboard/AnalyticsCard';
import { RealBarChart, type ChartDatum } from '@/components/dashboard/RealBarChart';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudentDashboard } from '@/hooks/roleDashboards/useRoleDashboards';
import { formatUtcDate, formatUtcTime } from '@/lib/dateTime';
import type { ScheduleAssignment } from '@/schemas/schedule';

const getCourse = (assignment?: ScheduleAssignment | null) => assignment?.exam?.courseOffering?.course;

const getExamTime = (assignment?: ScheduleAssignment | null) => {
  const value = assignment?.timeSlot?.startTime ?? assignment?.timeSlot?.date;
  const time = value ? new Date(value).getTime() : Number.NaN;
  return Number.isFinite(time) ? time : null;
};

const getCourseTitle = (assignment?: ScheduleAssignment | null) => {
  const course = getCourse(assignment);
  return course?.title ?? 'Exam';
};

const getCourseCode = (assignment?: ScheduleAssignment | null) => getCourse(assignment)?.code ?? 'Course';

const groupCount = <T,>(items: T[], key: (item: T) => string | null | undefined): ChartDatum[] => {
  const counts = new Map<string, number>();
  for (const item of items) {
    const label = key(item);
    if (!label) continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts, ([name, value]) => ({ name, value }));
};

const uniqueAssignmentsByExam = (assignments: ScheduleAssignment[]) => {
  const seen = new Set<string>();
  return assignments.filter((assignment) => {
    if (seen.has(assignment.examId)) return false;
    seen.add(assignment.examId);
    return true;
  });
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

const getCountdownLabel = (assignment: ScheduleAssignment | null | undefined, nowMs: number) => {
  const time = getExamTime(assignment);
  if (!time) return 'Date not published';
  const diff = time - nowMs;
  if (diff <= 0) return 'Now or already started';
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${Math.max(1, minutes)}m remaining`;
};

const formatDayLabel = (assignment: ScheduleAssignment) => {
  const time = getExamTime(assignment);
  if (!time) return null;
  return new Date(time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

const formatWeekLabel = (assignment: ScheduleAssignment) => {
  const time = getExamTime(assignment);
  if (!time) return null;
  const date = new Date(time);
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  weekStart.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
  return `Week of ${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
};

type DashboardUpdate = {
  id: string;
  title: string;
  detail: string;
  date?: string | null;
  kind: 'published' | 'changed' | 'message';
};

const buildUpdates = (assignments: ScheduleAssignment[]) => {
  const updates: DashboardUpdate[] = [];
  const schedules = new Map<string, NonNullable<ScheduleAssignment['schedule']>>();

  for (const assignment of assignments) {
    if (assignment.schedule?.id && !schedules.has(assignment.schedule.id)) {
      schedules.set(assignment.schedule.id, assignment.schedule);
    }
  }

  for (const schedule of schedules.values()) {
    updates.push({
      id: `schedule-${schedule.id}`,
      title: 'Schedule published',
      detail: `${schedule.name} is now available for student viewing.`,
      date: schedule.updatedAt ?? schedule.createdAt,
      kind: 'published',
    });

    if (schedule.updatedAt && schedule.createdAt && schedule.updatedAt !== schedule.createdAt) {
      updates.push({
        id: `schedule-change-${schedule.id}`,
        title: 'Schedule changed',
        detail: `${schedule.name} has been updated. Review your latest room and time details.`,
        date: schedule.updatedAt,
        kind: 'changed',
      });
    }
  }

  if (assignments.length > 0) {
    updates.push({
      id: 'messages-empty',
      title: 'Announcements / Messages',
      detail: 'No direct announcements or messages are available from the system yet.',
      date: assignments[0]?.schedule?.updatedAt ?? assignments[0]?.schedule?.createdAt,
      kind: 'message',
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
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <Skeleton className="h-72" />
      <Skeleton className="h-72" />
    </div>
  </div>
);

const EmptyPublishedScheduleState = () => (
  <Card className="overflow-hidden rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
    <CardContent className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-none border border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-400">
        <CalendarClock className="size-6" />
      </div>
      <h2 className="mt-5 text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
        No published exam schedule available yet.
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500 dark:text-zinc-400">
        Your registered courses are loaded, but exam details will appear here only after the administration publishes a final schedule.
      </p>
    </CardContent>
  </Card>
);

const NoUpcomingExamState = () => (
  <div className="flex h-full flex-col justify-center rounded-none border border-zinc-200/70 bg-zinc-50/70 p-5 dark:border-zinc-800/70 dark:bg-zinc-900/40">
    <Badge variant="secondary">No upcoming exam</Badge>
    <h2 className="mt-3 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
      All published exams are completed
    </h2>
    <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
      Published schedule history is still available below, but there is no future exam assignment scheduled for you right now.
    </p>
  </div>
);

export const StudentDashboardPage: React.FC = () => {
  const dashboardQuery = useStudentDashboard();
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
            Unable to load your student dashboard.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const publishedAssignments = uniqueAssignmentsByExam(data.assignments);
  const upcomingAssignments = publishedAssignments.filter((assignment) => {
    const time = getExamTime(assignment);
    return time != null && time >= nowMs;
  });
  const nextAssignment = upcomingAssignments[0] ?? null;
  const { start, end } = getWeekRange(nowMs);
  const examsThisWeek = upcomingAssignments.filter((assignment) => {
    const time = getExamTime(assignment);
    return time != null && time >= start && time < end;
  }).length;
  const examsByDay = groupCount(publishedAssignments, formatDayLabel);
  const examsByWeek = groupCount(upcomingAssignments, formatWeekLabel);
  const courseLoad = groupCount(data.courses, (courseOffering) => courseOffering.semester?.name ?? 'Unassigned');
  const updates = buildUpdates(publishedAssignments);
  const hasPublishedSchedule = publishedAssignments.length > 0;

  return (
    <div className="space-y-6 p-5 sm:p-6 lg:p-8">
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Student Overview
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          Welcome, {data.profile.user?.name ?? 'Student'}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {data.profile.program?.name ?? 'Program not assigned'}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsCard title="My Registered Courses" value={data.summary.registeredCourses} icon={BookOpen} accent="indigo" subtitle="From active registrations" />
        <AnalyticsCard title="My Exams" value={publishedAssignments.length} icon={GraduationCap} accent="sky" subtitle="Published exam assignments" />
        <AnalyticsCard title="Exams This Week" value={examsThisWeek} icon={CalendarClock} accent="amber" subtitle="Current calendar week" />
        <AnalyticsCard title="Next Upcoming Exam" value={nextAssignment ? getCountdownLabel(nextAssignment, nowMs) : 'No upcoming exam'} icon={Clock4} accent={nextAssignment ? 'emerald' : 'zinc'} subtitle={nextAssignment ? getCourseCode(nextAssignment) : 'No future published exam'} />
      </div>

      {!hasPublishedSchedule ? (
        <EmptyPublishedScheduleState />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
              <CardHeader className="border-b border-zinc-100 pb-3 dark:border-zinc-800/70">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                  <CalendarClock className="size-4 text-zinc-400" />
                  Next Exam
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 p-5 md:grid-cols-[1fr_220px]">
                {nextAssignment ? (
                  <>
                    <div className="space-y-4">
                      <div>
                        <Badge variant="success">{getCountdownLabel(nextAssignment, nowMs)}</Badge>
                        <h2 className="mt-3 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                          {getCourseTitle(nextAssignment)}
                        </h2>
                        <p className="mt-1 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                          {getCourseCode(nextAssignment)}
                        </p>
                      </div>
                      <div className="space-y-3 rounded-none border border-zinc-200/70 bg-zinc-50/70 p-4 dark:border-zinc-800/70 dark:bg-zinc-900/45">
                        <div className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                          <BookOpen className="size-4 text-zinc-400" />
                          <span className="font-semibold text-zinc-950 dark:text-zinc-50">{getCourseTitle(nextAssignment)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                          <CalendarClock className="size-4 text-zinc-400" />
                          <span>{formatUtcDate(nextAssignment.timeSlot?.date ?? nextAssignment.timeSlot?.startTime)} - {formatUtcTime(nextAssignment.timeSlot?.startTime)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                          <Building2 className="size-4 text-zinc-400" />
                          <span>{nextAssignment.room?.center?.name ?? 'Center TBD'} - {nextAssignment.room?.name ?? 'Room TBD'}</span>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-none border border-zinc-200/70 bg-zinc-50/70 p-3 dark:border-zinc-800/70 dark:bg-zinc-900/45">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Room</p>
                          <p className="mt-1 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                            {nextAssignment.room?.name ?? 'Room TBD'}
                          </p>
                        </div>
                        <div className="rounded-none border border-zinc-200/70 bg-zinc-50/70 p-3 dark:border-zinc-800/70 dark:bg-zinc-900/45">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Center</p>
                          <p className="mt-1 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                            {nextAssignment.room?.center?.name ?? 'Center TBD'}
                          </p>
                        </div>
                        <div className="rounded-none border border-zinc-200/70 bg-zinc-50/70 p-3 dark:border-zinc-800/70 dark:bg-zinc-900/45">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Proctor</p>
                          <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                            <UserCheck className="size-3.5 text-zinc-400" />
                            {nextAssignment.proctor?.user?.name ?? 'Proctor TBD'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col justify-center rounded-none border border-zinc-200/70 bg-zinc-950 p-5 text-white dark:border-zinc-800 dark:bg-zinc-100 dark:text-zinc-950">
                      <Clock4 className="size-6 opacity-70" />
                      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">Countdown</p>
                      <p className="mt-2 text-3xl font-bold tracking-tight">{getCountdownLabel(nextAssignment, nowMs)}</p>
                      <p className="mt-3 text-xs opacity-75">{nextAssignment.schedule?.name ?? 'Published schedule'}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <NoUpcomingExamState />
                    <div className="flex flex-col justify-center rounded-none border border-zinc-200/70 bg-zinc-950 p-5 text-white dark:border-zinc-800 dark:bg-zinc-100 dark:text-zinc-950">
                      <Clock4 className="size-6 opacity-70" />
                      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">Countdown</p>
                      <p className="mt-2 text-3xl font-bold tracking-tight">No upcoming exam</p>
                    </div>
                  </>
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
                  <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">No schedule updates available yet.</p>
                ) : (
                  updates.map((update) => (
                    <div key={update.id} className="flex gap-3 rounded-none border border-zinc-200/70 bg-zinc-50/70 p-3 dark:border-zinc-800/70 dark:bg-zinc-900/45">
                      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-none bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950">
                        {update.kind === 'changed' ? <Sparkles className="size-4" /> : update.kind === 'message' ? <Info className="size-4" /> : <Megaphone className="size-4" />}
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

          <div className="grid gap-4 xl:grid-cols-4">
            <RealBarChart title="Exams by Day" icon={CalendarClock} data={examsByDay} tone="indigo" emptyLabel="No published exam days yet" />
            <RealBarChart title="Exams by Week" icon={Clock4} data={examsByWeek} tone="emerald" emptyLabel="No upcoming exam weeks yet" />
            <RealBarChart title="Exam Distribution" icon={MapPin} data={data.charts.examsByCenter} tone="sky" emptyLabel="No centers published yet" />
            <RealBarChart title="Course Load Summary" icon={School} data={courseLoad} tone="violet" emptyLabel="No course load available" />
          </div>

          <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Upcoming Exams Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(upcomingAssignments.length > 0 ? upcomingAssignments : publishedAssignments).slice(0, 6).map((assignment) => (
                <div key={assignment.id} className="grid gap-3 rounded-none border border-zinc-200/70 bg-zinc-50/70 p-4 dark:border-zinc-800/70 dark:bg-zinc-900/40 md:grid-cols-[1.3fr_1fr_1fr]">
                  <div>
                    <p className="font-semibold text-zinc-950 dark:text-zinc-50">{getCourseTitle(assignment)}</p>
                    <p className="mt-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">{getCourseCode(assignment)}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                    <CalendarClock className="size-4 text-zinc-400" />
                    {formatUtcDate(assignment.timeSlot?.date ?? assignment.timeSlot?.startTime)} - {formatUtcTime(assignment.timeSlot?.startTime)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                    <MapPin className="size-4 text-zinc-400" />
                    {assignment.room?.center?.name ?? 'Center TBD'} - {assignment.room?.name ?? 'Room TBD'}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
