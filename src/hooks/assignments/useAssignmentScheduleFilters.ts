import * as React from "react";
import { buildSearchIndex, matchesSmartSearch } from "@/lib/smartSearch";
import { formatTimeSlotLabel } from "@/lib/dateTime";
import type { ScheduleAssignment } from "@/schemas/schedule";
import type { ScheduleFilterOption } from "@/components/shared/ScheduleFilterToolbar";

/**
 * Shared filter contract used by Admin, Student, and Proctor schedule sections.
 *
 * Adding a new filter here automatically:
 *   - extends the toolbar (via `fields`)
 *   - extends the active filter badge row (via `badges`)
 *   - participates in `matches`, `reset`, and `activeCount`
 *
 * Consumers only need to wire `matches`/`compare` into their list rendering.
 */

export const ALL = "__all__";

export const STATUS_ALL = "all";

export const PHASE_ALL = "all";
export const PHASE_UPCOMING = "upcoming";
export const PHASE_COMPLETED = "completed";

const STATUS_OPTIONS: ScheduleFilterOption[] = [
  { value: STATUS_ALL, label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export const PUBLISHED_ASSIGNMENT_STATUS_OPTIONS: ScheduleFilterOption[] = [
  { value: STATUS_ALL, label: "All statuses" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PHASE_OPTIONS: ScheduleFilterOption[] = [
  { value: PHASE_ALL, label: "All exams" },
  { value: PHASE_UPCOMING, label: "Upcoming" },
  { value: PHASE_COMPLETED, label: "Completed" },
];

const SORT_OPTIONS: ScheduleFilterOption[] = [
  { value: "nearest", label: "Nearest first" },
  { value: "latest", label: "Latest first" },
];

export type AssignmentFilterMatchOverrides = {
  /** For grouped rows (e.g. admin) that may span multiple rooms. */
  roomIds?: string[];
  /** For grouped rows that may span multiple centers. */
  centerIds?: string[];
  /** For grouped rows that may span multiple proctors. */
  proctorIds?: string[];
  /** Precomputed search index for the row (covers grouped members). */
  searchIndex?: string;
};

export type AssignmentScheduleFiltersOptions = {
  defaultSort?: "nearest" | "latest";
  statusOptions?: ScheduleFilterOption[];
  includePhaseFilter?: boolean;
  searchDebounceMs?: number;
};

export type AssignmentScheduleFilterBadge = {
  key: string;
  label: string;
  value: string;
  onRemove: () => void;
};

const getAssignmentTime = (assignment: ScheduleAssignment) => {
  const value = assignment.timeSlot?.startTime ?? assignment.timeSlot?.date;
  const time = value ? new Date(value).getTime() : Number.NaN;
  return Number.isFinite(time) ? time : null;
};

const getAssignmentDateKey = (assignment: ScheduleAssignment) => {
  const value = assignment.timeSlot?.date ?? assignment.timeSlot?.startTime;
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};

const getTimeSlotKey = (assignment: ScheduleAssignment) => {
  return formatTimeSlotLabel(assignment.timeSlot, "") || null;
};

const buildAssignmentSearchIndex = (assignment: ScheduleAssignment) =>
  buildSearchIndex(
    assignment.exam?.courseOffering?.course?.code,
    assignment.exam?.courseOffering?.course?.title,
    assignment.exam?.courseOffering?.course?.name,
    assignment.exam?.courseOffering?.semester?.name,
    assignment.exam?.status,
    assignment.schedule?.name,
    assignment.schedule?.examPeriod,
    assignment.room?.name,
    assignment.room?.center?.name,
    assignment.proctor?.user?.name,
    assignment.proctor?.user?.email,
    getAssignmentDateKey(assignment),
    getTimeSlotKey(assignment)
  );

export type UseAssignmentScheduleFiltersResult = {
  state: {
    query: string;
    semester: string;
    course: string;
    center: string;
    room: string;
    timeSlot: string;
    proctor: string;
    status: string;
    phase: string;
    examDate: string;
    startDate: string;
    endDate: string;
    sort: "nearest" | "latest";
    debouncedQuery: string;
  };
  setters: {
    setQuery: (value: string) => void;
    setSemester: (value: string) => void;
    setCourse: (value: string) => void;
    setCenter: (value: string) => void;
    setRoom: (value: string) => void;
    setTimeSlot: (value: string) => void;
    setProctor: (value: string) => void;
    setStatus: (value: string) => void;
    setPhase: (value: string) => void;
    setExamDate: (value: string) => void;
    setStartDate: (value: string) => void;
    setEndDate: (value: string) => void;
    setSort: (value: "nearest" | "latest") => void;
  };
  options: {
    semesters: ScheduleFilterOption[];
    courses: ScheduleFilterOption[];
    centers: ScheduleFilterOption[];
    rooms: ScheduleFilterOption[];
    timeSlots: ScheduleFilterOption[];
    proctors: ScheduleFilterOption[];
  };
  fields: Array<{
    key: string;
    label: string;
    value: string;
    placeholder: string;
    options: ScheduleFilterOption[];
    onChange: (value: string) => void;
  }>;
  badges: AssignmentScheduleFilterBadge[];
  activeCount: number;
  hasActiveFilters: boolean;
  matches: (assignment: ScheduleAssignment, overrides?: AssignmentFilterMatchOverrides) => boolean;
  compare: (left: ScheduleAssignment, right: ScheduleAssignment) => number;
  reset: () => void;
  searchIndex: (assignment: ScheduleAssignment) => string;
};

export function useAssignmentScheduleFilters(
  assignments: ScheduleAssignment[],
  nowMs: number,
  pageOptions: AssignmentScheduleFiltersOptions = {}
): UseAssignmentScheduleFiltersResult {
  const defaultSort = pageOptions.defaultSort ?? "nearest";
  const statusOptions = pageOptions.statusOptions ?? STATUS_OPTIONS;
  const includePhaseFilter = pageOptions.includePhaseFilter ?? true;
  const searchDebounceMs = pageOptions.searchDebounceMs ?? 0;

  const [query, setQuery] = React.useState("");
  const [semester, setSemester] = React.useState(ALL);
  const [course, setCourse] = React.useState(ALL);
  const [center, setCenter] = React.useState(ALL);
  const [room, setRoom] = React.useState(ALL);
  const [timeSlot, setTimeSlot] = React.useState(ALL);
  const [proctor, setProctor] = React.useState(ALL);
  const [status, setStatus] = React.useState<string>(STATUS_ALL);
  const [phase, setPhase] = React.useState<string>(PHASE_ALL);
  const [examDate, setExamDate] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [sort, setSort] = React.useState<"nearest" | "latest">(defaultSort);
  const [debouncedQuery, setDebouncedQuery] = React.useState("");

  React.useEffect(() => {
    if (searchDebounceMs <= 0 || query.trim().length === 0) {
      setDebouncedQuery(query);
      return;
    }

    const handle = window.setTimeout(() => setDebouncedQuery(query), searchDebounceMs);
    return () => window.clearTimeout(handle);
  }, [query, searchDebounceMs]);

  const options = React.useMemo(() => {
    const semestersMap = new Map<string, string>();
    const coursesMap = new Map<string, string>();
    const centersMap = new Map<string, string>();
    const roomsMap = new Map<string, string>();
    const timeSlotsMap = new Map<string, string>();
    const proctorsMap = new Map<string, string>();

    for (const a of assignments) {
      const sem = a.exam?.courseOffering?.semester;
      if (sem?.id) semestersMap.set(sem.id, sem.name ?? sem.id);

      const c = a.exam?.courseOffering?.course;
      if (c?.id) {
        const title = c.title ?? c.name ?? "";
        const label = c.code ? (title ? `${c.code} — ${title}` : c.code) : title || c.id;
        coursesMap.set(c.id, label);
      }

      const cen = a.room?.center;
      if (cen?.id) centersMap.set(cen.id, cen.name);

      const r = a.room;
      if (r?.id) {
        const label = r.center?.name ? `${r.name} • ${r.center.name}` : r.name;
        roomsMap.set(r.id, label);
      }

      const tsKey = getTimeSlotKey(a);
      if (a.timeSlotId && tsKey) timeSlotsMap.set(a.timeSlotId, tsKey);

      const p = a.proctor;
      if (p?.id) proctorsMap.set(p.id, p.user?.name ?? p.user?.email ?? p.id);
    }

    const sortPairs = (m: Map<string, string>) =>
      Array.from(m.entries())
        .sort((l, r) => l[1].localeCompare(r[1]))
        .map(([value, label]) => ({ value, label }));

    return {
      semesters: sortPairs(semestersMap),
      courses: sortPairs(coursesMap),
      centers: sortPairs(centersMap),
      rooms: sortPairs(roomsMap),
      timeSlots: Array.from(timeSlotsMap.entries())
        .sort((l, r) => l[1].localeCompare(r[1]))
        .map(([value, label]) => ({ value, label })),
      proctors: sortPairs(proctorsMap),
    };
  }, [assignments]);

  const availableStatusOptions = statusOptions;

  React.useEffect(() => {
    if (status !== STATUS_ALL && !availableStatusOptions.some((option) => option.value === status)) {
      setStatus(STATUS_ALL);
    }
  }, [availableStatusOptions, status]);

  const matches = React.useCallback(
    (assignment: ScheduleAssignment, overrides: AssignmentFilterMatchOverrides = {}) => {
      if (semester !== ALL && assignment.exam?.courseOffering?.semester?.id !== semester) return false;
      if (course !== ALL && assignment.exam?.courseOffering?.course?.id !== course) return false;

      const centerIds = overrides.centerIds ?? (assignment.room?.center?.id ? [assignment.room.center.id] : []);
      if (center !== ALL && !centerIds.includes(center)) return false;

      const roomIds = overrides.roomIds ?? (assignment.roomId ? [assignment.roomId] : []);
      if (room !== ALL && !roomIds.includes(room)) return false;

      if (timeSlot !== ALL && assignment.timeSlotId !== timeSlot) return false;

      const proctorIds = overrides.proctorIds ?? (assignment.proctor?.id ? [assignment.proctor.id] : []);
      if (proctor !== ALL && !proctorIds.includes(proctor)) return false;

      if (status !== STATUS_ALL && assignment.exam?.status !== status) return false;

      const time = getAssignmentTime(assignment);
      if (phase === PHASE_UPCOMING && (time == null || time < nowMs)) return false;
      if (phase === PHASE_COMPLETED && (time == null || time >= nowMs)) return false;

      const dKey = getAssignmentDateKey(assignment);
      if (examDate && dKey !== examDate) return false;
      if (startDate && (!dKey || dKey < startDate)) return false;
      if (endDate && (!dKey || dKey > endDate)) return false;

      const index = overrides.searchIndex ?? buildAssignmentSearchIndex(assignment);
      return matchesSmartSearch(index, debouncedQuery);
    },
    [semester, course, center, room, timeSlot, proctor, status, phase, examDate, startDate, endDate, debouncedQuery, nowMs]
  );

  const compare = React.useCallback(
    (left: ScheduleAssignment, right: ScheduleAssignment) => {
      const lt = getAssignmentTime(left) ?? Number.MAX_SAFE_INTEGER;
      const rt = getAssignmentTime(right) ?? Number.MAX_SAFE_INTEGER;
      return sort === "latest" ? rt - lt : lt - rt;
    },
    [sort]
  );

  const reset = React.useCallback(() => {
    setQuery("");
    setSemester(ALL);
    setCourse(ALL);
    setCenter(ALL);
    setRoom(ALL);
    setTimeSlot(ALL);
    setProctor(ALL);
    setStatus(STATUS_ALL);
    setPhase(PHASE_ALL);
    setExamDate("");
    setStartDate("");
    setEndDate("");
    setSort(defaultSort);
  }, [defaultSort]);

  const fields = React.useMemo(
    () => [
      {
        key: "semester",
        label: "Semester",
        value: semester,
        placeholder: "All semesters",
        options: [{ value: ALL, label: "All semesters" }, ...options.semesters],
        onChange: setSemester,
      },
      {
        key: "course",
        label: "Course",
        value: course,
        placeholder: "All courses",
        options: [{ value: ALL, label: "All courses" }, ...options.courses],
        onChange: setCourse,
      },
      {
        key: "center",
        label: "Center",
        value: center,
        placeholder: "All centers",
        options: [{ value: ALL, label: "All centers" }, ...options.centers],
        onChange: setCenter,
      },
      {
        key: "room",
        label: "Room",
        value: room,
        placeholder: "All rooms",
        options: [{ value: ALL, label: "All rooms" }, ...options.rooms],
        onChange: setRoom,
      },
      {
        key: "timeSlot",
        label: "Time Slot",
        value: timeSlot,
        placeholder: "All time slots",
        options: [{ value: ALL, label: "All time slots" }, ...options.timeSlots],
        onChange: setTimeSlot,
      },
      {
        key: "proctor",
        label: "Proctor",
        value: proctor,
        placeholder: "All proctors",
        options: [{ value: ALL, label: "All proctors" }, ...options.proctors],
        onChange: setProctor,
      },
      ...(availableStatusOptions.length > 1
        ? [{
            key: "status",
            label: "Status",
            value: status,
            placeholder: "All statuses",
            options: availableStatusOptions,
            onChange: setStatus,
          }]
        : []),
      ...(includePhaseFilter
        ? [{
            key: "phase",
            label: "Phase",
            value: phase,
            placeholder: "All exams",
            options: PHASE_OPTIONS,
            onChange: setPhase,
          }]
        : []),
      {
        key: "sort",
        label: "Sort",
        value: sort,
        placeholder: "Nearest first",
        options: SORT_OPTIONS,
        onChange: (value: string) => setSort(value === "latest" ? "latest" : "nearest"),
      },
    ],
    [availableStatusOptions, center, course, includePhaseFilter, options, phase, proctor, room, semester, sort, status, timeSlot]
  );

  const labelFor = (opts: ScheduleFilterOption[], value: string) =>
    opts.find((o) => o.value === value)?.label ?? value;

  const badges = React.useMemo<AssignmentScheduleFilterBadge[]>(() => {
    const list: AssignmentScheduleFilterBadge[] = [];
    if (query.trim()) list.push({ key: "query", label: "Search", value: query.trim(), onRemove: () => setQuery("") });
    if (semester !== ALL) list.push({ key: "semester", label: "Semester", value: labelFor(options.semesters, semester), onRemove: () => setSemester(ALL) });
    if (course !== ALL) list.push({ key: "course", label: "Course", value: labelFor(options.courses, course), onRemove: () => setCourse(ALL) });
    if (center !== ALL) list.push({ key: "center", label: "Center", value: labelFor(options.centers, center), onRemove: () => setCenter(ALL) });
    if (room !== ALL) list.push({ key: "room", label: "Room", value: labelFor(options.rooms, room), onRemove: () => setRoom(ALL) });
    if (timeSlot !== ALL) list.push({ key: "timeSlot", label: "Time slot", value: labelFor(options.timeSlots, timeSlot), onRemove: () => setTimeSlot(ALL) });
    if (proctor !== ALL) list.push({ key: "proctor", label: "Proctor", value: labelFor(options.proctors, proctor), onRemove: () => setProctor(ALL) });
    if (status !== STATUS_ALL) list.push({ key: "status", label: "Status", value: labelFor(availableStatusOptions, status), onRemove: () => setStatus(STATUS_ALL) });
    if (includePhaseFilter && phase !== PHASE_ALL) list.push({ key: "phase", label: "Phase", value: labelFor(PHASE_OPTIONS, phase), onRemove: () => setPhase(PHASE_ALL) });
    if (examDate) list.push({ key: "examDate", label: "Exam date", value: examDate, onRemove: () => setExamDate("") });
    if (startDate) list.push({ key: "startDate", label: "From", value: startDate, onRemove: () => setStartDate("") });
    if (endDate) list.push({ key: "endDate", label: "To", value: endDate, onRemove: () => setEndDate("") });
    if (sort !== defaultSort) list.push({ key: "sort", label: "Sort", value: labelFor(SORT_OPTIONS, sort), onRemove: () => setSort(defaultSort) });
    return list;
  }, [availableStatusOptions, center, course, defaultSort, endDate, examDate, includePhaseFilter, options, phase, proctor, query, room, semester, sort, startDate, status, timeSlot]);

  const activeCount = badges.length;
  const hasActiveFilters = activeCount > 0;

  return {
    state: { query, semester, course, center, room, timeSlot, proctor, status, phase, examDate, startDate, endDate, sort, debouncedQuery },
    setters: {
      setQuery,
      setSemester,
      setCourse,
      setCenter,
      setRoom,
      setTimeSlot,
      setProctor,
      setStatus,
      setPhase,
      setExamDate,
      setStartDate,
      setEndDate,
      setSort,
    },
    options,
    fields,
    badges,
    activeCount,
    hasActiveFilters,
    matches,
    compare,
    reset,
    searchIndex: buildAssignmentSearchIndex,
  };
}
