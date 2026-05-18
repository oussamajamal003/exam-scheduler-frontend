import React from 'react';
import { CalendarClock, CalendarDays, CalendarRange, ChevronDown, ChevronLeft, ChevronRight, Clock, DoorOpen, List, MapPin, Search, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { usePublishedSchedulesForRole } from '@/hooks/roleDashboards/useRoleDashboards';
import { useSchedulePdfDownload } from '@/hooks/schedulePdf/useSchedulePdfDownload';
import { downloadFullPublishedSchedulePdf } from '@/api/schedulePdf.api';
import { DownloadPdfButton } from '@/components/roleSchedule/DownloadPdfButton';
import { formatUtcDate, formatUtcTime } from '@/lib/dateTime';
import { cn } from '@/lib/utils';
import type { Schedule, ScheduleAssignment } from '@/schemas/schedule';

type ViewMode = 'table' | 'calendar';

type RoleScheduleViewProps = {
  title: string;
  description: string;
  assignments: ScheduleAssignment[];
  loading?: boolean;
  error?: boolean;
  emptyLabel: string;
  errorLabel: string;
  secondaryLabel?: (assignment: ScheduleAssignment) => string;
  tableMode?: 'default' | 'proctor';
  dedupeLogicalAssignments?: boolean;
  headerActions?: React.ReactNode;
};

const getAssignmentTime = (assignment: ScheduleAssignment) => {
  const value = assignment.timeSlot?.startTime ?? assignment.timeSlot?.date;
  const time = value ? new Date(value).getTime() : Number.POSITIVE_INFINITY;
  return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
};

const sortAssignments = (assignments: ScheduleAssignment[]) => [...assignments].sort((a, b) => getAssignmentTime(a) - getAssignmentTime(b));
const logicalAssignmentKey = (assignment: ScheduleAssignment) => `${assignment.examId}:${assignment.timeSlotId}`;

const dedupeLogicalAssignments = (assignments: ScheduleAssignment[]) => {
  const unique = new Map<string, ScheduleAssignment>();
  for (const assignment of assignments) {
    const key = logicalAssignmentKey(assignment);
    if (!unique.has(key)) {
      unique.set(key, assignment);
    }
  }
  return Array.from(unique.values());
};

const courseTitle = (assignment: ScheduleAssignment) => assignment.exam?.courseOffering?.course?.title ?? 'Exam';
const courseCode = (assignment: ScheduleAssignment) => assignment.exam?.courseOffering?.course?.code ?? 'Course TBD';
const roomName = (assignment: ScheduleAssignment) => assignment.room?.name ?? 'Room TBD';
const centerName = (assignment: ScheduleAssignment) => assignment.room?.center?.name ?? 'Center TBD';
const proctorName = (assignment: ScheduleAssignment) => assignment.proctor?.user?.name ?? 'Proctor TBD';
const studentCount = (assignment: ScheduleAssignment) => assignment.exam?.courseOffering?.registrations?.length ?? assignment.exam?.courseOffering?.expectedStudents ?? 0;
const durationLabel = (assignment: ScheduleAssignment) => {
  const duration = assignment.exam?.duration ?? assignment.timeSlot?.duration;
  return duration ? `${duration} min` : 'Duration TBD';
};

const dateKey = (assignment: ScheduleAssignment) => {
  const value = assignment.timeSlot?.date ?? assignment.timeSlot?.startTime;
  if (!value) return 'unscheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'unscheduled';
  return date.toISOString().slice(0, 10);
};

const assignmentSearchIndex = (assignment: ScheduleAssignment) => [
  courseTitle(assignment),
  courseCode(assignment),
  formatUtcDate(assignment.timeSlot?.date ?? assignment.timeSlot?.startTime),
  formatUtcTime(assignment.timeSlot?.startTime),
  roomName(assignment),
  centerName(assignment),
  proctorName(assignment),
  assignment.schedule?.name,
].filter(Boolean).join(' ').toLowerCase();

const filterAssignments = (assignments: ScheduleAssignment[], query: string) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return assignments;
  return assignments.filter((assignment) => assignmentSearchIndex(assignment).includes(normalized));
};

const flattenPublishedSchedules = (schedules: Schedule[]) => sortAssignments(
  dedupeLogicalAssignments(
    schedules
    .filter((schedule) => schedule.isFinal)
    .flatMap((schedule) =>
      (schedule.assignments ?? []).map((assignment) => ({
        ...assignment,
        schedule: assignment.schedule ?? {
          id: schedule.id,
          name: schedule.name,
          examPeriod: schedule.examPeriod,
          isFinal: schedule.isFinal,
          createdAt: schedule.createdAt,
          updatedAt: schedule.updatedAt,
        },
      }))
    )
  )
);

type CalendarPalette = {
  cardBg: string;
  cardBorder: string;
  badgeBg: string;
  badgeText: string;
  accent: string;
};

const CALENDAR_PALETTES: CalendarPalette[] = [
  {
    cardBg: 'bg-indigo-50/70 dark:bg-indigo-950/40',
    cardBorder: 'border-indigo-200/70 dark:border-indigo-800/60',
    badgeBg: 'bg-white dark:bg-indigo-950/60',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    accent: 'text-indigo-700 dark:text-indigo-400',
  },
  {
    cardBg: 'bg-amber-50/80 dark:bg-amber-950/40',
    cardBorder: 'border-amber-200/70 dark:border-amber-800/60',
    badgeBg: 'bg-white dark:bg-amber-950/60',
    badgeText: 'text-amber-700 dark:text-amber-300',
    accent: 'text-amber-700 dark:text-amber-400',
  },
  {
    cardBg: 'bg-rose-50/70 dark:bg-rose-950/40',
    cardBorder: 'border-rose-200/70 dark:border-rose-800/60',
    badgeBg: 'bg-white dark:bg-rose-950/60',
    badgeText: 'text-rose-700 dark:text-rose-300',
    accent: 'text-rose-700 dark:text-rose-400',
  },
  {
    cardBg: 'bg-emerald-50/70 dark:bg-emerald-950/40',
    cardBorder: 'border-emerald-200/70 dark:border-emerald-800/60',
    badgeBg: 'bg-white dark:bg-emerald-950/60',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    accent: 'text-emerald-700 dark:text-emerald-400',
  },
  {
    cardBg: 'bg-sky-50/70 dark:bg-sky-950/40',
    cardBorder: 'border-sky-200/70 dark:border-sky-800/60',
    badgeBg: 'bg-white dark:bg-sky-950/60',
    badgeText: 'text-sky-700 dark:text-sky-300',
    accent: 'text-sky-700 dark:text-sky-400',
  },
  {
    cardBg: 'bg-violet-50/70 dark:bg-violet-950/40',
    cardBorder: 'border-violet-200/70 dark:border-violet-800/60',
    badgeBg: 'bg-white dark:bg-violet-950/60',
    badgeText: 'text-violet-700 dark:text-violet-300',
    accent: 'text-violet-700 dark:text-violet-400',
  },
];

const paletteForKey = (key: string): CalendarPalette => {
  if (!key) return CALENDAR_PALETTES[0];
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
  }
  return CALENDAR_PALETTES[hash % CALENDAR_PALETTES.length];
};

const ToggleButton = ({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: typeof List; children: React.ReactNode }) => (
  <Button
    type="button"
    variant={active ? 'default' : 'outline'}
    size="sm"
    onClick={onClick}
    className={cn(active && 'bg-zinc-950 text-white hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200')}
  >
    <Icon className="size-3.5" />
    {children}
  </Button>
);

const EmptyState = ({ label }: { label: string }) => (
  <div className="flex min-h-56 flex-col items-center justify-center rounded-none border border-dashed border-zinc-200 bg-zinc-50/70 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
    <CalendarClock className="size-8 text-zinc-300 dark:text-zinc-600" />
    <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">{label}</p>
  </div>
);

const ScheduleTable = ({
  assignments,
  onSelect,
  secondaryLabel,
  mode = 'default',
}: {
  assignments: ScheduleAssignment[];
  onSelect: (assignment: ScheduleAssignment) => void;
  secondaryLabel?: (assignment: ScheduleAssignment) => string;
  mode?: 'default' | 'proctor';
}) => (
  <div className="overflow-x-auto rounded-none border border-zinc-200/70 dark:border-zinc-800/80">
    <table className="min-w-full divide-y divide-zinc-200 text-left text-sm dark:divide-zinc-800">
      <thead className="bg-zinc-50 text-[11px] uppercase tracking-[0.16em] text-zinc-500 dark:bg-zinc-900/70 dark:text-zinc-400">
        <tr>
          <th className="px-4 py-3 font-semibold">Course</th>
          <th className="px-4 py-3 font-semibold">Course Code</th>
          <th className="px-4 py-3 font-semibold">Date</th>
          <th className="px-4 py-3 font-semibold">Time</th>
          <th className="px-4 py-3 font-semibold">Room</th>
          <th className="px-4 py-3 font-semibold">Center</th>
          <th className="px-4 py-3 font-semibold">{mode === 'proctor' ? 'Student Count' : 'Proctor'}</th>
          <th className="px-4 py-3 font-semibold">Duration</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800/70 dark:bg-zinc-950">
        {assignments.map((assignment) => (
          <tr
            key={assignment.id}
            onClick={() => onSelect(assignment)}
            className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
          >
            <td className="px-4 py-3 font-semibold text-zinc-950 dark:text-zinc-50">
              <div>{courseTitle(assignment)}</div>
              {secondaryLabel && <div className="mt-1 text-xs font-normal text-zinc-500 dark:text-zinc-400">{secondaryLabel(assignment)}</div>}
            </td>
            <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{courseCode(assignment)}</td>
            <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{formatUtcDate(assignment.timeSlot?.date ?? assignment.timeSlot?.startTime)}</td>
            <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{formatUtcTime(assignment.timeSlot?.startTime)}</td>
            <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{roomName(assignment)}</td>
            <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{centerName(assignment)}</td>
            <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{mode === 'proctor' ? studentCount(assignment) : proctorName(assignment)}</td>
            <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{durationLabel(assignment)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ScheduleCalendar = ({ assignments, onSelect, compact = false }: { assignments: ScheduleAssignment[]; onSelect: (assignment: ScheduleAssignment) => void; compact?: boolean }) => {
  const assignmentsByDay = React.useMemo(() => {
    const groups = new Map<string, ScheduleAssignment[]>();
    for (const assignment of assignments) {
      const key = dateKey(assignment);
      if (!key || key === 'unscheduled') continue;
      const list = groups.get(key) ?? [];
      list.push(assignment);
      groups.set(key, list);
    }
    for (const [key, list] of groups) {
      list.sort((a, b) => getAssignmentTime(a) - getAssignmentTime(b));
      groups.set(key, list);
    }
    return groups;
  }, [assignments]);

  const monthsWithExams = React.useMemo(() => Array.from(new Set(Array.from(assignmentsByDay.keys()).map((key) => key.slice(0, 7)))).sort(), [assignmentsByDay]);
  const yearsWithExams = React.useMemo(() => Array.from(new Set(Array.from(assignmentsByDay.keys()).map((key) => Number(key.slice(0, 4))))).sort((a, b) => a - b), [assignmentsByDay]);
  const [selectedYear, setSelectedYear] = React.useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = React.useState<string | null>(null);

  const effectiveYear = React.useMemo(() => {
    if (selectedYear && yearsWithExams.includes(selectedYear)) return selectedYear;
    if (yearsWithExams.length > 0) return yearsWithExams[0];
    return new Date().getFullYear();
  }, [selectedYear, yearsWithExams]);

  const monthsOfYear = React.useMemo(() => Array.from({ length: 12 }, (_, index) => `${effectiveYear}-${String(index + 1).padStart(2, '0')}`), [effectiveYear]);

  const effectiveMonth = React.useMemo(() => {
    if (selectedMonth && selectedMonth.startsWith(`${effectiveYear}-`) && monthsOfYear.includes(selectedMonth)) return selectedMonth;
    const firstWithExams = monthsWithExams.find((month) => month.startsWith(`${effectiveYear}-`));
    return firstWithExams ?? monthsOfYear[0];
  }, [selectedMonth, effectiveYear, monthsOfYear, monthsWithExams]);

  const monthIndex = monthsOfYear.indexOf(effectiveMonth);
  const canGoPrev = monthIndex > 0;
  const canGoNext = monthIndex >= 0 && monthIndex < monthsOfYear.length - 1;

  const daysInMonth = React.useMemo(() => {
    if (!effectiveMonth) return [] as Array<{ key: string; items: ScheduleAssignment[] }>;
    const [yearStr, monthStr] = effectiveMonth.split('-');
    const year = Number(yearStr);
    const monthIdx = Number(monthStr) - 1;
    const total = new Date(year, monthIdx + 1, 0).getDate();
    return Array.from({ length: total }, (_, index) => {
      const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`;
      return { key, items: assignmentsByDay.get(key) ?? [] };
    });
  }, [effectiveMonth, assignmentsByDay]);

  type CalendarRow =
    | { kind: 'day'; key: string; items: ScheduleAssignment[] }
    | { kind: 'empty'; startKey: string; endKey: string; count: number };

  const calendarRows = React.useMemo<CalendarRow[]>(() => {
    const rows: CalendarRow[] = [];
    let buffer: Array<{ key: string; items: ScheduleAssignment[] }> = [];

    const flush = () => {
      if (buffer.length === 0) return;
      if (buffer.length === 1) {
        rows.push({ kind: 'day', key: buffer[0].key, items: [] });
      } else {
        rows.push({ kind: 'empty', startKey: buffer[0].key, endKey: buffer[buffer.length - 1].key, count: buffer.length });
      }
      buffer = [];
    };

    for (const day of daysInMonth) {
      if (day.items.length === 0) {
        buffer.push(day);
      } else {
        flush();
        rows.push({ kind: 'day', key: day.key, items: day.items });
      }
    }
    flush();
    return rows;
  }, [daysInMonth]);

  const examsThisMonth = React.useMemo(() => daysInMonth.reduce((sum, day) => sum + day.items.length, 0), [daysInMonth]);

  const formatMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString([], { month: 'short' });
  };

  const formatMonthFullLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString([], { month: 'long', year: 'numeric' });
  };

  if (assignments.length === 0) {
    return <EmptyState label="No exams to display yet." />;
  }

  return (
    <Card className="rounded-none border border-zinc-200/60 bg-white shadow-sm dark:border-zinc-800/60 dark:bg-zinc-950">
      <CardContent className="p-0">
        <div className="sticky top-0 z-10 border-b border-zinc-200/70 bg-white/95 px-4 py-3 backdrop-blur-sm dark:border-zinc-800/70 dark:bg-zinc-950/95 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => canGoPrev && setSelectedMonth(monthsOfYear[monthIndex - 1])}
              disabled={!canGoPrev}
              aria-label="Previous month"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div className="-mx-1 flex flex-1 items-center gap-2 overflow-x-auto px-1">
              {monthsOfYear.map((monthKey) => {
                const isActive = monthKey === effectiveMonth;
                const hasExams = monthsWithExams.includes(monthKey);
                return (
                  <button
                    key={monthKey}
                    type="button"
                    onClick={() => setSelectedMonth(monthKey)}
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors',
                      isActive
                        ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950'
                        : hasExams
                          ? 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-zinc-100'
                          : 'border-zinc-200 bg-white text-zinc-400 hover:border-zinc-300 hover:text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-600 dark:hover:border-zinc-700 dark:hover:text-zinc-500'
                    )}
                  >
                    {formatMonthLabel(monthKey)}
                    {hasExams && <span className={cn('inline-block size-1.5 rounded-full', isActive ? 'bg-zinc-950/70 dark:bg-zinc-100/70' : 'bg-zinc-900 dark:bg-zinc-300')} />}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => canGoNext && setSelectedMonth(monthsOfYear[monthIndex + 1])}
              disabled={!canGoNext}
              aria-label="Next month"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {formatMonthFullLabel(effectiveMonth)}
              <span className="ml-2 normal-case tracking-normal text-zinc-400 dark:text-zinc-500">· {examsThisMonth} {examsThisMonth === 1 ? 'exam' : 'exams'}</span>
            </div>
            {yearsWithExams.length > 1 && (
              <div className="flex items-center gap-1">
                {yearsWithExams.map((year) => {
                  const isActive = year === effectiveYear;
                  return (
                    <button
                      key={year}
                      type="button"
                      onClick={() => {
                        setSelectedYear(year);
                        setSelectedMonth(null);
                      }}
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors',
                        isActive
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                          : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                      )}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {examsThisMonth === 0 ? (
          <div className="px-6 py-16 text-center">
            <CalendarRange className="mx-auto size-8 text-zinc-300 dark:text-zinc-600" />
            <div className="mt-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">No exam available</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-500">No exams are scheduled in {formatMonthFullLabel(effectiveMonth)}.</div>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
            {calendarRows.map((row) => {
              if (row.kind === 'empty') {
                const startNum = Number(row.startKey.slice(8, 10));
                const endNum = Number(row.endKey.slice(8, 10));
                return (
                  <li key={`empty-${row.startKey}`} className="flex items-center gap-4 px-4 py-4 sm:px-6 lg:gap-6">
                    <div className="flex shrink-0 items-center gap-2 lg:w-16 lg:justify-center">
                      <span className="inline-flex items-center justify-center rounded-full border border-dashed border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950">
                        {startNum}-{endNum}
                      </span>
                    </div>
                    <div className="text-sm italic text-zinc-400">No exam ({row.count} days).</div>
                  </li>
                );
              }

              const dayNum = Number(row.key.slice(8, 10));
              return (
                <li key={row.key} className="px-4 py-5 sm:px-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
                    <div className="flex shrink-0 items-center gap-3 lg:w-16 lg:flex-col lg:items-center">
                      <div className="inline-flex size-9 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-950">
                        {dayNum}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={cn('-mx-1 flex gap-3 px-1 pb-2 snap-x snap-mandatory overflow-x-auto scroll-smooth lg:flex-wrap lg:overflow-visible lg:snap-none')}>
                        {row.items.map((assignment) => {
                          const course = assignment.exam?.courseOffering?.course;
                          const palette = paletteForKey(course?.id ?? course?.code ?? assignment.id);
                          const title = course?.title ?? course?.name ?? 'Untitled course';
                          return (
                            <button
                              key={assignment.id}
                              type="button"
                              onClick={() => onSelect(assignment)}
                              className={cn(
                                'group relative flex w-72 shrink-0 snap-start flex-col gap-3 rounded-2xl border p-4 text-left shadow-[0_1px_2px_rgba(24,24,27,0.04),0_4px_12px_-4px_rgba(24,24,27,0.06)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(24,24,27,0.06),0_12px_24px_-8px_rgba(24,24,27,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-900 lg:w-76',
                                compact && 'w-68',
                                palette.cardBg,
                                palette.cardBorder
                              )}
                              aria-label={`View details for ${title}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wide', palette.badgeBg, palette.badgeText)}>
                                    {courseCode(assignment)}
                                  </span>
                                  <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-100">{title}</h3>
                                </div>
                                <Badge variant="secondary">{formatUtcTime(assignment.timeSlot?.startTime)}</Badge>
                              </div>

                              <div className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                                <Clock className={cn('size-3.5', palette.accent)} />
                                <span className="font-semibold tabular-nums">{formatUtcTime(assignment.timeSlot?.startTime)} - {formatUtcTime(assignment.timeSlot?.endTime)}</span>
                                <span className="ml-auto inline-flex items-center rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:bg-white/10 dark:text-zinc-400">{durationLabel(assignment)}</span>
                              </div>

                              <div className="rounded-xl border border-white/70 bg-white/80 p-3 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                                <div className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                                  <DoorOpen className="size-3.5 text-zinc-500 dark:text-zinc-400" />
                                  <span className="truncate font-medium">{roomName(assignment)}</span>
                                  <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                                    <MapPin className="size-3" />
                                    <span className="truncate">{centerName(assignment)}</span>
                                  </span>
                                </div>
                                <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                                  <UserCheck className="size-3.5 text-zinc-500 dark:text-zinc-400" />
                                  <span className="truncate">{proctorName(assignment)}</span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

const DetailSheet = ({ assignment, onOpenChange }: { assignment: ScheduleAssignment | null; onOpenChange: (open: boolean) => void }) => (
  <Sheet open={Boolean(assignment)} onOpenChange={onOpenChange}>
    <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
      <SheetHeader>
        <SheetTitle>{assignment ? courseTitle(assignment) : 'Exam details'}</SheetTitle>
        <SheetDescription>{assignment ? `${courseCode(assignment)} - read-only published exam assignment` : 'Read-only assignment details'}</SheetDescription>
      </SheetHeader>
      {assignment && (
        <div className="space-y-4 p-5">
          <div className="rounded-none border border-zinc-200/70 bg-zinc-50/70 p-4 dark:border-zinc-800/70 dark:bg-zinc-900/45">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Course info</p>
            <p className="mt-2 text-lg font-bold text-zinc-950 dark:text-zinc-50">{courseTitle(assignment)}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{courseCode(assignment)}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailItem label="Date" value={formatUtcDate(assignment.timeSlot?.date ?? assignment.timeSlot?.startTime)} />
            <DetailItem label="Time slot" value={`${formatUtcTime(assignment.timeSlot?.startTime)} - ${formatUtcTime(assignment.timeSlot?.endTime)}`} />
            <DetailItem label="Room" value={roomName(assignment)} />
            <DetailItem label="Center" value={centerName(assignment)} />
            <DetailItem label="Proctor" value={proctorName(assignment)} />
            <DetailItem label="Students" value={`${studentCount(assignment)} students`} />
            <DetailItem label="Duration" value={durationLabel(assignment)} />
          </div>
        </div>
      )}
    </SheetContent>
  </Sheet>
);

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-none border border-zinc-200/70 bg-white p-3 dark:border-zinc-800/70 dark:bg-zinc-950">
    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">{label}</p>
    <p className="mt-1 text-sm font-semibold text-zinc-950 dark:text-zinc-50">{value}</p>
  </div>
);

const ScheduleSkeleton = () => (
  <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
    <CardContent className="space-y-3 p-5">
      {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-14 w-full" />)}
    </CardContent>
  </Card>
);

export const RoleScheduleView: React.FC<RoleScheduleViewProps> = ({
  title,
  description,
  assignments,
  loading,
  error,
  emptyLabel,
  errorLabel,
  secondaryLabel,
  tableMode = 'default',
  dedupeLogicalAssignments: shouldDedupeLogicalAssignments = false,
  headerActions,
}) => {
  const [viewMode, setViewMode] = React.useState<ViewMode>('table');
  const [selectedAssignment, setSelectedAssignment] = React.useState<ScheduleAssignment | null>(null);
  const sortedAssignments = React.useMemo(
    () => sortAssignments(shouldDedupeLogicalAssignments ? dedupeLogicalAssignments(assignments) : assignments),
    [assignments, shouldDedupeLogicalAssignments]
  );

  if (loading) return <ScheduleSkeleton />;

  return (
    <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
      <CardHeader className="flex flex-col gap-3 border-b border-zinc-100 dark:border-zinc-800/70 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            <CalendarClock className="size-4 text-zinc-400" />
            {title}
          </CardTitle>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {headerActions}
          <ToggleButton active={viewMode === 'table'} onClick={() => setViewMode('table')} icon={List}>Table</ToggleButton>
          <ToggleButton active={viewMode === 'calendar'} onClick={() => setViewMode('calendar')} icon={CalendarDays}>Calendar</ToggleButton>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {error ? (
          <p className="py-8 text-center text-sm text-rose-600 dark:text-rose-300">{errorLabel}</p>
        ) : sortedAssignments.length === 0 ? (
          <EmptyState label={emptyLabel} />
        ) : viewMode === 'table' ? (
          <ScheduleTable assignments={sortedAssignments} onSelect={setSelectedAssignment} secondaryLabel={secondaryLabel} mode={tableMode} />
        ) : (
          <ScheduleCalendar assignments={sortedAssignments} onSelect={setSelectedAssignment} />
        )}
      </CardContent>
      <DetailSheet assignment={selectedAssignment} onOpenChange={(open) => !open && setSelectedAssignment(null)} />
    </Card>
  );
};

export const FullPublishedScheduleSection: React.FC<{ portal?: 'student' | 'proctor' }> = ({ portal = 'student' }) => {
  const [open, setOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<ViewMode>('table');
  const [query, setQuery] = React.useState('');
  const [selectedAssignment, setSelectedAssignment] = React.useState<ScheduleAssignment | null>(null);
  const schedulesQuery = usePublishedSchedulesForRole();
  const allAssignments = React.useMemo(() => flattenPublishedSchedules(schedulesQuery.data ?? []), [schedulesQuery.data]);
  const visibleAssignments = React.useMemo(() => filterAssignments(allAssignments, query), [allAssignments, query]);
  const { download, isDownloading } = useSchedulePdfDownload();

  const handleDownloadFull = () =>
    download(() => downloadFullPublishedSchedulePdf(portal), {
      startTitle: 'Preparing full schedule',
      successTitle: 'Full schedule downloaded',
      errorTitle: 'Unable to download full schedule',
    });

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="rounded-none border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/70">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                <CalendarDays className="size-4 text-zinc-400" />
                Full Published Schedule
              </CardTitle>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Read-only view of the official exam timetable</p>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm">
                <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
                {open ? 'Hide full schedule' : 'Show full schedule'}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative max-w-xl flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by course, date, or center"
                  className="pl-8"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <DownloadPdfButton
                  onClick={handleDownloadFull}
                  loading={isDownloading}
                  disabled={allAssignments.length === 0}
                  label="Download Full Schedule PDF"
                />
                <ToggleButton active={viewMode === 'table'} onClick={() => setViewMode('table')} icon={List}>Compact table</ToggleButton>
                <ToggleButton active={viewMode === 'calendar'} onClick={() => setViewMode('calendar')} icon={CalendarDays}>Calendar</ToggleButton>
              </div>
            </div>
            {schedulesQuery.isLoading ? (
              <div className="space-y-3">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-12 w-full" />)}</div>
            ) : schedulesQuery.isError ? (
              <p className="py-8 text-center text-sm text-rose-600 dark:text-rose-300">Unable to load the full published schedule.</p>
            ) : allAssignments.length === 0 ? (
              <EmptyState label="No published schedule exists yet." />
            ) : visibleAssignments.length === 0 ? (
              <EmptyState label="No published exams match your search." />
            ) : viewMode === 'table' ? (
              <ScheduleTable assignments={visibleAssignments} onSelect={setSelectedAssignment} secondaryLabel={(assignment) => assignment.schedule?.name ?? 'Published schedule'} />
            ) : (
              <ScheduleCalendar assignments={visibleAssignments} onSelect={setSelectedAssignment} compact />
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
      <DetailSheet assignment={selectedAssignment} onOpenChange={(nextOpen) => !nextOpen && setSelectedAssignment(null)} />
    </Collapsible>
  );
};