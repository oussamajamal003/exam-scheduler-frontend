import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  DoorOpen,
  Eye,
  Layers,
  RefreshCw,
  Search,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";

import { useConflicts } from "../../hooks/conflicts/useConflicts";
import { useSchedules } from "../../hooks/schedules/useSchedules";
import type { Conflict, ConflictType } from "../../schemas/conflict";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Skeleton, TableSkeletonRows } from "../../components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../../components/ui/sheet";
import { EmptyState } from "../../components/shared/EmptyState";
import { FilterPopover, FilterField } from "../../components/shared/FilterPopover";
import { useToast } from "../../components/ui/toast";
import { useDelayedLoading } from "../../hooks/common/useDelayedLoading";
import { getApiErrorMessage } from "../../lib/apiError";
import { cn } from "../../lib/utils";

// -------------------- helpers --------------------

const ALL = "__all__";

const KNOWN_TYPES: ConflictType[] = [
  "STUDENT_OVERLAP",
  "SUPERVISOR_DOUBLE_BOOKED",
  "ROOM_OVERCAPACITY",
  "RESOURCE_UNAVAILABLE",
  "TIME_CONSTRAINT_VIOLATION",
];

const formatType = (type?: string | null) =>
  String(type ?? "Conflict").replaceAll("_", " ");

const formatDateTime = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Best-effort: extract a course code (e.g. "CS301") from the conflict description.
const COURSE_CODE_RE = /\b[A-Z]{2,}[\s-]?\d{2,}[A-Z]?\b/;

const inferRelatedCourse = (c: Conflict): string | null => {
  const desc = c.description ?? "";
  const match = desc.match(COURSE_CODE_RE);
  return match ? match[0].replace(/\s|-/g, "") : null;
};

// -------------------- type styling --------------------

type TypeStyle = {
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  text: string;
  ring: string;
};

const TYPE_STYLES: Record<string, TypeStyle> = {
  STUDENT_CONFLICT: {
    icon: Users,
    bg: "bg-rose-50",
    text: "text-rose-700",
    ring: "ring-rose-200",
  },
  STUDENT_OVERLAP: {
    icon: Users,
    bg: "bg-rose-50",
    text: "text-rose-700",
    ring: "ring-rose-200",
  },
  ROOM_CONFLICT: {
    icon: DoorOpen,
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200",
  },
  ROOM_OVERCAPACITY: {
    icon: DoorOpen,
    bg: "bg-orange-50",
    text: "text-orange-700",
    ring: "ring-orange-200",
  },
  SUPERVISOR_CONFLICT: {
    icon: ShieldAlert,
    bg: "bg-violet-50",
    text: "text-violet-700",
    ring: "ring-violet-200",
  },
  SUPERVISOR_DOUBLE_BOOKED: {
    icon: ShieldAlert,
    bg: "bg-violet-50",
    text: "text-violet-700",
    ring: "ring-violet-200",
  },
  TIME_CONSTRAINT_VIOLATION: {
    icon: CalendarClock,
    bg: "bg-sky-50",
    text: "text-sky-700",
    ring: "ring-sky-200",
  },
  RESOURCE_UNAVAILABLE: {
    icon: Layers,
    bg: "bg-zinc-100",
    text: "text-zinc-700",
    ring: "ring-zinc-200",
  },
};

const DEFAULT_TYPE_STYLE: TypeStyle = {
  icon: AlertTriangle,
  bg: "bg-zinc-100",
  text: "text-zinc-700",
  ring: "ring-zinc-200",
};

const styleForType = (type?: string | null): TypeStyle => {
  if (!type) return DEFAULT_TYPE_STYLE;
  return TYPE_STYLES[type] ?? DEFAULT_TYPE_STYLE;
};

const ConflictTypeBadge = ({ type }: { type?: string | null }) => {
  const s = styleForType(type);
  const Icon = s.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-none px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        s.bg,
        s.text,
        s.ring
      )}
    >
      <Icon className="size-3" />
      {formatType(type)}
    </span>
  );
};

const StatusBadge = ({ resolved }: { resolved?: boolean }) =>
  resolved ? (
    <span className="inline-flex items-center gap-1 rounded-none border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
      <CheckCircle2 className="size-3" /> Resolved
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-none border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
      <AlertTriangle className="size-3" /> Unresolved
    </span>
  );

// -------------------- KPI --------------------

const KpiCard = ({
  label,
  value,
  hint,
  icon: Icon,
  tone = "zinc",
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "zinc" | "rose" | "emerald" | "amber";
}) => {
  const toneCls: Record<string, { bg: string; text: string }> = {
    zinc: { bg: "bg-zinc-100", text: "text-zinc-700" },
    rose: { bg: "bg-rose-50", text: "text-rose-700" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-700" },
    amber: { bg: "bg-amber-50", text: "text-amber-700" },
  };
  const t = toneCls[tone];
  return (
    <Card className="rounded-none border border-zinc-200/60 bg-white shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <span
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-full",
            t.bg,
            t.text
          )}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            {label}
          </div>
          <div className="text-xl font-semibold text-zinc-950 leading-tight">
            {value}
          </div>
          {hint && (
            <div className="text-[11px] text-zinc-500 truncate">{hint}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// -------------------- Page --------------------

export const ConflictsPage = () => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>(ALL);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [scheduleFilter, setScheduleFilter] = useState<string>(ALL);
  const [viewConflict, setViewConflict] = useState<Conflict | null>(null);

  const conflictsQuery = useConflicts({
    limit: 100,
    scheduleId: scheduleFilter !== ALL ? scheduleFilter : undefined,
    type:
      typeFilter !== ALL ? (typeFilter as Conflict["type"]) : undefined,
    resolved:
      statusFilter === "resolved"
        ? true
        : statusFilter === "unresolved"
        ? false
        : undefined,
  });

  const schedulesQuery = useSchedules({ limit: 100 });
  const schedules = schedulesQuery.data?.data ?? [];

  const conflicts = useMemo(
    () => conflictsQuery.data?.data ?? [],
    [conflictsQuery.data]
  );
  const showLoading = useDelayedLoading(conflictsQuery.isLoading, 400);

  // Client-side search across description + type + course
  const filteredConflicts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return conflicts;
    return conflicts.filter((c) => {
      const haystack = [
        c.description,
        c.type,
        c.conflictType,
        c.entity,
        c.suggestedFix,
        inferRelatedCourse(c) ?? "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [conflicts, search]);

  const stats = useMemo(() => {
    let resolved = 0;
    let unresolved = 0;
    const types = new Set<string>();
    for (const c of conflicts) {
      if (c.resolved) resolved += 1;
      else unresolved += 1;
      if (c.type) types.add(String(c.type));
    }
    return {
      total: conflicts.length,
      resolved,
      unresolved,
      typesCount: types.size,
    };
  }, [conflicts]);

  // Distinct conflict types observed in the data, used in the type filter.
  const observedTypes = useMemo(() => {
    const set = new Set<string>(KNOWN_TYPES);
    for (const c of conflicts) {
      if (c.type) set.add(String(c.type));
    }
    return Array.from(set).sort();
  }, [conflicts]);

  const activeFilterCount = [typeFilter, statusFilter, scheduleFilter].filter(
    (v) => v !== ALL
  ).length;

  const hasActiveFilters = search.trim() !== "" || activeFilterCount > 0;

  const clearFilters = () => {
    setSearch("");
    setTypeFilter(ALL);
    setStatusFilter(ALL);
    setScheduleFilter(ALL);
  };

  const isError = conflictsQuery.isError;
  const { addToast } = useToast();

  const handleRefresh = async () => {
    try {
      const result = await conflictsQuery.refetch();
      if (result.error) throw result.error;
      addToast({
        type: "success",
        title: "Conflicts refreshed",
        description: `${result.data?.data?.length ?? 0} conflicts loaded.`,
      });
    } catch (err) {
      addToast({
        type: "error",
        title: "Failed to refresh conflicts",
        description: getApiErrorMessage(err, "Please try again."),
      });
    }
  };

  return (
    <div className="p-5 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-none bg-zinc-950 text-white shadow-sm">
            <ShieldAlert className="size-5" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">
              Conflicts
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Detect and review scheduling clashes across students, supervisors, rooms and time slots.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={conflictsQuery.isFetching}
            className="h-10 rounded-none border-zinc-200 text-zinc-950 font-semibold hover:bg-zinc-50 active:scale-95 transition-all inline-flex items-center gap-2"
          >
            <RefreshCw
              className={cn(
                "size-4 transition-transform",
                conflictsQuery.isFetching && "animate-spin"
              )}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {showLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card
              key={i}
              className="rounded-none border border-zinc-200/60 bg-white shadow-sm"
            >
              <CardContent className="flex items-center gap-3 p-4">
                <Skeleton className="size-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <KpiCard
              label="Total"
              value={stats.total}
              hint={
                stats.total === 0 ? "No conflicts" : "Detected across schedules"
              }
              icon={ClipboardList}
            />
            <KpiCard
              label="Unresolved"
              value={stats.unresolved}
              hint={stats.unresolved === 0 ? "All clear" : "Need attention"}
              icon={AlertTriangle}
              tone={stats.unresolved > 0 ? "rose" : "zinc"}
            />
            <KpiCard
              label="Resolved"
              value={stats.resolved}
              hint={stats.resolved === 0 ? "—" : "Marked resolved"}
              icon={CheckCircle2}
              tone="emerald"
            />
            <KpiCard
              label="Types"
              value={stats.typesCount}
              hint="Distinct conflict types"
              icon={Layers}
              tone="amber"
            />
          </>
        )}
      </div>

      {/* Filters */}
      <Card className="rounded-none border border-zinc-200/60 bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by course code, description, type…"
                className="h-10 rounded-none border-zinc-200 bg-transparent pl-9"
              />
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="h-10 rounded-none text-zinc-700 hover:text-zinc-950 inline-flex items-center gap-1.5 px-2"
                >
                  <X className="size-4" /> Clear
                </Button>
              )}
              <FilterPopover activeCount={activeFilterCount} onClear={clearFilters}>
                <FilterField label="Type">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-10 rounded-none border-zinc-200 bg-transparent">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>All types</SelectItem>
                      {observedTypes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {formatType(t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterField>

                <FilterField label="Status">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-10 rounded-none border-zinc-200 bg-transparent">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>All statuses</SelectItem>
                      <SelectItem value="unresolved">Unresolved</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </FilterField>

                <FilterField label="Schedule">
                  <Select value={scheduleFilter} onValueChange={setScheduleFilter}>
                    <SelectTrigger className="h-10 rounded-none border-zinc-200 bg-transparent">
                      <SelectValue placeholder="All schedules" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>All schedules</SelectItem>
                      {schedules.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name ?? s.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterField>
              </FilterPopover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error state */}
      {isError && (
        <Card className="rounded-none border border-rose-200/60 bg-rose-50/40 shadow-sm">
          <CardContent className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                <AlertTriangle className="size-4" />
              </span>
              <div>
                <div className="text-sm font-semibold text-rose-800">
                  Failed to load conflicts
                </div>
                <div className="text-xs text-rose-700/80">
                  {getApiErrorMessage(
                    conflictsQuery.error,
                    "Something went wrong while fetching conflicts."
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={conflictsQuery.isFetching}
              className="h-9 rounded-none border-rose-200 bg-white text-rose-800 hover:bg-rose-50 inline-flex items-center gap-2"
            >
              <RefreshCw
                className={cn(
                  "size-4 transition-transform",
                  conflictsQuery.isFetching && "animate-spin"
                )}
              />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Conflicts table */}
      <Card className="rounded-none border border-zinc-200/60 bg-white shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50/60">
                  <TableHead className="text-xs uppercase tracking-wide text-zinc-500">
                    Conflict Type
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-zinc-500">
                    Related Course
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-zinc-500">
                    Description
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-zinc-500">
                    Schedule
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-zinc-500">
                    Status
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-zinc-500 whitespace-nowrap">
                    Created At
                  </TableHead>
                  <TableHead className="w-12 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {showLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <TableSkeletonRows columns={7} rows={8} />
                    </TableCell>
                  </TableRow>
                ) : isError ? null : filteredConflicts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <EmptyState
                        icon={CheckCircle2}
                        title="No conflicts detected"
                        description={
                          hasActiveFilters
                            ? "No conflicts match the current filters."
                            : "All schedules are clear of detected conflicts."
                        }
                        action={
                          hasActiveFilters
                            ? { label: "Clear filters", onClick: clearFilters }
                            : undefined
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredConflicts.map((c, idx) => {
                    const courseCode = inferRelatedCourse(c);
                    const scheduleName =
                      (c as Conflict & {
                        schedule?: { name?: string };
                      }).schedule?.name ?? c.scheduleId ?? "—";
                    const rowKey = c.id ?? `conflict-${idx}`;
                    return (
                      <TableRow
                        key={rowKey}
                        className="text-sm cursor-pointer transition-colors hover:bg-zinc-50/80 focus-visible:bg-zinc-50/80 focus:outline-none"
                        tabIndex={0}
                        role="button"
                        aria-label={`View details for ${formatType(c.type)}`}
                        onClick={() => setViewConflict(c)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setViewConflict(c);
                          }
                        }}
                      >
                        <TableCell>
                          <ConflictTypeBadge type={c.type ?? c.conflictType} />
                        </TableCell>
                        <TableCell>
                          {courseCode ? (
                            <span className="inline-flex items-center rounded-none border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-mono font-semibold text-zinc-700">
                              {courseCode}
                            </span>
                          ) : (
                            <span className="text-zinc-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-md text-zinc-700">
                          <div className="line-clamp-2">{c.description}</div>
                          {c.suggestedFix && (
                            <div className="mt-0.5 truncate text-[11px] text-zinc-500">
                              Suggested: {c.suggestedFix}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-zinc-700">
                          <span className="truncate">{scheduleName}</span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge resolved={c.resolved} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-zinc-700">
                          {formatDateTime(c.createdAt)}
                        </TableCell>
                        <TableCell
                          className="text-right"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-none hover:bg-zinc-100"
                            aria-label="View conflict details"
                            onClick={() => setViewConflict(c)}
                          >
                            <Eye className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail sheet */}
      <ConflictDetailsSheet
        conflict={viewConflict}
        onOpenChange={(next) => {
          if (!next) setViewConflict(null);
        }}
      />
    </div>
  );
};

// -------------------- Detail Sheet --------------------

const ConflictDetailsSheet = ({
  conflict,
  onOpenChange,
}: {
  conflict: Conflict | null;
  onOpenChange: (next: boolean) => void;
}) => {
  const open = Boolean(conflict);
  const c = conflict;
  const courseCode = c ? inferRelatedCourse(c) : null;
  const scheduleName =
    (c as (Conflict & { schedule?: { name?: string } }) | null)?.schedule
      ?.name ??
    c?.scheduleId ??
    "—";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl bg-zinc-50">
        <SheetHeader className="bg-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="text-lg truncate">
                {formatType(c?.type ?? c?.conflictType)}
              </SheetTitle>
              <SheetDescription className="font-mono">
                {courseCode ?? "—"}
                {scheduleName !== "—" && (
                  <span className="text-zinc-400"> · {scheduleName}</span>
                )}
              </SheetDescription>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <StatusBadge resolved={c?.resolved} />
              <ConflictTypeBadge type={c?.type ?? c?.conflictType} />
            </div>
          </div>
        </SheetHeader>

        {c ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <section className="border border-zinc-200/60 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-700 mb-2">
                Description
              </div>
              <div className="text-sm text-zinc-900 whitespace-pre-wrap">
                {c.description ?? "—"}
              </div>
            </section>

            {c.suggestedFix && (
              <section className="border border-emerald-200 bg-emerald-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-emerald-800 mb-2">
                  Suggested Fix
                </div>
                <div className="text-sm text-emerald-900 whitespace-pre-wrap">
                  {c.suggestedFix}
                </div>
              </section>
            )}

            <section className="border border-zinc-200/60 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-700 mb-3">
                Conflict Details
              </div>
              <div className="divide-y divide-zinc-100">
                {/* Type */}
                <KV
                  label="Type"
                  value={<ConflictTypeBadge type={c.type ?? c.conflictType} />}
                />
                {/* Status */}
                <KV
                  label="Status"
                  value={<StatusBadge resolved={c.resolved} />}
                />
                {/* Related Course */}
                <KV
                  label="Related Course"
                  value={
                    (() => {
                      const course =
                        (c as Conflict & { exam?: { courseOffering?: { course?: { code?: string; title?: string; name?: string } } } }).exam
                          ?.courseOffering?.course;
                      if (course?.code || course?.title || course?.name) {
                        return (
                          <span className="inline-flex items-center gap-1.5">
                            {course.code && (
                              <span className="font-mono text-xs font-semibold bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded-none text-zinc-700">
                                {course.code}
                              </span>
                            )}
                            {(course.title ?? course.name) && (
                              <span className="text-zinc-800">{course.title ?? course.name}</span>
                            )}
                          </span>
                        );
                      }
                      return courseCode ? (
                        <span className="font-mono text-xs font-semibold bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded-none text-zinc-700">
                          {courseCode}
                        </span>
                      ) : (
                        <span className="text-zinc-400">No related course</span>
                      );
                    })()
                  }
                />
                {/* Schedule */}
                <KV
                  label="Schedule"
                  value={
                    scheduleName !== "—" ? (
                      <span className="font-medium text-zinc-800">{scheduleName}</span>
                    ) : (
                      <span className="text-zinc-400">Not assigned</span>
                    )
                  }
                />
                {/* Room */}
                {(() => {
                  const room = (c as Conflict & { room?: { name?: string } }).room;
                  return room?.name ? (
                    <KV
                      label="Room"
                      value={<span className="font-medium text-zinc-800">{room.name}</span>}
                    />
                  ) : null;
                })()}
                {/* Supervisor */}
                {(() => {
                  const sup = (c as Conflict & { supervisor?: { user?: { name?: string; email?: string } } }).supervisor;
                  const supName = sup?.user?.name ?? sup?.user?.email;
                  return supName ? (
                    <KV
                      label="Supervisor"
                      value={<span className="font-medium text-zinc-800">{supName}</span>}
                    />
                  ) : null;
                })()}
                {/* Time Slot */}
                {(() => {
                  const ts = (c as Conflict & { timeSlot?: { startTime?: string; endTime?: string; date?: string } }).timeSlot;
                  if (ts?.startTime || ts?.date) {
                    const start = ts.startTime ? formatDateTime(ts.startTime) : "";
                    const end = ts.endTime ? ` → ${formatDateTime(ts.endTime)}` : "";
                    return (
                      <KV
                        label="Time Slot"
                        value={<span className="text-zinc-800">{start}{end}</span>}
                      />
                    );
                  }
                  return null;
                })()}
                {/* Entity (internal tag, shown only if meaningful) */}
                {c.entity && (
                  <KV
                    label="Entity"
                    value={
                      <span className="font-mono text-[11px] bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 text-zinc-600 rounded-none">
                        {c.entity}
                      </span>
                    }
                  />
                )}
                {/* Detected At */}
                <KV
                  label="Detected At"
                  value={<span className="text-zinc-600">{formatDateTime(c.createdAt)}</span>}
                />
              </div>
            </section>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
};

const KV = ({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) => (
  <div className="grid grid-cols-3 gap-3 py-1.5 text-sm">
    <div className="col-span-1 text-xs uppercase tracking-wide text-zinc-500">
      {label}
    </div>
    <div
      className={cn(
        "col-span-2 text-zinc-900 wrap-break-word",
        mono && "font-mono text-zinc-700"
      )}
    >
      {value}
    </div>
  </div>
);

export default ConflictsPage;
