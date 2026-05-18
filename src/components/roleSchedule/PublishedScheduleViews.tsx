import React from 'react';
import { CalendarClock, CalendarDays, ChevronDown, List, MapPin, Search, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { usePublishedSchedulesForRole } from '@/hooks/roleDashboards/useRoleDashboards';
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
};

const getAssignmentTime = (assignment: ScheduleAssignment) => {
  const value = assignment.timeSlot?.startTime ?? assignment.timeSlot?.date;
  const time = value ? new Date(value).getTime() : Number.POSITIVE_INFINITY;
  return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
};

const sortAssignments = (assignments: ScheduleAssignment[]) => [...assignments].sort((a, b) => getAssignmentTime(a) - getAssignmentTime(b));

const courseTitle = (assignment: ScheduleAssignment) => assignment.exam?.courseOffering?.course?.title ?? 'Exam';
const courseCode = (assignment: ScheduleAssignment) => assignment.exam?.courseOffering?.course?.code ?? 'Course TBD';
const roomName = (assignment: ScheduleAssignment) => assignment.room?.name ?? 'Room TBD';
const centerName = (assignment: ScheduleAssignment) => assignment.room?.center?.name ?? 'Center TBD';
const proctorName = (assignment: ScheduleAssignment) => assignment.proctor?.user?.name ?? 'Proctor TBD';
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
);

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

const ScheduleTable = ({ assignments, onSelect, secondaryLabel }: { assignments: ScheduleAssignment[]; onSelect: (assignment: ScheduleAssignment) => void; secondaryLabel?: (assignment: ScheduleAssignment) => string }) => (
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
          <th className="px-4 py-3 font-semibold">Proctor</th>
          <th className="px-4 py-3 font-semibold">Exam Duration</th>
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
            <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{proctorName(assignment)}</td>
            <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{durationLabel(assignment)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ScheduleCalendar = ({ assignments, onSelect, compact = false }: { assignments: ScheduleAssignment[]; onSelect: (assignment: ScheduleAssignment) => void; compact?: boolean }) => {
  const grouped = React.useMemo(() => {
    const map = new Map<string, ScheduleAssignment[]>();
    for (const assignment of assignments) {
      const key = dateKey(assignment);
      const items = map.get(key) ?? [];
      items.push(assignment);
      map.set(key, items);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [assignments]);

  return (
    <div className="rounded-none border border-zinc-200/70 bg-white dark:border-zinc-800/80 dark:bg-zinc-950">
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
        {grouped.map(([key, items]) => (
          <li key={key} className="px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
              <div className="flex shrink-0 items-center gap-3 lg:w-24 lg:flex-col lg:items-center">
                <div className="inline-flex size-10 items-center justify-center rounded-full bg-zinc-950 text-sm font-bold text-white dark:bg-zinc-100 dark:text-zinc-950">
                  {key === 'unscheduled' ? '?' : Number(key.slice(8, 10))}
                </div>
                <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{key === 'unscheduled' ? 'Unscheduled' : formatUtcDate(`${key}T00:00:00.000Z`)}</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((assignment) => (
                    <button
                      key={assignment.id}
                      type="button"
                      onClick={() => onSelect(assignment)}
                      className={cn(
                        'rounded-none border border-indigo-200/70 bg-indigo-50/70 p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-indigo-800/60 dark:bg-indigo-950/35',
                        compact && 'p-2.5'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-zinc-950 dark:text-zinc-50">{courseTitle(assignment)}</p>
                          <p className="mt-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">{courseCode(assignment)}</p>
                        </div>
                        <Badge variant="secondary">{formatUtcTime(assignment.timeSlot?.startTime)}</Badge>
                      </div>
                      <div className="mt-3 space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                        <p className="flex items-center gap-1.5"><MapPin className="size-3.5 text-zinc-400" />{centerName(assignment)} - {roomName(assignment)}</p>
                        <p className="flex items-center gap-1.5"><UserCheck className="size-3.5 text-zinc-400" />{proctorName(assignment)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
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
}) => {
  const [viewMode, setViewMode] = React.useState<ViewMode>('table');
  const [selectedAssignment, setSelectedAssignment] = React.useState<ScheduleAssignment | null>(null);
  const sortedAssignments = React.useMemo(() => sortAssignments(assignments), [assignments]);

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
        <div className="flex gap-2">
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
          <ScheduleTable assignments={sortedAssignments} onSelect={setSelectedAssignment} secondaryLabel={secondaryLabel} />
        ) : (
          <ScheduleCalendar assignments={sortedAssignments} onSelect={setSelectedAssignment} />
        )}
      </CardContent>
      <DetailSheet assignment={selectedAssignment} onOpenChange={(open) => !open && setSelectedAssignment(null)} />
    </Card>
  );
};

export const FullPublishedScheduleSection: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<ViewMode>('table');
  const [query, setQuery] = React.useState('');
  const [selectedAssignment, setSelectedAssignment] = React.useState<ScheduleAssignment | null>(null);
  const schedulesQuery = usePublishedSchedulesForRole();
  const allAssignments = React.useMemo(() => flattenPublishedSchedules(schedulesQuery.data ?? []), [schedulesQuery.data]);
  const visibleAssignments = React.useMemo(() => filterAssignments(allAssignments, query), [allAssignments, query]);

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
              <div className="flex gap-2">
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