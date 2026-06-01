import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarClock, ChevronDown, UserRoundCheck, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { ActiveFilterBadges } from '@/components/shared/ActiveFilterBadges';
import { ScheduleFilterToolbar } from '@/components/shared/ScheduleFilterToolbar';
import { useProctorDashboard } from '@/hooks/roleDashboards/useRoleDashboards';
import { useHighlightRow } from '@/hooks/common/useHighlightRow';
import { formatTimeSlotLabel, formatUtcDate, formatUtcTime } from '@/lib/dateTime';
import { buildSearchIndex, matchesSmartSearch } from '@/lib/smartSearch';
import { normalizeCommandSearchText } from '@/lib/searchText';
import type { ScheduleAssignment, ScheduleRegistration } from '@/schemas/schedule';

const STUDENT_STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const STUDENT_SORT_OPTIONS = [
  { value: 'date-asc', label: 'Date (earliest first)' },
  { value: 'date-desc', label: 'Date (latest first)' },
  { value: 'course-asc', label: 'Course (A → Z)' },
  { value: 'course-desc', label: 'Course (Z → A)' },
];

type StudentSort = 'date-asc' | 'date-desc' | 'course-asc' | 'course-desc';

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
  studentDbId: string;
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
const assignmentStatus = (assignment: ScheduleAssignment) => assignment.exam?.status ?? (assignment.schedule?.isFinal ? 'SCHEDULED' : 'DRAFT');
const statusLabel = (status: string) => status.replaceAll('_', ' ');

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
          studentDbId: registration.studentId ?? registration.id ?? '',
        }))
        .sort((a, b) => a.studentName.localeCompare(b.studentName));

      return group;
    });
};

const rowMatchesSearch = (row: AssignedStudentRow, query: string) => {
  const searchIndex = buildSearchIndex(
    row.studentName,
    row.studentEmail,
    row.studentIdentifier,
    row.course,
    row.courseCode,
    row.date,
    row.time,
    row.room,
    row.center,
    row.registrationStatus,
  );
  return matchesSmartSearch(searchIndex, query);
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
  const [searchParams] = useSearchParams();
  const dashboardQuery = useProctorDashboard();

  // ── Filter state ────────────────────────────────────────────────────────────
  const [query, setQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  const [course, setCourse] = React.useState('all');
  const [room, setRoom] = React.useState('all');
  const [center, setCenter] = React.useState('all');
  const [timeSlot, setTimeSlot] = React.useState('all');
  const [examDate, setExamDate] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [status, setStatus] = React.useState('all');
  const [sort, setSort] = React.useState<StudentSort>('date-asc');
  const commandSearchText = normalizeCommandSearchText(searchParams.get('_hl'));

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const assignments = React.useMemo(() => dashboardQuery.data?.assignments ?? [], [dashboardQuery.data?.assignments]);
  const groups = React.useMemo(() => buildGroups(assignments), [assignments]);

  const highlightedStudentId = searchParams.get('studentId');
  const totalRows = React.useMemo(() => groups.reduce((sum, g) => sum + g.rows.length, 0), [groups]);
  useHighlightRow('data-student-id', highlightedStudentId, totalRows);

  React.useEffect(() => {
    if (highlightedStudentId && commandSearchText) {
      setQuery(commandSearchText);
      return;
    }

    if (!highlightedStudentId) {
      setQuery('');
    }
  }, [commandSearchText, highlightedStudentId]);

  // ── Derived selector options from real data ─────────────────────────────────
  const courseOptions = React.useMemo(() => {
    const seen = new Map<string, string>();
    for (const group of groups) seen.set(group.courseCode, group.course);
    return [
      { value: 'all', label: 'All courses' },
      ...[...seen.entries()]
        .map(([code, title]) => ({ value: code, label: `${code} \u2013 ${title}` }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    ];
  }, [groups]);

  const roomOptions = React.useMemo(() => {
    const seen = new Set<string>();
    for (const group of groups) if (group.room) seen.add(group.room);
    return [
      { value: 'all', label: 'All rooms' },
      ...[...seen].sort().map((r) => ({ value: r, label: r })),
    ];
  }, [groups]);

  const centerOptions = React.useMemo(() => {
    const seen = new Set<string>();
    for (const group of groups) if (group.center) seen.add(group.center);
    return [
      { value: 'all', label: 'All centers' },
      ...[...seen].sort().map((c) => ({ value: c, label: c })),
    ];
  }, [groups]);

  const timeSlotOptions = React.useMemo(() => {
    const seen = new Map<string, string>();
    for (const group of groups) {
      const tsId = group.assignment.timeSlotId;
      if (tsId) seen.set(tsId, formatTimeSlotLabel(group.assignment.timeSlot));
    }
    return [
      { value: 'all', label: 'All time slots' },
      ...[...seen.entries()]
        .map(([id, label]) => ({ value: id, label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    ];
  }, [groups]);

  // ── Reset ───────────────────────────────────────────────────────────────────
  const resetFilters = React.useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setCourse('all');
    setRoom('all');
    setCenter('all');
    setTimeSlot('all');
    setExamDate('');
    setStartDate('');
    setEndDate('');
    setStatus('all');
    setSort('date-asc');
  }, []);

  // ── Filtered & sorted groups ────────────────────────────────────────────────
  const visibleGroups = React.useMemo(() => {
    const search = debouncedQuery.trim();

    return groups
      .filter((group) => {
        if (course !== 'all' && group.courseCode !== course) return false;
        if (room !== 'all' && group.room !== room) return false;
        if (center !== 'all' && group.center !== center) return false;
        if (timeSlot !== 'all' && group.assignment.timeSlotId !== timeSlot) return false;
        if (examDate && group.dateKey !== examDate) return false;
        if (startDate && group.dateKey < startDate) return false;
        if (endDate && group.dateKey > endDate) return false;
        if (status !== 'all' && assignmentStatus(group.assignment) !== status) return false;
        if (search) {
          // Check assignment-level metadata first (course, room, center, date, time).
          // If that doesn't match, require at least one individual student row to match.
          // Never merge all student names into a single flat index — that causes
          // cross-entity false positives (e.g. "Fadi Khan" + "Adam Ahmed" → "Fadi Ahmed").
          const assignmentIdx = buildSearchIndex(
            group.course, group.courseCode, group.date, group.time, group.room, group.center,
          );
          const assignmentMatches = matchesSmartSearch(assignmentIdx, search);
          if (!assignmentMatches && !group.rows.some((r) => rowMatchesSearch(r, search))) return false;
        }
        return true;
      })
      .sort((a, b) => {
        switch (sort) {
          case 'date-asc':   return assignmentTime(a.assignment) - assignmentTime(b.assignment);
          case 'date-desc':  return assignmentTime(b.assignment) - assignmentTime(a.assignment);
          case 'course-asc': return a.course.localeCompare(b.course);
          case 'course-desc':return b.course.localeCompare(a.course);
        }
      })
      .map((group) => {
        if (!search) return group;
        const assignmentIdx = buildSearchIndex(group.course, group.courseCode, group.date, group.time, group.room, group.center);
        const assignmentMatchesSearch = matchesSmartSearch(assignmentIdx, search);
        return {
          ...group,
          rows: group.rows.filter((row) => assignmentMatchesSearch || rowMatchesSearch(row, search)),
        };
      })
      .filter((group) => group.rows.length > 0 || !search);
  }, [center, course, debouncedQuery, endDate, examDate, groups, room, sort, startDate, status, timeSlot]);

  // ── Active badges ───────────────────────────────────────────────────────────
  const badges = React.useMemo(() => [
    ...(course !== 'all'    ? [{ key: 'course',     label: 'Course',      value: courseOptions.find((o) => o.value === course)?.label ?? course,                          onRemove: () => setCourse('all') }] : []),
    ...(room !== 'all'      ? [{ key: 'room',       label: 'Room',        value: room,                                                                                      onRemove: () => setRoom('all') }] : []),
    ...(center !== 'all'    ? [{ key: 'center',     label: 'Center',      value: center,                                                                                    onRemove: () => setCenter('all') }] : []),
    ...(timeSlot !== 'all'  ? [{ key: 'timeslot',   label: 'Time Slot',   value: timeSlotOptions.find((o) => o.value === timeSlot)?.label ?? timeSlot,                    onRemove: () => setTimeSlot('all') }] : []),
    ...(examDate            ? [{ key: 'date',       label: 'Exam Date',   value: examDate,                                                                                  onRemove: () => setExamDate('') }] : []),
    ...(startDate           ? [{ key: 'startDate',  label: 'From',        value: startDate,                                                                                 onRemove: () => setStartDate('') }] : []),
    ...(endDate             ? [{ key: 'endDate',    label: 'To',          value: endDate,                                                                                   onRemove: () => setEndDate('') }] : []),
    ...(status !== 'all'    ? [{ key: 'status',     label: 'Status',      value: STUDENT_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status,                  onRemove: () => setStatus('all') }] : []),
    ...(sort !== 'date-asc' ? [{ key: 'sort',       label: 'Sort',        value: STUDENT_SORT_OPTIONS.find((o) => o.value === sort)?.label ?? sort,                       onRemove: () => setSort('date-asc') }] : []),
  ], [center, course, courseOptions, endDate, examDate, room, sort, startDate, status, timeSlot, timeSlotOptions]);

  const filterFields = React.useMemo(() => [
    { key: 'course',    label: 'Course',    value: course,    placeholder: 'All courses',         options: courseOptions,          onChange: setCourse },
    { key: 'room',      label: 'Room',      value: room,      placeholder: 'All rooms',           options: roomOptions,            onChange: setRoom },
    { key: 'center',    label: 'Center',    value: center,    placeholder: 'All centers',         options: centerOptions,          onChange: setCenter },
    { key: 'timeslot',  label: 'Time Slot', value: timeSlot,  placeholder: 'All time slots',      options: timeSlotOptions,        onChange: setTimeSlot },
    { key: 'status',    label: 'Status',    value: status,    placeholder: 'All statuses',        options: STUDENT_STATUS_OPTIONS, onChange: setStatus },
    { key: 'sort',      label: 'Sort by',   value: sort,      placeholder: 'Date (earliest first)', options: STUDENT_SORT_OPTIONS,   onChange: (v: string) => setSort(v as StudentSort) },
  ], [center, centerOptions, course, courseOptions, room, roomOptions, sort, status, timeSlot, timeSlotOptions]);

  const activeCount = badges.length + (query.trim() ? 1 : 0);
  const totalStudents = groups.reduce((total, group) => total + group.rows.length, 0);
  const visibleStudents = visibleGroups.reduce((total, group) => total + group.rows.length, 0);

  // ── Collapsible group state ─────────────────────────────────────────────────
  // Tracks which group keys are currently EXPANDED. An empty set means all groups
  // are collapsed, which is the default state.
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set());
  const toggleGroup = React.useCallback((key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

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
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            <Users className="size-4 text-zinc-400" />
            Assigned Student Roster
          </CardTitle>
        </CardHeader>
        <div className="border-b border-zinc-100 p-5 dark:border-zinc-800/70">
          <div className="space-y-2">
            <ScheduleFilterToolbar
              query={query}
              onQueryChange={setQuery}
              queryPlaceholder="Search student name, ID, email, course, room, center…"
              activeCount={activeCount}
              resultSummary={`Showing ${visibleStudents} of ${totalStudents} assigned student rows`}
              examDate={examDate}
              onExamDateChange={setExamDate}
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onReset={resetFilters}
              fields={filterFields}
            />
            <ActiveFilterBadges badges={badges} onClearAll={resetFilters} />
          </div>
        </div>
        <CardContent className="space-y-4 p-5">
          {dashboardQuery.isError ? (
            <p className="py-8 text-center text-sm text-rose-600 dark:text-rose-300">Unable to load assigned students.</p>
          ) : groups.length === 0 ? (
            <EmptyState title="No assigned student roster yet" description="Published schedules assigned to you will appear here with registered students grouped by exam." />
          ) : visibleGroups.length === 0 ? (
            <EmptyState title="No students match the current filters" description="Adjust the search term, course, date, room, or status filter to widen the roster." />
          ) : (
            <>
              {visibleGroups.map((group) => {
                const isOpen = expandedGroups.has(group.key);
                return (
                  <Collapsible key={group.key} open={isOpen} onOpenChange={() => toggleGroup(group.key)}>
                    <section className="overflow-hidden rounded-none border border-zinc-200/70 dark:border-zinc-800/80">
                      <CollapsibleTrigger asChild>
                        <div className="flex cursor-pointer flex-col gap-3 border-b border-zinc-100 bg-zinc-50/80 px-4 py-3 transition-colors hover:bg-zinc-100/70 dark:border-zinc-800/70 dark:bg-zinc-900/50 dark:hover:bg-zinc-800/40 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex items-start gap-2">
                            <ChevronDown
                              className={`mt-0.5 size-4 shrink-0 text-zinc-400 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}
                            />
                            <div>
                              <h2 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">{group.course}</h2>
                              <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                                <span>{group.courseCode}</span>
                                <span>{group.date}</span>
                                <span>{group.time}</span>
                                <span>{group.room}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">{group.center}</Badge>
                            <Badge>{group.rows.length} students</Badge>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
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
                                  <th className="px-4 py-3 font-semibold">Exam Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800/70 dark:bg-zinc-950">
                                {group.rows.map((row) => (
                                  <tr key={row.id} data-student-id={row.studentDbId} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/60">
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
                                    <td className="px-4 py-3"><Badge variant="secondary">{statusLabel(assignmentStatus(group.assignment))}</Badge></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </CollapsibleContent>
                    </section>
                  </Collapsible>
                );
              })}
            </>
          )}
        </CardContent>
      </Card>

    </div>
  );
};
