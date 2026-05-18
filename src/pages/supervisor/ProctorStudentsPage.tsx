import React from 'react';
import { CalendarClock, Filter, Search, UserRoundCheck, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { FullPublishedScheduleSection } from '@/components/roleSchedule/PublishedScheduleViews';
import { useProctorDashboard } from '@/hooks/roleDashboards/useRoleDashboards';
import { formatUtcDate, formatUtcTime } from '@/lib/dateTime';
import type { ScheduleAssignment, ScheduleRegistration } from '@/schemas/schedule';

type FilterValue = 'all' | string;

type AssignedStudentRow = {
  id: string;
  assignmentId: string;
  examId: string;
  course: string;
  courseCode: string;
  date: string;
  dateKey: string;
  time: string;
  room: string;
  center: string;
  studentName: string;
  studentEmail: string;
  studentIdentifier: string;
  registrationStatus: string;
};

type ExamGroup = {
  key: string;
  assignment: ScheduleAssignment;
  course: string;
  courseCode: string;
  date: string;
  dateKey: string;
  time: string;
  room: string;
  center: string;
  rows: AssignedStudentRow[];
};

const courseTitle = (assignment: ScheduleAssignment) => assignment.exam?.courseOffering?.course?.title ?? 'Exam';
const courseCode = (assignment: ScheduleAssignment) => assignment.exam?.courseOffering?.course?.code ?? 'Course TBD';
const roomName = (assignment: ScheduleAssignment) => assignment.room?.name ?? 'Room TBD';
const centerName = (assignment: ScheduleAssignment) => assignment.room?.center?.name ?? 'Center TBD';

const assignmentTime = (assignment: ScheduleAssignment) => {
  const value = assignment.timeSlot?.startTime ?? assignment.timeSlot?.date;
  const time = value ? new Date(value).getTime() : Number.POSITIVE_INFINITY;
  return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
};

const dateKey = (assignment: ScheduleAssignment) => {
  const value = assignment.timeSlot?.date ?? assignment.timeSlot?.startTime;
  if (!value) return 'unscheduled';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'unscheduled' : date.toISOString().slice(0, 10);
};

const studentName = (registration: ScheduleRegistration) => registration.student?.user?.name ?? 'Student';
const studentEmail = (registration: ScheduleRegistration) => registration.student?.user?.email ?? 'No email available';
const studentIdentifier = (registration: ScheduleRegistration) => registration.student?.universityId ?? registration.studentId ?? 'No student ID';

const buildGroups = (assignments: ScheduleAssignment[]): ExamGroup[] => {
  return [...assignments]
    .filter((assignment) => assignment.schedule?.isFinal !== false)
    .sort((a, b) => assignmentTime(a) - assignmentTime(b))
    .map((assignment) => {
      const registrations = assignment.exam?.courseOffering?.registrations ?? [];
      const groupDateKey = dateKey(assignment);
      const group: ExamGroup = {
        key: `${assignment.examId}-${assignment.id}`,
        assignment,
        course: courseTitle(assignment),
        courseCode: courseCode(assignment),
        date: formatUtcDate(assignment.timeSlot?.date ?? assignment.timeSlot?.startTime),
        dateKey: groupDateKey,
        time: `${formatUtcTime(assignment.timeSlot?.startTime)} - ${formatUtcTime(assignment.timeSlot?.endTime)}`,
        room: roomName(assignment),
        center: centerName(assignment),
        rows: [],
      };

      group.rows = registrations
        .map((registration) => ({
          id: `${assignment.id}-${registration.id ?? registration.studentId}`,
          assignmentId: assignment.id,
          examId: assignment.examId,
          course: group.course,
          courseCode: group.courseCode,
          date: group.date,
          dateKey: groupDateKey,
          time: group.time,
          room: group.room,
          center: group.center,
          studentName: studentName(registration),
          studentEmail: studentEmail(registration),
          studentIdentifier: studentIdentifier(registration),
          registrationStatus: registration.status ?? 'Registered',
        }))
        .sort((a, b) => a.studentName.localeCompare(b.studentName));

      return group;
    });
};

const getUniqueOptions = (groups: ExamGroup[], getValue: (group: ExamGroup) => string) => {
  return Array.from(new Set(groups.map(getValue).filter(Boolean))).sort((a, b) => a.localeCompare(b));
};

const groupMatchesFilters = (group: ExamGroup, course: FilterValue, date: FilterValue, room: FilterValue) => {
  return (course === 'all' || group.courseCode === course)
    && (date === 'all' || group.dateKey === date)
    && (room === 'all' || group.room === room);
};

const rowMatchesSearch = (row: AssignedStudentRow, query: string) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return [
    row.studentName,
    row.studentEmail,
    row.studentIdentifier,
    row.course,
    row.courseCode,
    row.date,
    row.time,
    row.room,
    row.center,
  ].join(' ').toLowerCase().includes(normalized);
};

const LoadingState = () => (
  <div className="space-y-5 p-5 sm:p-6 lg:p-8">
    <div className="space-y-2">
      <Skeleton className="h-3 w-44" />
      <Skeleton className="h-8 w-80" />
      <Skeleton className="h-4 w-96 max-w-full" />
    </div>
    <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
      <CardContent className="space-y-3 p-5">
        {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-16 w-full" />)}
      </CardContent>
    </Card>
  </div>
);

const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="flex min-h-56 flex-col items-center justify-center rounded-none border border-dashed border-zinc-200 bg-zinc-50/70 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
    <UserRoundCheck className="size-9 text-zinc-300 dark:text-zinc-600" />
    <p className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">{title}</p>
    <p className="mt-1 max-w-xl text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
  </div>
);

export const ProctorStudentsPage: React.FC = () => {
  const dashboardQuery = useProctorDashboard();
  const [query, setQuery] = React.useState('');
  const [courseFilter, setCourseFilter] = React.useState<FilterValue>('all');
  const [dateFilter, setDateFilter] = React.useState<FilterValue>('all');
  const [roomFilter, setRoomFilter] = React.useState<FilterValue>('all');

  const groups = React.useMemo(() => buildGroups(dashboardQuery.data?.assignments ?? []), [dashboardQuery.data?.assignments]);
  const courseOptions = React.useMemo(() => getUniqueOptions(groups, (group) => group.courseCode), [groups]);
  const dateOptions = React.useMemo(() => getUniqueOptions(groups, (group) => group.dateKey), [groups]);
  const roomOptions = React.useMemo(() => getUniqueOptions(groups, (group) => group.room), [groups]);

  const visibleGroups = React.useMemo(() => {
    return groups
      .filter((group) => groupMatchesFilters(group, courseFilter, dateFilter, roomFilter))
      .map((group) => ({ ...group, rows: group.rows.filter((row) => rowMatchesSearch(row, query)) }))
      .filter((group) => group.rows.length > 0 || !query.trim());
  }, [courseFilter, dateFilter, groups, query, roomFilter]);

  const totalStudents = groups.reduce((total, group) => total + group.rows.length, 0);
  const visibleStudents = visibleGroups.reduce((total, group) => total + group.rows.length, 0);

  if (dashboardQuery.isLoading) return <LoadingState />;

  return (
    <div className="space-y-5 p-5 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Assigned Students</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Students for your assigned exams</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
            Scoped to published exams assigned to you. Student lists come only from registrations attached to those exams.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{groups.length} exams</Badge>
          <Badge>{totalStudents} students</Badge>
        </div>
      </div>

      <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/70">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              <Users className="size-4 text-zinc-400" />
              Assigned Student Roster
            </CardTitle>
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <div className="relative min-w-64 flex-1 lg:w-80">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search students, ID, email, course"
                  className="pl-8"
                />
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Select value={courseFilter} onValueChange={setCourseFilter}>
                  <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Course" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All courses</SelectItem>
                    {courseOptions.map((course) => <SelectItem key={course} value={course}>{course}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Date" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All dates</SelectItem>
                    {dateOptions.map((date) => <SelectItem key={date} value={date}>{date === 'unscheduled' ? 'Unscheduled' : formatUtcDate(`${date}T00:00:00.000Z`)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={roomFilter} onValueChange={setRoomFilter}>
                  <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Room" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All rooms</SelectItem>
                    {roomOptions.map((room) => <SelectItem key={room} value={room}>{room}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          {dashboardQuery.isError ? (
            <p className="py-8 text-center text-sm text-rose-600 dark:text-rose-300">Unable to load assigned students.</p>
          ) : groups.length === 0 ? (
            <EmptyState title="No assigned student roster yet" description="Published schedules assigned to you will appear here with registered students grouped by exam." />
          ) : visibleGroups.length === 0 ? (
            <EmptyState title="No students match the current filters" description="Adjust the search term, course, date, or room filter to widen the roster." />
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <Filter className="size-3.5" />
                Showing {visibleStudents} of {totalStudents} assigned student rows
              </div>
              {visibleGroups.map((group) => (
                <section key={group.key} className="overflow-hidden rounded-none border border-zinc-200/70 dark:border-zinc-800/80">
                  <div className="flex flex-col gap-3 border-b border-zinc-100 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800/70 dark:bg-zinc-900/50 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">{group.course}</h2>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <span>{group.courseCode}</span>
                        <span>{group.date}</span>
                        <span>{group.time}</span>
                        <span>{group.room}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{group.center}</Badge>
                      <Badge>{group.rows.length} students</Badge>
                    </div>
                  </div>
                  {group.rows.length === 0 ? (
                    <p className="bg-white px-4 py-8 text-center text-sm text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">No students in this exam match the search term.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-zinc-100 text-left text-sm dark:divide-zinc-800/70">
                        <thead className="bg-white text-[11px] uppercase tracking-[0.16em] text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Student Name</th>
                            <th className="px-4 py-3 font-semibold">Email / ID</th>
                            <th className="px-4 py-3 font-semibold">Course</th>
                            <th className="px-4 py-3 font-semibold">Exam Time</th>
                            <th className="px-4 py-3 font-semibold">Room</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800/70 dark:bg-zinc-950">
                          {group.rows.map((row) => (
                            <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/60">
                              <td className="px-4 py-3 font-semibold text-zinc-950 dark:text-zinc-50">{row.studentName}</td>
                              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                                <div>{row.studentEmail}</div>
                                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{row.studentIdentifier}</div>
                              </td>
                              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{row.courseCode}</td>
                              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                                <div className="flex items-center gap-1.5">
                                  <CalendarClock className="size-3.5 text-zinc-400" />
                                  <span>{row.date}</span>
                                </div>
                                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{row.time}</div>
                              </td>
                              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{row.room}</td>
                              <td className="px-4 py-3"><Badge variant="secondary">Present / Absent later</Badge></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      <FullPublishedScheduleSection />
    </div>
  );
};
