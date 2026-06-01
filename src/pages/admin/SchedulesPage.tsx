import { memo, startTransition, useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useHighlightRow } from "../../hooks/common/useHighlightRow";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CalendarRange,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  DoorOpen,
  Eye,
  GitBranch,
  GraduationCap,
  LayoutList,
  List,
  Loader2,
  Mail,
  MapPin,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
  Wand2,
  Wrench,
  X,
} from "lucide-react";

import {
  useDeleteSchedule,
  useGenerateSchedule,
  usePrepareScheduling,
  useOptimizeScheduling,
  usePublishSchedule,
  useUnpublishSchedule,
  useSchedule,
  scheduleKeys,
  useSchedules,
  useUpdateSchedule,
  useValidateSchedulingInput,
} from "../../hooks/schedules/useSchedules";
import { useSemesters } from "../../hooks/semesters/useSemesters";
import { useRooms } from "../../hooks/rooms/useRooms";
import { useProctors } from "../../hooks/proctors/useProctors";
import { useTimeSlots } from "../../hooks/timeSlots/useTimeSlots";
import {
  scheduleAssignmentKeys,
  useAssignmentsPage,
  useDeleteAssignment,
  useUpdateAssignment,
} from "../../hooks/assignments/useAssignments";
import type {
  Schedule,
  ScheduleAssignment,
} from "../../schemas/schedule";
import { fetchSchedules } from "../../api/schedulesApi";
import type { ValidateSchedulingResult } from "../../api/schedulingApi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { AsyncSearchSelect } from "../../components/ui/async-search-select";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import { Skeleton, TableSkeletonRows } from "../../components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../../components/ui/sheet";
import { StickyActionBar } from "../../components/common/StickyActionBar";
import { EmptyState } from "../../components/shared/EmptyState";
import { DeleteConfirmModal } from "../../components/shared/DeleteConfirmModal";
import { BulkDeleteToolbar, RowSelectCheckbox } from "../../components/shared/BulkTableActions";
import { useBulkDelete } from "../../hooks/common/useBulkDelete";
import { invalidateScheduleQuerySync } from "../../lib/scheduleQuerySync";
import { ScheduleFilterToolbar } from "../../components/shared/ScheduleFilterToolbar";
import { ActiveFilterBadges } from "../../components/shared/ActiveFilterBadges";
import { ALL, useAssignmentScheduleFilters } from "../../hooks/assignments/useAssignmentScheduleFilters";
import { PageSpinner } from "../../components/shared/PageSpinner";
import { useDelayedLoading } from "../../hooks/common/useDelayedLoading";
import { useDetailListPagination } from "../../hooks/common/useDetailListPagination";
import { useVirtualRows } from "../../hooks/common/useVirtualRows";
import { useSchedulePdfDownload } from "../../hooks/schedulePdf/useSchedulePdfDownload";
import { downloadAdminSchedulePdf } from "../../api/schedulePdf.api";
import { Download } from "lucide-react";
import { getApiErrorMessage, isAuthExpiredError } from "../../lib/apiError";
import { formatTimeSlotLabel } from "../../lib/dateTime";
import { getScheduleAssignmentCount } from "../../lib/scheduleCounts";
import { cn } from "../../lib/utils";
import { buildSearchIndex } from "../../lib/smartSearch";

// -------------------- helpers --------------------

const SELECTED_SCHEDULE_STORAGE_KEY = "selected_schedule_id";

const formatTime = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
};

const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
};

const dateKey = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const inferExamPeriod = (schedule?: Schedule | null) => {
  const existing = schedule?.examPeriod?.trim();
  if (existing) return existing;
  const name = schedule?.name?.toLowerCase() ?? "";
  if (name.includes("midterm") || name.includes("mid-term")) return "Midterm";
  if (name.includes("final")) return "Final";
  return "";
};

const getScheduleSyncMetadata = (schedule?: Schedule | null) => {
  const scheduleSync = schedule?.algorithmMetadata && typeof schedule.algorithmMetadata === "object"
    ? (schedule.algorithmMetadata as Record<string, unknown>).scheduleSync
    : null;

  return scheduleSync && typeof scheduleSync === "object"
    ? scheduleSync as Record<string, unknown>
    : null;
};

const getScheduleSyncIssues = (schedule?: Schedule | null) => {
  const scheduleSync = getScheduleSyncMetadata(schedule);
  const issues = scheduleSync?.issues;
  return issues && typeof issues === "object"
    ? issues as Record<string, unknown>
    : null;
};

const getIssueCount = (issues: Record<string, unknown> | null, key: string) => {
  const value = issues?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
};

const isAutoUnpublishedSchedule = (schedule?: Schedule | null) => {
  const scheduleSync = getScheduleSyncMetadata(schedule);
  return Boolean(
    schedule &&
    !schedule.isFinal &&
    scheduleSync?.autoUnpublished === true
  );
};

const getAutoUnpublishReasonLines = (schedule?: Schedule | null) => {
  const issues = getScheduleSyncIssues(schedule);
  if (!issues) return [] as string[];

  const reasons = [
    { key: "missingExamAssignments", label: "missing exam assignments" },
    { key: "invalidRoomAssignments", label: "invalid room allocations" },
    { key: "invalidProctorAvailability", label: "proctor availability conflicts" },
    { key: "invalidSlotWindowAssignments", label: "invalid time slots" },
    { key: "requiredProctorShortage", label: "missing required proctors" },
    { key: "derivedConflicts", label: "schedule conflicts" },
    { key: "multiSemesterAssignments", label: "cross-semester assignments" },
    { key: "emptySchedule", label: "no remaining assignments" },
  ]
    .map(({ key, label }) => ({ count: getIssueCount(issues, key), label }))
    .filter((item) => item.count > 0)
    .slice(0, 3)
    .map((item) => `${item.count} ${item.label}`);

  return reasons;
};

const getAutoUnpublishSummary = (schedule?: Schedule | null) => {
  const reasons = getAutoUnpublishReasonLines(schedule);
  if (reasons.length === 0) {
    return "Upstream changes invalidated this published schedule.";
  }
  return `Upstream changes invalidated this published schedule: ${reasons.join(", ")}.`;
};

const isSchedulePublishBlocked = (schedule?: Schedule | null, activeSemesterId?: string) => {
  const scheduleSemesterId = schedule?.assignments?.[0]?.exam?.courseOffering?.semester?.id;
  return !!schedule && (!activeSemesterId || !scheduleSemesterId || scheduleSemesterId !== activeSemesterId);
};

const PRESET_EXAM_PERIODS = ["Midterm", "Final"];

const PublishScheduleDialog = ({
  open,
  schedule,
  isPublishing,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  schedule: Schedule | null;
  isPublishing: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (examPeriod: string) => void;
}) => {
  const scheduleKey = open ? schedule?.id ?? "__new__" : "__closed__";
  const [examPeriodState, setExamPeriodState] = useState({ scheduleKey: "", value: "" });
  const examPeriod = examPeriodState.scheduleKey === scheduleKey
    ? examPeriodState.value
    : inferExamPeriod(schedule);
  const setExamPeriod = (value: string) => setExamPeriodState({ scheduleKey, value });

  const trimmedExamPeriod = examPeriod.trim();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedExamPeriod) return;
    onConfirm(trimmedExamPeriod);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isPublishing && onOpenChange(next)}>
      <DialogContent className="overflow-hidden rounded-none border border-zinc-200/80 bg-white p-0 shadow-xl shadow-zinc-950/15 dark:border-zinc-800/80 dark:bg-zinc-950 dark:shadow-black/50 sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b border-zinc-200/70 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),rgba(244,244,245,0.96)_45%,rgba(228,228,231,0.88))] px-6 py-5 text-left dark:border-zinc-800/80 dark:bg-[radial-gradient(circle_at_top_left,rgba(39,39,42,0.96),rgba(24,24,27,0.98)_44%,rgba(9,9,11,0.98))]">
            <div className="flex items-start gap-3">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-none border border-zinc-200 bg-white text-zinc-950 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                <CalendarRange className="size-5" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  Publish Schedule
                </DialogTitle>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Choose the exam period for this published schedule. Each semester can publish up to two schedules across different periods.
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 px-6 py-5">
            <div className="rounded-none border border-zinc-200 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/70">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                Schedule
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-zinc-950 dark:text-zinc-100">
                {schedule?.name ?? "Selected schedule"}
              </p>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="publish-exam-period" className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                Exam Period
              </Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_EXAM_PERIODS.map((period) => {
                  const isActive = trimmedExamPeriod.toLowerCase() === period.toLowerCase();
                  return (
                    <Button
                      key={period}
                      type="button"
                      variant="outline"
                      onClick={() => setExamPeriod(period)}
                      className={cn(
                        "h-9 rounded-none border-zinc-200 px-3 text-sm font-semibold shadow-sm dark:border-zinc-700",
                        isActive
                          ? "border-zinc-950 bg-zinc-950 text-white hover:bg-zinc-900 hover:text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
                          : "bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                      )}
                    >
                      {period}
                    </Button>
                  );
                })}
              </div>
              <Input
                id="publish-exam-period"
                value={examPeriod}
                onChange={(event) => setExamPeriod(event.target.value)}
                placeholder="e.g. Midterm or Final"
                autoFocus
                className="h-11 rounded-none border-zinc-200 bg-white shadow-sm focus-visible:ring-zinc-300/60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:ring-zinc-700"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Use a clear label like Midterm or Final. Publishing blocks duplicate periods within the same semester.
              </p>
            </div>
          </div>

          <DialogFooter className="border-t border-zinc-200/70 bg-zinc-50/70 px-6 py-4 dark:border-zinc-800/80 dark:bg-zinc-900/70 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPublishing}
              className="h-10 rounded-none border-zinc-200 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!trimmedExamPeriod || isPublishing}
              className="h-10 rounded-none border-0 bg-zinc-950 text-white hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {isPublishing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle2 className="mr-2 size-4" />}
              Publish Schedule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const StatusBadge = ({ schedule }: { schedule: Schedule }) =>
  schedule.isFinal ? (
    <span className="inline-flex items-center gap-1 rounded-none border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      <CheckCircle2 className="size-3.5" />
      Published
    </span>
  ) : isAutoUnpublishedSchedule(schedule) ? (
    <span className="inline-flex items-center gap-1 rounded-none border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
      <AlertTriangle className="size-3.5" />
      Auto-unpublished
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-none border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
      Draft
    </span>
  );

const LockedActionTooltip = ({
  isLocked,
  children,
}: {
  isLocked?: boolean;
  children: React.ReactNode;
}) => {
  if (!isLocked) return <>{children}</>;
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="block cursor-not-allowed">
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent side="left" className="text-xs bg-zinc-950 text-white rounded-none border-0 max-w-50 text-center">
          Published schedules are locked. Return to Draft to edit.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// -------------------- Schedule Versions Table --------------------

const ScheduleVersionsTable = memo(({
  schedules,
  activeId,
  countOverrides,
  onSelect,
  onRequestPublish,
  onDeleted,
  isLoading,
  isPublishing,
  onRefetch,
  activeSemesterId,
}: {
  schedules: Schedule[];
  activeId?: string | null;
  countOverrides?: Record<string, { assignments?: number }>;
  onSelect: (id: string) => void;
  onRequestPublish: (schedule: Schedule) => void;
  onDeleted: (deletedId: string) => void;
  isLoading: boolean;
  isPublishing: boolean;
  onRefetch?: () => void;
  activeSemesterId?: string;
}) => {
  const deleteMutation = useDeleteSchedule();
  const updateMutation = useUpdateSchedule();
  const unpublishMutation = useUnpublishSchedule();
  const { download: downloadRowPdf, isDownloading: isRowPdfDownloading } = useSchedulePdfDownload();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<Schedule | null>(null);
  const [newName, setNewName] = useState("");

  const bulkDelete = useBulkDelete({
    entityName: "schedule version",
    entityNamePlural: "schedule versions",
    deleteItem: async (id) => {
      await deleteMutation.mutateAsync(id);
      onDeleted(id);
    },
  });

  const handleDownloadRowPdf = (id: string) => {
    void downloadRowPdf(() => downloadAdminSchedulePdf(id), {
      startTitle: 'Generating schedule PDF',
      successTitle: 'Schedule PDF downloaded',
      errorTitle: 'Failed to generate PDF',
    });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setConfirmDeleteId(null);
        onDeleted(id);
        onRefetch?.();
      },
    });
  };

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !newName.trim()) return;
    updateMutation.mutate(
      { id: renameTarget.id, data: { name: newName.trim() } },
      { 
        onSuccess: () => {
          setRenameTarget(null);
          onRefetch?.();
        }
      }
    );
  };

  return (
    <>
      <div className="mb-4 flex items-center gap-2.5">
        <span className="inline-flex size-7 items-center justify-center rounded-none bg-zinc-950 text-white shadow-sm">
          <GitBranch className="size-4" />
        </span>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-950">
            Schedule Versions
          </h2>
          <p className="text-[11px] text-zinc-500 leading-tight">
            Compare and manage multiple schedule versions
          </p>
        </div>
      </div>

      <BulkDeleteToolbar
        selectedCount={bulkDelete.selectedCount}
        totalCount={schedules.filter((s) => !s.isFinal).length}
        isDeleting={bulkDelete.isDeleting}
        onClear={bulkDelete.clearSelection}
        onDelete={() => bulkDelete.setIsConfirmOpen(true)}
        className="mb-4"
      />

      <Card className="rounded-none border border-zinc-200/60 bg-white shadow-sm mb-6 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-zinc-200/70 bg-zinc-50/60 hover:bg-zinc-50/60">
                <TableHead className="h-9 w-10 pl-3">
                  <RowSelectCheckbox
                    checked={
                      schedules.filter((s) => !s.isFinal).length > 0 &&
                      schedules.filter((s) => !s.isFinal).every((s) => bulkDelete.selectedIds.has(s.id))
                    }
                    indeterminate={
                      bulkDelete.selectedCount > 0 &&
                      !schedules.filter((s) => !s.isFinal).every((s) => bulkDelete.selectedIds.has(s.id))
                    }
                    label="Select all draft schedule versions"
                    onChange={(checked) => bulkDelete.toggleAll(schedules.filter((s) => !s.isFinal), checked)}
                  />
                </TableHead>
                <TableHead className="h-9 pl-5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Name
                </TableHead>
                <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Created
                </TableHead>
                <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Status
                </TableHead>
                <TableHead className="h-9 text-center text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Assignments
                </TableHead>
                <TableHead className="h-9 pr-4 text-right text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-zinc-100">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j} className="py-3 pl-5">
                        <Skeleton className="h-4 w-full max-w-28" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : schedules.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-sm text-zinc-500"
                  >
                    <List className="mx-auto mb-2 size-6 text-zinc-300" />
                    No schedule versions yet.
                  </TableCell>
                </TableRow>
              ) : (
                schedules.map((s) => {
                  const isActive = s.id === activeId;
                  const override = countOverrides?.[s.id];
                  const assignmentsCount =
                    override?.assignments ??
                    getScheduleAssignmentCount(s);
                  return (
                    <TableRow
                      key={s.id}
                      data-schedule-id={s.id}
                      onClick={() => onSelect(s.id)}
                      className={cn(
                        "border-b border-zinc-200/40 transition-all duration-200 cursor-pointer hover:bg-zinc-50/60",
                        isActive && "bg-zinc-50"
                      )}
                    >
                      <TableCell className="w-10 pl-3" onClick={(e) => e.stopPropagation()}>
                        <RowSelectCheckbox
                          checked={bulkDelete.selectedIds.has(s.id)}
                          disabled={!!s.isFinal}
                          label={`Select ${s.name}`}
                          onChange={(checked) => bulkDelete.toggleSelected(s.id, checked)}
                        />
                      </TableCell>
                      <TableCell className="pl-5 py-3">
                        <div className="flex items-center gap-2">
                          {isActive && (
                            <span className="size-1.5 rounded-full bg-zinc-950 shrink-0" />
                          )}
                          <span
                            className={cn(
                              "text-sm font-semibold truncate max-w-50",
                              isActive ? "text-zinc-950" : "text-zinc-700"
                            )}
                          >
                            {s.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-xs text-zinc-500 tabular-nums">
                        {formatDate(s.createdAt)}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="space-y-1">
                          <StatusBadge schedule={s} />
                          {isAutoUnpublishedSchedule(s) && (
                            <p className="max-w-48 text-[11px] leading-4 text-rose-700/80">
                              {getAutoUnpublishSummary(s)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <span className="inline-flex items-center justify-center min-w-8 rounded-none border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-semibold text-zinc-700 tabular-nums">
                          {assignmentsCount}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 pr-4 text-right" onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {!isActive ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onSelect(s.id)}
                              className="h-8 rounded-none px-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                            >
                              <Eye className="size-3.5 mr-1" />
                              View
                            </Button>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 text-[11px] uppercase tracking-wide font-bold text-zinc-500">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="ml-1 size-8 rounded-none text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
                              >
                                <MoreHorizontal className="size-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-none w-48">
                              <TooltipProvider delayDuration={150}>
                              <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-zinc-500 font-semibold px-3 py-1.5">
                                Actions
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {!s.isFinal ? (
                                (() => {
                                  const sSemesterInactive = isSchedulePublishBlocked(s, activeSemesterId);
                                  return (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="block">
                                          <DropdownMenuItem
                                            disabled={isPublishing || sSemesterInactive}
                                            onClick={() => onRequestPublish(s)}
                                            className="cursor-pointer px-3 py-2 text-sm font-medium text-emerald-700 focus:bg-emerald-50 focus:text-emerald-700"
                                          >
                                            <CheckCircle2 className="size-4 mr-2" />
                                            Publish
                                          </DropdownMenuItem>
                                        </span>
                                      </TooltipTrigger>
                                      {sSemesterInactive && (
                                        <TooltipContent side="left" className="text-xs bg-zinc-950 text-white rounded-none border-0">
                                          Semester inactive
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                  );
                                })()
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => unpublishMutation.mutate(s.id, {
                                    onSuccess: () => onRefetch?.()
                                  })}
                                  disabled={unpublishMutation.isPending}
                                  className="cursor-pointer px-3 py-2 text-sm font-medium text-zinc-700 focus:bg-zinc-50 focus:text-zinc-900"
                                >
                                  {unpublishMutation.isPending ? (
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                  ) : (
                                    <Wrench className="size-4 mr-2 text-zinc-400" />
                                  )}
                                  Return to Draft
                                </DropdownMenuItem>
                              )}

                              {s.isFinal && (
                                <DropdownMenuItem
                                  disabled={isRowPdfDownloading}
                                  onClick={() => handleDownloadRowPdf(s.id)}
                                  className="cursor-pointer px-3 py-2 text-sm font-medium text-zinc-700 focus:bg-zinc-50 focus:text-zinc-900"
                                >
                                  {isRowPdfDownloading ? (
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                  ) : (
                                    <Download className="size-4 mr-2 text-zinc-400" />
                                  )}
                                  Download PDF
                                </DropdownMenuItem>
                              )}

                              <LockedActionTooltip isLocked={!!s.isFinal}>
                                <DropdownMenuItem
                                  disabled={!!s.isFinal}
                                  onClick={(e) => {
                                    if (s.isFinal) return e.preventDefault();
                                    setRenameTarget(s);
                                    setNewName(s.name);
                                  }}
                                  className="cursor-pointer px-3 py-2 text-sm font-medium text-zinc-700 focus:bg-zinc-50 focus:text-zinc-900"
                                >
                                  <Pencil className="size-4 mr-2 text-zinc-400" />
                                  Rename
                                </DropdownMenuItem>
                              </LockedActionTooltip>

                              <DropdownMenuSeparator className="bg-zinc-100" />

                              <LockedActionTooltip isLocked={!!s.isFinal}>
                                <DropdownMenuItem
                                  disabled={!!s.isFinal}
                                  onClick={(e) => {
                                    if (s.isFinal) return e.preventDefault();
                                    setConfirmDeleteId(s.id);
                                  }}
                                  className="cursor-pointer px-3 py-2 text-sm font-medium text-rose-600 focus:bg-rose-50 focus:text-rose-600"
                                >
                                  <Trash2 className="size-4 mr-2" />
                                  Delete Version
                                </DropdownMenuItem>
                              </LockedActionTooltip>
                            </TooltipProvider>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog
        open={Boolean(confirmDeleteId)}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteId(null);
        }}
      >
        <DialogContent className="rounded-none max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Schedule Version?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-600">
            This will permanently delete the schedule version and all its assignments. This action
            cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="rounded-none h-10"
              onClick={() => setConfirmDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-none h-10 bg-rose-600 text-white hover:bg-rose-700 border-0"
              disabled={deleteMutation.isPending}
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="size-4 animate-spin mr-1" />
              ) : (
                <Trash2 className="size-4 mr-1" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
      <Dialog
        open={Boolean(renameTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRenameTarget(null);
            setNewName("");
          }
        }}
      >
        <DialogContent className="rounded-none max-w-md">
          <form onSubmit={handleRename}>
            <DialogHeader>
              <DialogTitle>Rename Schedule</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="schedule-name" className="text-xs uppercase tracking-wide text-zinc-500">
                Schedule Name
              </Label>
              <Input
                id="schedule-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                className="mt-1.5 rounded-none border-zinc-200"
                placeholder="e.g. Fall 2025 Draft"
              />
            </div>
            <DialogFooter className="mt-2 gap-2 sm:justify-end sm:space-x-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameTarget(null)}
                className="rounded-none h-10 border-zinc-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!newName.trim() || updateMutation.isPending}
                className="rounded-none h-10 bg-zinc-950 text-white hover:bg-zinc-900 border-0 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                ) : null}
                Save Name
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmModal
        open={bulkDelete.isConfirmOpen}
        title="Delete Schedule Versions?"
        description={`This will permanently delete ${bulkDelete.selectedCount} selected schedule version${bulkDelete.selectedCount === 1 ? "" : "s"} and all their assignments. This action cannot be undone.`}
        isLoading={bulkDelete.isDeleting}
        onCancel={() => bulkDelete.setIsConfirmOpen(false)}
        onConfirm={bulkDelete.confirmDelete}
      />
    </>
  );
});

const examStatusToneMap: Record<string, string> = {
  DRAFT: "border-amber-200 bg-amber-50 text-amber-700",
  REVIEW: "border-amber-200 bg-amber-50 text-amber-700",
  SCHEDULED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  IN_PROGRESS: "border-sky-200 bg-sky-50 text-sky-700",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  COMPLETED: "border-blue-200 bg-blue-50 text-blue-700",
  CANCELLED: "border-zinc-200 bg-zinc-50 text-zinc-600",
};

const DRAFT_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All statuses" },
] as const;

const PUBLISHED_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

// Single source of truth: assignments mirror the schedule-version status
// (draft schedule → DRAFT; published schedule → SCHEDULED unless the exam
// itself moved to COMPLETED or CANCELLED).
const getAssignmentDisplayStatus = ({
  status,
  isFinal,
}: {
  status?: string | null;
  isFinal?: boolean;
}) => {
  if (isFinal && (status === "COMPLETED" || status === "CANCELLED")) return status;
  return isFinal ? "SCHEDULED" : "DRAFT";
};

const ExamStatusBadge = ({
  status,
  variant = "default",
}: {
  status?: string | null;
  variant?: "default" | "pill";
}) => {
  if (!status) {
    return <span className="text-xs text-zinc-400">—</span>;
  }
  const displayStatus = status === "CONFLICT" ? "REVIEW" : status;
  const tone = examStatusToneMap[displayStatus] ?? "border-zinc-200 bg-zinc-50 text-zinc-700";
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        variant === "pill" ? "rounded-full" : "rounded-none",
        tone
      )}
    >
      {displayStatus}
    </span>
  );
};

const StatCard = ({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "blue" | "rose" | "emerald" | "violet";
}) => {
  const toneClasses: Record<typeof tone, string> = {
    blue: "bg-blue-50 text-blue-600",
    rose: "bg-rose-50 text-rose-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
  };
  return (
    <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{label}</p>
            <p className="text-3xl font-bold text-zinc-950 mt-2">{value}</p>
            <p className="text-xs text-zinc-500 mt-2">{hint}</p>
          </div>
          <div className={cn("p-2 rounded-none", toneClasses[tone])}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
 
// -------------------- Generate dialog — pipeline: prepare → validate → build draft → evaluate → optimize → re-evaluate → confirm → generate --------------------

type SemesterOption = {
  id: string;
  name: string;
  year?: number | null;
  startDate?: string | null;
  endDate?: string | null;
};

type PipelinePhase = "idle" | "preparing" | "validating" | "building-draft" | "evaluating" | "optimizing" | "re-evaluating" | "confirming" | "ready" | "failed" | "generating";
type PipelineStepStatus = "idle" | "active" | "complete" | "blocked";

type PipelineStep = {
  key: "prepare" | "validate" | "build-draft" | "evaluate" | "optimize" | "re-evaluate" | "confirm" | "generate";
  label: string;
  description: string;
  status: PipelineStepStatus;
};

const PIPELINE_STEP_META: Array<Pick<PipelineStep, "key" | "label" | "description">> = [
  {
    key: "prepare",
    label: "Loading Resources",
    description: "Loading scheduling resources...",
  },
  {
    key: "validate",
    label: "Candidate Selection",
    description: "Checking resource candidates...",
  },
  {
    key: "build-draft",
    label: "Build Draft",
    description: "Building feasible assignments...",
  },
  {
    key: "evaluate",
    label: "Constraint Evaluation",
    description: "Evaluating schedule constraints...",
  },
  {
    key: "optimize",
    label: "Optimization",
    description: "Optimizing soft constraints...",
  },
  {
    key: "re-evaluate",
    label: "Re-evaluate",
    description: "Re-evaluating optimized schedule...",
  },
  {
    key: "confirm",
    label: "Confirm",
    description: "Confirming valid draft...",
  },
  {
    key: "generate",
    label: "Saving Schedule",
    description: "Saving final conflict-free schedule...",
  },
];

const PREPARE_STAGE_DELAY_MS = 3000;
const VALIDATE_STAGE_DELAY_MS = 3000;
const EVALUATE_STAGE_DELAY_MS = 6000;
const OPTIMIZE_STAGE_DELAY_MS = 6000;
const RE_EVALUATE_STAGE_DELAY_MS = 6000;
const CONFIRM_STAGE_DELAY_MS = 6000;
const DIALOG_CLOSE_SETTLE_DELAY_MS = 360;

const GENERATION_BLOCKED_MESSAGE = "Schedule generation is currently blocked.";
const GENERATION_BLOCKED_DETAIL_FALLBACK = "No valid draft schedule can be generated with the current data and available resources. Review rooms, proctors, time slots, and semester dates, then try again.";

const getMetricNumber = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : 0);
const formatScore = (value: unknown) => `${Math.round(getMetricNumber(value))}%`;
const getOptimizationBeforeScore = (
  evaluationResult: ValidateSchedulingResult | undefined,
  optimizationResult: ValidateSchedulingResult | undefined,
) => getMetricNumber(
  optimizationResult?.optimization?.beforeScore
    ?? evaluationResult?.quality?.originalScore
    ?? evaluationResult?.quality?.optimizedScore
    ?? evaluationResult?.metrics?.qualityScore,
);
const getOptimizationAfterScore = (optimizationResult: ValidateSchedulingResult | undefined) =>
  getMetricNumber(
    optimizationResult?.optimization?.afterScore
      ?? optimizationResult?.quality?.optimizedScore
      ?? optimizationResult?.metrics?.qualityScore,
  );
const getDisplayedImprovementScore = (beforeScore: number, afterScore: number) => {
  return Math.round(afterScore) - Math.round(beforeScore);
};
const getQualityMetric = (
  evaluationResult: ValidateSchedulingResult | undefined,
  optimizationResult: ValidateSchedulingResult | undefined,
  key: string,
) => getMetricNumber(
  optimizationResult?.optimization?.qualityMetrics?.[key]
    ?? optimizationResult?.quality?.qualityMetrics?.[key]
    ?? evaluationResult?.quality?.qualityMetrics?.[key],
);
const getBeforeQualityMetric = (
  evaluationResult: ValidateSchedulingResult | undefined,
  optimizationResult: ValidateSchedulingResult | undefined,
  key: string,
) => getMetricNumber(
  optimizationResult?.optimization?.beforeQualityMetrics?.[key]
    ?? evaluationResult?.quality?.qualityMetrics?.[key],
);
const PRIMARY_QUALITY_AREAS = [
  "roomUtilization",
  "proctorWorkloadBalance",
  "studentSpacing",
  "examDistribution",
] as const;
type QualityStatus = "excellent" | "strong" | "needs-tuning" | "weak" | "critical";
const formatQualityArea = (area: string) => area
  .replace(/([A-Z])/g, " $1")
  .replace(/^./, (char) => char.toUpperCase());
const getQualityStatus = (value: number): QualityStatus => {
  if (value >= 85) return "excellent";
  if (value >= 70) return "strong";
  if (value >= 55) return "needs-tuning";
  if (value >= 35) return "weak";
  return "critical";
};
const deriveWeakAreas = (
  evaluationResult: ValidateSchedulingResult | undefined,
  optimizationResult: ValidateSchedulingResult | undefined,
) => {
  const fallbackWeakAreas =
    optimizationResult?.optimization?.weakAreas
    ?? optimizationResult?.quality?.weakAreas
    ?? evaluationResult?.quality?.weakAreas
    ?? [];

  const beforeQualityMetrics = optimizationResult?.optimization?.beforeQualityMetrics;

  const derived = PRIMARY_QUALITY_AREAS
    .map((area) => ({
      area,
      score: getMetricNumber(
        beforeQualityMetrics?.[area]
          ?? evaluationResult?.quality?.qualityMetrics?.[area]
      ),
    }))
    .filter((item) => {
      const status = getQualityStatus(item.score);
      return status === "critical" || status === "weak" || status === "needs-tuning";
    })
    .sort((left, right) => left.score - right.score);

  return derived.length > 0 ? derived : fallbackWeakAreas;
};
const getQualityDescriptor = (value: number) => {
  const status = getQualityStatus(value);
  if (status === "excellent") return "Excellent";
  if (status === "strong") return "Strong";
  if (status === "needs-tuning") return "Needs tuning";
  if (status === "weak") return "Weak";
  return "Critical";
};
const getQualityTone = (value: number) => {
  const status = getQualityStatus(value);
  if (status === "excellent") {
    return {
      shell: "border-emerald-200/80 bg-linear-to-br from-emerald-50 via-white to-emerald-100/70",
      badge: "border-emerald-200 bg-white text-emerald-700",
      score: "text-emerald-950",
      track: "bg-emerald-100",
      fill: "bg-linear-to-r from-emerald-500 to-emerald-400",
      glow: "shadow-[0_18px_40px_-24px_rgba(16,185,129,0.7)]",
    };
  }
  if (status === "strong") {
    return {
      shell: "border-sky-200/80 bg-linear-to-br from-sky-50 via-white to-indigo-50",
      badge: "border-sky-200 bg-white text-sky-700",
      score: "text-sky-950",
      track: "bg-sky-100",
      fill: "bg-linear-to-r from-sky-500 to-indigo-500",
      glow: "shadow-[0_18px_40px_-24px_rgba(59,130,246,0.55)]",
    };
  }
  if (status === "needs-tuning") {
    return {
      shell: "border-amber-200/80 bg-linear-to-br from-amber-50 via-white to-orange-50",
      badge: "border-amber-200 bg-white text-amber-700",
      score: "text-amber-950",
      track: "bg-amber-100",
      fill: "bg-linear-to-r from-amber-400 to-orange-400",
      glow: "shadow-[0_18px_40px_-24px_rgba(245,158,11,0.55)]",
    };
  }
  if (status === "weak") {
    return {
      shell: "border-orange-200/80 bg-linear-to-br from-orange-50 via-white to-rose-50",
      badge: "border-orange-200 bg-white text-orange-700",
      score: "text-orange-950",
      track: "bg-orange-100",
      fill: "bg-linear-to-r from-orange-500 to-rose-500",
      glow: "shadow-[0_18px_40px_-24px_rgba(249,115,22,0.55)]",
    };
  }
  return {
    shell: "border-rose-200/80 bg-linear-to-br from-rose-50 via-white to-pink-50",
    badge: "border-rose-200 bg-white text-rose-700",
    score: "text-rose-950",
    track: "bg-rose-100",
    fill: "bg-linear-to-r from-rose-500 to-pink-500",
    glow: "shadow-[0_18px_40px_-24px_rgba(244,63,94,0.55)]",
  };
};
const widthClassForPct = (value: number) => {
  if (value >= 95) return "w-full";
  if (value >= 90) return "w-11/12";
  if (value >= 80) return "w-4/5";
  if (value >= 75) return "w-3/4";
  if (value >= 66) return "w-2/3";
  if (value >= 60) return "w-3/5";
  if (value >= 50) return "w-1/2";
  if (value >= 40) return "w-2/5";
  if (value >= 33) return "w-1/3";
  if (value >= 25) return "w-1/4";
  if (value >= 20) return "w-1/5";
  if (value >= 10) return "w-[10%]";
  if (value > 0) return "w-[5%]";
  return "w-0";
};
const normalizeBlockingMessage = (message: string | null | undefined) => {
  if (!message) return GENERATION_BLOCKED_DETAIL_FALLBACK;

  if (/conflict-free schedule exists/i.test(message)) {
    return GENERATION_BLOCKED_DETAIL_FALLBACK;
  }

  return message
    .replace(/conflict-free/gi, "draft")
    .replace(/conflicts still exist/gi, "hard-constraint issues are still present")
    .replace(/conflicts remain/gi, "hard-constraint issues remain");
};
const getBlockingIssues = (result: ValidateSchedulingResult | undefined) => {
  if (!result) return [] as string[];
  return Object.values(result.errors ?? {}).flat().filter((issue): issue is string => Boolean(issue));
};
const getBlockingSuggestions = (result: ValidateSchedulingResult | undefined) => {
  const keys = Object.keys(result?.errors ?? {});
  const suggestions = new Set<string>();

  if (keys.includes("rooms")) suggestions.add("Increase usable room capacity or add additional available rooms.");
  if (keys.includes("proctors")) suggestions.add("Increase proctor coverage for the affected exam window.");
  if (keys.includes("timeSlots")) suggestions.add("Add more valid time slots inside the semester exam window.");
  if (keys.includes("courseOfferings") || keys.includes("enrollments")) suggestions.add("Complete missing course offering or enrollment data before generating.");
  if (keys.includes("studentOverlapRisks")) suggestions.add("Reduce overlapping demand by expanding available slots or balancing exam distribution.");

  return [...suggestions].slice(0, 3);
};

const ResourceStatCard = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) => (
  <div className="rounded-none border border-zinc-200 bg-linear-to-br from-white via-zinc-50/80 to-zinc-100/70 px-4 py-4 shadow-sm dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-900/80 dark:shadow-black/30">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="mt-2 text-3xl font-bold tabular-nums text-zinc-950 dark:text-zinc-50">{value}</p>
      </div>
      <span className="inline-flex size-10 items-center justify-center rounded-none border border-zinc-200 bg-white text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
        <Icon className="size-4" />
      </span>
    </div>
  </div>
);

const QualityMetricCard = ({ label, value, beforeValue }: { label: string; value: number; beforeValue?: number }) => (
  (() => {
    const tone = getQualityTone(value);
    const normalizedValue = Math.max(0, Math.min(100, Math.round(value)));
    const descriptor = getQualityDescriptor(value);
    const delta = beforeValue !== undefined ? Math.round(value) - Math.round(beforeValue) : null;

    return (
      <div className={cn("rounded-none border px-4 py-4", tone.shell, tone.glow)}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">{label}</p>
            <p className={cn("mt-2 text-3xl font-bold tabular-nums", tone.score)}>{formatScore(value)}</p>
          </div>
          {delta !== null && (
            <span className={cn(
              "mt-1 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums",
              delta > 0
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                : delta < 0
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
            )}>
              {delta > 0 ? `+${delta}` : delta === 0 ? "±0" : String(delta)}
            </span>
          )}
        </div>
        {delta !== null && beforeValue !== undefined && (
          <p className="mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
            Before: {Math.round(beforeValue)}%
          </p>
        )}
        <div className="mt-4 space-y-2">
          <div className={cn("h-2.5 overflow-hidden rounded-full", tone.track)}>
            <div className={cn("h-full rounded-full", tone.fill, widthClassForPct(normalizedValue))} />
          </div>
          <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            <span className={cn("uppercase tracking-wide", tone.score)}>{descriptor}</span>
            <span className="tabular-nums text-zinc-400 dark:text-zinc-500">{normalizedValue}/100</span>
          </div>
        </div>
      </div>
    );
  })()
);

const ScoreSummaryCard = ({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant: "draft" | "optimized" | "improvement";
}) => {
  const styles = {
    draft: {
      shell: "border-zinc-200 bg-linear-to-br from-white via-zinc-50/70 to-zinc-100/70 dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-900/80",
      eyebrow: "text-zinc-500 dark:text-zinc-400",
      value: "text-zinc-950 dark:text-zinc-50",
      caption: "text-zinc-500 dark:text-zinc-400",
      iconWrap: "bg-white text-zinc-700 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
    },
    optimized: {
      shell: "border-emerald-200 bg-linear-to-br from-emerald-50 via-white to-emerald-100/80 shadow-[0_18px_40px_-24px_rgba(16,185,129,0.65)] dark:border-emerald-900/70 dark:from-emerald-950/60 dark:via-zinc-950 dark:to-emerald-900/30 dark:shadow-black/30",
      eyebrow: "text-emerald-700 dark:text-emerald-300",
      value: "text-emerald-950 dark:text-emerald-100",
      caption: "text-emerald-800 dark:text-emerald-300",
      iconWrap: "bg-white text-emerald-700 border border-emerald-200 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
    improvement: {
      shell: "border-zinc-900 bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-800 text-white shadow-[0_18px_40px_-24px_rgba(24,24,27,0.8)]",
      eyebrow: "text-zinc-300",
      value: "text-white",
      caption: "text-zinc-300",
      iconWrap: "bg-white/10 text-white border border-white/10",
    },
  }[variant];

  const Icon = variant === "optimized" ? Sparkles : variant === "improvement" ? Wand2 : ShieldCheck;

  return (
    <div className={cn("rounded-none border px-4 py-4", styles.shell)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={cn("text-[10px] font-semibold uppercase tracking-[0.18em]", styles.eyebrow)}>{label}</p>
          <p className={cn("mt-2 text-3xl font-bold tabular-nums", styles.value)}>{value}</p>
        </div>
        <span className={cn("inline-flex size-10 items-center justify-center rounded-none", styles.iconWrap)}>
          <Icon className="size-4" />
        </span>
      </div>
    </div>
  );
};

const WeakAreaItem = ({ area, score, index }: { area: string; score: number; index: number }) => {
  const width = Math.max(8, Math.min(100, Math.round(score)));
  const descriptor = getQualityDescriptor(score);
  const stripeTone = [
    "from-amber-400 to-orange-400",
    "from-rose-400 to-pink-400",
    "from-sky-400 to-cyan-400",
    "from-violet-400 to-fuchsia-400",
  ][index % 4];

  return (
    <div className="rounded-none border border-zinc-200 bg-zinc-50/80 px-3 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-black/20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{formatQualityArea(area)}</p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{descriptor}</p>
          <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">Before optimization</p>
        </div>
        <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
          {formatScore(score)}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200/80 dark:bg-zinc-800">
        <div className={cn("h-full rounded-full bg-linear-to-r", stripeTone, widthClassForPct(width))} />
      </div>
    </div>
  );
};

const FinalStatCard = ({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "neutral" | "success" | "quality";
}) => {
  const styles = {
    neutral: {
      shell: "border-zinc-200 bg-linear-to-br from-white via-zinc-50/80 to-zinc-100/70 dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-900/80",
      label: "text-zinc-500 dark:text-zinc-400",
      value: "text-zinc-950 dark:text-zinc-50",
      icon: "border-zinc-200 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
    },
    success: {
      shell: "border-emerald-200 bg-linear-to-br from-emerald-50 via-white to-emerald-100/80 shadow-[0_18px_40px_-24px_rgba(16,185,129,0.55)] dark:border-emerald-900/70 dark:from-emerald-950/60 dark:via-zinc-950 dark:to-emerald-900/30 dark:shadow-black/30",
      label: "text-emerald-700 dark:text-emerald-300",
      value: "text-emerald-950 dark:text-emerald-100",
      icon: "border-emerald-200 bg-white text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
    quality: {
      shell: "border-sky-200 bg-linear-to-br from-sky-50 via-white to-indigo-50 shadow-[0_18px_40px_-24px_rgba(59,130,246,0.5)] dark:border-sky-900/70 dark:from-sky-950/50 dark:via-zinc-950 dark:to-indigo-950/40 dark:shadow-black/30",
      label: "text-sky-700 dark:text-sky-300",
      value: "text-sky-950 dark:text-sky-100",
      icon: "border-sky-200 bg-white text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
    },
  }[tone];

  return (
    <div className={cn("rounded-none border px-4 py-4", styles.shell)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={cn("text-[10px] font-semibold uppercase tracking-[0.18em]", styles.label)}>{label}</p>
          <p className={cn("mt-2 text-3xl font-bold tabular-nums", styles.value)}>{value}</p>
        </div>
        <span className={cn("inline-flex size-10 items-center justify-center rounded-none border shadow-sm", styles.icon)}>
          <Icon className="size-4" />
        </span>
      </div>
    </div>
  );
};

const PipelineLoadingExperience = ({
  steps,
  activeStepKey,
}: {
  steps: PipelineStep[];
  activeStepKey: PipelineStep["key"] | null;
}) => {
  const activeStep = steps.find((step) => step.key === activeStepKey) ?? null;
  const completedCount = steps.filter((step) => step.status === "complete").length;
  const visibleProgressCount = Math.min(
    steps.length,
    completedCount + (activeStep ? 1 : 0)
  );

  if (!activeStep) return null;

  return (
    <div className="rounded-none border border-zinc-900 bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-800 p-4 text-white shadow-[0_24px_50px_-28px_rgba(24,24,27,0.85)] transition-all duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-none border border-white/10 bg-white/10">
              <Loader2 className="size-4 animate-spin" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-300">Generation In Progress</p>
              <p className="mt-1 text-base font-semibold text-white">{activeStep.label}</p>
            </div>
          </div>
          <p className="max-w-2xl text-sm text-zinc-300">{activeStep.description}</p>
        </div>

        <div className="rounded-none border border-white/10 bg-white/5 px-3 py-3 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Progress</p>
          <p className="mt-1 text-2xl font-bold text-white">{visibleProgressCount}/{steps.length}</p>
          <p className="text-[11px] text-zinc-400">steps in motion</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 lg:grid-cols-8">
        {steps.map((step) => (
          <div
            key={step.key}
            className={cn(
              "h-2 rounded-full transition-all duration-500",
              step.status === "complete"
                ? "bg-emerald-400"
                : step.status === "active"
                  ? "animate-pulse bg-white"
                  : step.status === "blocked"
                    ? "bg-amber-400"
                    : "bg-white/10"
            )}
          />
        ))}
      </div>
    </div>
  );
};

const GenerateScheduleDialog = ({
  open,
  onOpenChange,
  semesters,
  semestersLoading,
  onGenerated,
  existingNames = [],
  onValidateScheduleName,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  semesters: SemesterOption[];
  semestersLoading: boolean;
  onGenerated: (result: { scheduleId?: string; schedule?: { id?: string } }) => void;
  existingNames?: string[];
  onValidateScheduleName?: (name: string) => Promise<boolean>;
}) => {
  const [name, setName] = useState("");
  const [semesterId, setSemesterId] = useState<string>("");
  const [pendingGeneratedName, setPendingGeneratedName] = useState<string | null>(null);
  const [liveDuplicateName, setLiveDuplicateName] = useState<string | null>(null);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [phase, setPhase] = useState<PipelinePhase>("idle");
  const [zeroAssignments, setZeroAssignments] = useState(false);
  const [missingDates, setMissingDates] = useState(false);
  const [generateErrorMessage, setGenerateErrorMessage] = useState<string | null>(null);
  const pipelineTimerIdsRef = useRef<number[]>([]);
  const phaseStartedAtRef = useRef<number | null>(null);
  const generationRequestRef = useRef(false);

  const prepareMutation = usePrepareScheduling();
  const validateMutation = useValidateSchedulingInput();
  const optimizeMutation = useOptimizeScheduling();
  const generateMutation = useGenerateSchedule();

  const prepare = prepareMutation.data;
  const validationResult = validateMutation.data;
  const optimizationResult = optimizeMutation.data;
  const finalPipelineResult = optimizationResult ?? validationResult;

  const effectiveSemesterId = semesterId;

  const clearPipelineTimers = () => {
    for (const timerId of pipelineTimerIdsRef.current) {
      window.clearTimeout(timerId);
    }
    pipelineTimerIdsRef.current = [];
  };

  const setPipelinePhase = (nextPhase: PipelinePhase) => {
    phaseStartedAtRef.current = Date.now();
    setPhase(nextPhase);
  };

  const queuePipelineTask = (callback: () => void, delayMs: number) => {
    const timerId = window.setTimeout(() => {
      callback();
      pipelineTimerIdsRef.current = pipelineTimerIdsRef.current.filter((id) => id !== timerId);
    }, delayMs);
    pipelineTimerIdsRef.current.push(timerId);
  };

  const queuePipelinePhase = (nextPhase: PipelinePhase, delayMs: number) => {
    queuePipelineTask(() => {
      setPipelinePhase(nextPhase);
    }, delayMs);
  };

  const waitForMinimumStageTime = (minimumMs: number, callback: () => void) => {
    const startedAt = phaseStartedAtRef.current ?? Date.now();
    const elapsedMs = Date.now() - startedAt;
    queuePipelineTask(callback, Math.max(0, minimumMs - elapsedMs));
  };

  const resetPipelineClock = () => {};

  // Reset pipeline state whenever the dialog closes
  useEffect(() => {
    if (!open) {
      const t = window.setTimeout(() => {
        window.requestAnimationFrame(() => {
          startTransition(() => {
            clearPipelineTimers();
            resetPipelineClock();
            setName("");
            setSemesterId("");
            setPendingGeneratedName(null);
            setLiveDuplicateName(null);
            setIsCheckingName(false);
            phaseStartedAtRef.current = null;
            setPhase("idle");
            setZeroAssignments(false);
            setMissingDates(false);
            setGenerateErrorMessage(null);
            generationRequestRef.current = false;
            prepareMutation.reset();
            validateMutation.reset();
            optimizeMutation.reset();
            generateMutation.reset();
          });
        });
      }, DIALOG_CLOSE_SETTLE_DELAY_MS);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSemesterChange = (next: string) => {
    clearPipelineTimers();
    resetPipelineClock();
    setSemesterId(next);
    setPendingGeneratedName(null);
    setLiveDuplicateName(null);
    phaseStartedAtRef.current = null;
    setPhase("idle");
    setZeroAssignments(false);
    setMissingDates(false);
    setGenerateErrorMessage(null);
    generationRequestRef.current = false;
    prepareMutation.reset();
    validateMutation.reset();
    optimizeMutation.reset();
    generateMutation.reset();
  };

  const validateNameBeforePipeline = async () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 3 || isDuplicateName) return false;
    if (!onValidateScheduleName) return true;

    setIsCheckingName(true);
    try {
      const available = await onValidateScheduleName(trimmedName);
      setLiveDuplicateName(available ? null : trimmedName.toLowerCase());
      return available;
    } catch (error) {
      setGenerateErrorMessage(getApiErrorMessage(error, "Unable to validate the schedule name. Please try again."));
      setPhase("failed");
      return false;
    } finally {
      setIsCheckingName(false);
    }
  };

  const runSmartSchedulingFlow = async () => {
    if (name.trim().length < 3 || isDuplicateName) return;
    if (!effectiveSemesterId) return;
    const nameAvailable = await validateNameBeforePipeline();
    if (!nameAvailable) return;

    const sem = semesters.find((s) => s.id === effectiveSemesterId);
    const startDate = sem?.startDate ?? undefined;
    const endDate = sem?.endDate ?? undefined;
    if (!startDate || !endDate) {
      setMissingDates(true);
      setPhase("failed");
      return;
    }
    setMissingDates(false);
    setPendingGeneratedName(null);
    setLiveDuplicateName(null);
    setPipelinePhase("preparing");
    setZeroAssignments(false);
    setGenerateErrorMessage(null);
    clearPipelineTimers();
    resetPipelineClock();
    prepareMutation.reset();
    validateMutation.reset();
    optimizeMutation.reset();
    generateMutation.reset();
    prepareMutation.mutate(
      { semesterId: effectiveSemesterId, startDate, endDate },
      {
        onSuccess: () => {
          waitForMinimumStageTime(PREPARE_STAGE_DELAY_MS, () => {
            setPipelinePhase("validating");
            validateMutation.mutate(
              { semesterId: effectiveSemesterId },
              {
                onSuccess: (result) => {
                  if (!result.isValid) {
                    setPhase("failed");
                    return;
                  }

                  waitForMinimumStageTime(VALIDATE_STAGE_DELAY_MS, () => {
                    setPipelinePhase("building-draft");
                    optimizeMutation.mutate(
                      { semesterId: effectiveSemesterId },
                      {
                        onSuccess: (optimizedResult) => {
                          clearPipelineTimers();
                          if (!optimizedResult.isValid) {
                            resetPipelineClock();
                            setPhase("failed");
                            return;
                          }

                          queuePipelinePhase("evaluating", 0);
                          queuePipelinePhase("optimizing", EVALUATE_STAGE_DELAY_MS);
                          queuePipelinePhase("re-evaluating", EVALUATE_STAGE_DELAY_MS + OPTIMIZE_STAGE_DELAY_MS);
                          queuePipelinePhase("confirming", EVALUATE_STAGE_DELAY_MS + OPTIMIZE_STAGE_DELAY_MS + RE_EVALUATE_STAGE_DELAY_MS);
                          queuePipelinePhase("ready", EVALUATE_STAGE_DELAY_MS + OPTIMIZE_STAGE_DELAY_MS + RE_EVALUATE_STAGE_DELAY_MS + CONFIRM_STAGE_DELAY_MS);
                          resetPipelineClock();
                        },
                        onError: () => {
                          clearPipelineTimers();
                          resetPipelineClock();
                          setPhase("failed");
                        },
                      }
                    );
                  });
                },
                onError: () => {
                  clearPipelineTimers();
                  resetPipelineClock();
                  setPhase("failed");
                },
              }
            );
          });
        },
        onError: () => {
          clearPipelineTimers();
          resetPipelineClock();
          setPhase("failed");
        },
      }
    );
  };

  /** Step 3: generate */
  const handleGenerate = () => {
    if (generationRequestRef.current || phase !== "ready" || !effectiveSemesterId || name.trim().length < 3 || isDuplicateName) return;
    generationRequestRef.current = true;
    clearPipelineTimers();
    resetPipelineClock();
    const normalizedSubmittedName = name.trim().toLowerCase();
    setPendingGeneratedName(normalizedSubmittedName);
    setPipelinePhase("generating");
    setZeroAssignments(false);
    setGenerateErrorMessage(null);
    generateMutation.mutate(
      { scheduleName: name.trim(), semesterId: effectiveSemesterId },
      {
        onSuccess: (result) => {
          const assignmentCount =
            (result as { assignmentsCount?: number }).assignmentsCount ?? 0;
          if (assignmentCount === 0) {
            setZeroAssignments(true);
            setPendingGeneratedName(null);
            generationRequestRef.current = false;
            setPhase("ready");
          } else {
            // Do NOT set phase back to "ready" here — that would re-enable the
            // Generate button while the dialog is still visible. Keep phase at
            // "generating" so the button stays disabled. The dialog close cleanup
            // (useEffect on !open) resets phase to "idle" after the animation.
            onGenerated(result);
          }
        },
        onError: (error) => {
          setPendingGeneratedName(null);
          generationRequestRef.current = false;
          setGenerateErrorMessage(
            getApiErrorMessage(error, GENERATION_BLOCKED_MESSAGE)
          );
          setPhase("failed");
        },
      }
    );
  };

  const isPreparing = phase === "preparing";
  const isValidating = phase === "validating";
  const isOptimizing = phase === "optimizing";
  const isGenerating = phase === "generating";
  const isBuildingDraft = phase === "building-draft";
  const isEvaluating = phase === "evaluating";
  const isReEvaluating = phase === "re-evaluating";
  const isConfirming = phase === "confirming";
  const isRunningChecks = isPreparing || isValidating || isBuildingDraft || isEvaluating || isOptimizing || isReEvaluating || isConfirming;
  const isBusy = isRunningChecks || isGenerating || isCheckingName;

  const hasRun = phase !== "idle";
  const normalizedName = name.trim().toLowerCase();
  const isDuplicateName = existingNames.some(
    (n) => {
      const normalizedExistingName = n.trim().toLowerCase();
      if (normalizedExistingName !== normalizedName) {
        return false;
      }

      return !(pendingGeneratedName && pendingGeneratedName === normalizedName);
    }
  ) || (Boolean(liveDuplicateName) && liveDuplicateName === normalizedName);
  const nameValidationMessage = name.trim().length > 0 && name.trim().length < 3
    ? "Name must be at least 3 characters."
    : name.trim().length >= 3 && isDuplicateName
      ? "A schedule with this name already exists. Choose a different name."
      : null;
  const hasNameValidationError = Boolean(nameValidationMessage);
  const canGenerate = Boolean(validationResult?.isValid) && Boolean(optimizationResult?.isValid) && phase === "ready" && name.trim().length >= 3 && !hasNameValidationError && !isBusy && !zeroAssignments;
  const canRunChecks = Boolean(effectiveSemesterId) && name.trim().length >= 3 && !hasNameValidationError && !isBusy;
  const beforeScore = getOptimizationBeforeScore(validationResult, optimizationResult);
  const afterScore = getOptimizationAfterScore(optimizationResult);
  const improvement = getDisplayedImprovementScore(beforeScore, afterScore);
  const finalQualityScore = optimizationResult ? afterScore : beforeScore;
  const assignmentCount = finalPipelineResult?.riskAnalysis?.totalExamsCount ?? finalPipelineResult?.metrics?.examsCount ?? 0;
  const hardViolationCount = finalPipelineResult?.riskAnalysis?.blockingCount ?? finalPipelineResult?.metrics?.blockingIssuesCount ?? 0;
  const shouldShowQuality = Boolean(optimizationResult?.isValid && finalQualityScore > 0);
  const weakAreas = useMemo(
    () => deriveWeakAreas(validationResult, optimizationResult),
    [validationResult, optimizationResult]
  );
  const optimizationChangesApplied = Math.max(
    optimizationResult?.optimization?.localSearchRepairs?.length ?? 0,
    improvement > 0 ? 1 : 0,
  );
  const optimizationStrategyCount = optimizationResult?.optimization?.attemptedStrategies?.length ?? 0;
  const blockingResult = !optimizationResult?.isValid && optimizationResult
    ? optimizationResult
    : !validationResult?.isValid && validationResult
      ? validationResult
      : undefined;
  const blockingIssues = getBlockingIssues(blockingResult);
  const blockingSuggestions = getBlockingSuggestions(blockingResult);
  const blockingMessage = generateErrorMessage
    ? normalizeBlockingMessage(generateErrorMessage)
    : blockingResult?.optimization?.message
      ? normalizeBlockingMessage(blockingResult.optimization.message)
      : blockingIssues.length > 0
        ? normalizeBlockingMessage(blockingIssues[0])
        : normalizeBlockingMessage(
          prepareMutation.error || validateMutation.error || optimizeMutation.error || generateMutation.error
            ? getApiErrorMessage(
              prepareMutation.error ?? validateMutation.error ?? optimizeMutation.error ?? generateMutation.error,
              GENERATION_BLOCKED_DETAIL_FALLBACK,
            )
            : GENERATION_BLOCKED_DETAIL_FALLBACK,
        );

  const activeStepKey = useMemo<PipelineStep["key"] | null>(() => {
    if (phase === "preparing") return "prepare";
    if (phase === "validating") return "validate";
    if (phase === "building-draft") return "build-draft";
    if (phase === "evaluating") return "evaluate";
    if (phase === "optimizing") return "optimize";
    if (phase === "re-evaluating") return "re-evaluate";
    if (phase === "confirming") return "confirm";
    if (phase === "generating") return "generate";
    return null;
  }, [phase]);

  const steps = useMemo<PipelineStep[]>(() => {
    const hasPrepared = Boolean(prepare) || phase === "validating" || phase === "building-draft" || phase === "evaluating" || phase === "optimizing" || phase === "re-evaluating" || phase === "confirming" || phase === "ready" || phase === "generating";
    const hasSuccessfulValidation = Boolean(validationResult?.isValid);
    const hasSuccessfulOptimization = Boolean(optimizationResult?.isValid);
    const hasValidation = hasSuccessfulValidation && phase !== "validating";
    const isBlocked = phase === "failed" || Boolean(missingDates) || Boolean(generateErrorMessage);
    const hasDraft = hasSuccessfulValidation && phase !== "validating" && phase !== "building-draft";
    const hasEvaluatedDraft = hasSuccessfulValidation && phase !== "validating" && phase !== "building-draft" && phase !== "evaluating";
    const hasOptimized = hasSuccessfulOptimization && phase !== "optimizing" && phase !== "evaluating";
    const hasReEvaluated = hasSuccessfulOptimization && phase !== "optimizing" && phase !== "re-evaluating" && phase !== "evaluating";
    const hasConfirmed = phase === "ready" || phase === "generating" || Boolean(generateErrorMessage);
    const completionMap: Record<PipelineStep["key"], boolean> = {
      prepare: hasPrepared,
      validate: hasValidation,
      "build-draft": hasDraft,
      evaluate: hasEvaluatedDraft,
      optimize: hasOptimized,
      "re-evaluate": hasReEvaluated,
      confirm: hasConfirmed,
      generate: false,
    };
    const lastCompletedIndex = PIPELINE_STEP_META.reduce((lastIndex, step, index) => {
      return completionMap[step.key] ? index : lastIndex;
    }, -1);

    return PIPELINE_STEP_META.map((step, index) => ({
      ...step,
      status:
        isBusy && activeStepKey === step.key
          ? "active"
          : completionMap[step.key]
            ? "complete"
            : isBlocked && index > lastCompletedIndex
              ? "blocked"
              : "idle",
    }));
  }, [
    prepare,
    validationResult,
    missingDates,
    generateErrorMessage,
    optimizationResult,
    phase,
    isBusy,
    activeStepKey,
  ]);

  const displayedPipelineSteps = useMemo(
    () => isBusy ? steps.filter((step) => step.status === "complete" || step.status === "active") : steps,
    [isBusy, steps]
  );

  const visibleStepCount = useMemo(() => {
    if (activeStepKey) {
      const stepIndex = PIPELINE_STEP_META.findIndex((step) => step.key === activeStepKey);
      return stepIndex >= 0 ? stepIndex + 1 : 0;
    }
    return steps.filter((step) => step.status === "complete").length;
  }, [activeStepKey, steps]);

  const stepStatusClass = (status: PipelineStepStatus) => {
    if (status === "complete") return "border-emerald-200 bg-linear-to-br from-emerald-50 via-white to-emerald-100/80 text-emerald-700 shadow-[0_18px_36px_-26px_rgba(16,185,129,0.5)] dark:border-emerald-900/70 dark:from-emerald-950/60 dark:via-zinc-950 dark:to-emerald-900/30 dark:text-emerald-300 dark:shadow-black/30";
    if (status === "active") return "border-zinc-900 bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-800 text-white shadow-[0_18px_36px_-24px_rgba(24,24,27,0.8)]";
    if (status === "blocked") return "border-amber-200 bg-linear-to-br from-amber-50 via-white to-orange-50 text-amber-700 dark:border-amber-900/70 dark:from-amber-950/50 dark:via-zinc-950 dark:to-orange-950/30 dark:text-amber-300";
    return "border-zinc-200 bg-linear-to-br from-white to-zinc-50 text-zinc-400 dark:border-zinc-800 dark:from-zinc-950 dark:to-zinc-900 dark:text-zinc-500";
  };

  const stepStatusLabel = (status: PipelineStepStatus) => {
    if (status === "complete") return "Done";
    if (status === "active") return "In Progress";
    if (status === "blocked") return "Blocked";
    return "Waiting";
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!isBusy) onOpenChange(next); }}>
      <DialogContent className="flex! max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-none border-zinc-200/80 bg-white p-0 gap-0 shadow-2xl shadow-zinc-950/15 dark:border-zinc-800/80 dark:bg-zinc-950 dark:shadow-black/50 sm:max-w-3xl">
        {/* Dialog header */}
        <DialogHeader className="border-b border-zinc-200/70 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),rgba(244,244,245,0.92)_42%,rgba(228,228,231,0.82))] px-5 py-4 dark:border-zinc-800/80 dark:bg-[radial-gradient(circle_at_top_left,rgba(39,39,42,0.96),rgba(24,24,27,0.98)_44%,rgba(9,9,11,0.98))] sm:px-6 sm:py-5">
          <div className="relative rounded-none border border-zinc-200/80 bg-white/80 p-4 shadow-[0_20px_48px_-34px_rgba(24,24,27,0.35)] backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-950/80 dark:shadow-black/40 sm:p-5">
            <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-32 bg-[linear-gradient(135deg,rgba(24,24,27,0.05),rgba(24,24,27,0))] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0))] lg:block" />
            <div className="relative flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-none border border-zinc-900 bg-zinc-950 text-white shadow-[0_18px_36px_-22px_rgba(24,24,27,0.8)]">
                  <Sparkles className="size-4.5" />
                </span>
                <div className="space-y-1.5">
                  <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                    <ShieldCheck className="size-3.5" />
                    Confirmed Schedule Only
                  </span>
                  <div className="space-y-1">
                    <DialogTitle className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-xl">
                      Generate Schedule
                    </DialogTitle>
                    <p className="max-w-2xl text-xs leading-5 text-zinc-600 dark:text-zinc-400 sm:text-sm sm:leading-6">
                      Smart generation prepares resources, validates feasibility, optimizes quality, and saves only a confirmed schedule.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-6">
          <div className="space-y-4 rounded-none border border-zinc-200/70 bg-linear-to-br from-white via-zinc-50/70 to-zinc-100/70 p-4 shadow-sm dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-900/80 dark:shadow-black/30">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Schedule Flow</p>
                <p className="mt-1 text-sm font-semibold text-zinc-950 dark:text-zinc-50">End-to-end generation pipeline</p>
              </div>
              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 shadow-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
                {visibleStepCount}/8 steps
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              {displayedPipelineSteps.map((step) => {
                const stepIndex = PIPELINE_STEP_META.findIndex((item) => item.key === step.key);

                return (
                  <div
                    key={step.key}
                    className={cn(
                      "min-w-0 rounded-none border px-3 py-3 text-xs transition-all duration-300",
                      stepStatusClass(step.status)
                    )}
                  >
                    <div className="flex min-w-0 items-start gap-2.5">
                      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-current text-[10px] font-semibold">
                        {step.status === "active" ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : step.status === "complete" ? (
                          <CheckCircle2 className="size-3.5" />
                        ) : step.status === "blocked" ? (
                          <AlertTriangle className="size-3.5" />
                        ) : (
                          stepIndex + 1
                        )}
                      </span>
                      <div className="min-w-0 space-y-1">
                        <div className="space-y-1">
                          <p className="wrap-break-word font-semibold leading-tight">{step.label}</p>
                          <p className="wrap-break-word text-[10px] uppercase tracking-[0.08em] leading-tight opacity-80">
                            {stepStatusLabel(step.status)}
                          </p>
                        </div>
                        {(step.status === "active" || step.status === "blocked") && (
                          <p className="text-[11px] leading-4 opacity-80">{step.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4 rounded-none border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/70 dark:shadow-black/30">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-[10px] font-bold text-white">
                1
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                Prepare
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="gen-semester" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                  Semester
                </Label>
                <Select
                  value={semesterId}
                  onValueChange={handleSemesterChange}
                  disabled={semestersLoading || semesters.length === 0 || isBusy}
                >
                  <SelectTrigger id="gen-semester" className="h-11 w-full min-w-0 rounded-none border-zinc-200 bg-zinc-50/40 px-3 shadow-sm hover:border-zinc-300 focus-visible:ring-zinc-300/50 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-100 dark:hover:border-zinc-600 dark:focus-visible:ring-zinc-700">
                    <SelectValue placeholder={semestersLoading ? "Loading…" : "Select semester"} />
                  </SelectTrigger>
                  <SelectContent className="max-w-[min(30rem,var(--radix-select-trigger-width))]">
                    {semesters.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}{s.year ? ` (${s.year})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="gen-name" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                  Name
                </Label>
                <Input
                  id="gen-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setLiveDuplicateName(null);
                  }}
                  placeholder="e.g. Spring 2026 — Final Exams"
                  className="h-11 rounded-none border-zinc-200 bg-zinc-50/40 shadow-sm hover:border-zinc-300 focus-visible:ring-zinc-300/50 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:border-zinc-600 dark:focus-visible:ring-zinc-700"
                  disabled={isBusy}
                />
                {nameValidationMessage && (
                  <p className={`text-[11px] ${isDuplicateName ? "text-rose-600" : "text-amber-600"}`}>
                    {nameValidationMessage}
                  </p>
                )}
                {isCheckingName && (
                  <p className="text-[11px] text-zinc-500">Checking schedule name...</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-[10px] font-bold text-white">
                  2
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Automatic Generation Check
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={runSmartSchedulingFlow}
                disabled={!canRunChecks}
                className="h-8 rounded-none border-zinc-200 px-3 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                {isRunningChecks ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : isCheckingName ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="size-3.5" />
                )}
                {isCheckingName ? "Checking name..." : isPreparing ? "Loading Resources..." : isValidating ? "Candidate Selection..." : isBuildingDraft ? "Build Draft..." : isEvaluating ? "Evaluating..." : isOptimizing ? "Optimization..." : isReEvaluating ? "Re-evaluating..." : isConfirming ? "Confirming..." : hasRun ? "Run Again" : "Start"}
              </Button>
            </div>

            {phase === "idle" && (
              <div className="flex items-center gap-2.5 rounded-none border border-dashed border-zinc-200 bg-zinc-50/60 px-4 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
                <ShieldCheck className="size-4 shrink-0 text-zinc-300 dark:text-zinc-500" />
                Select a semester, then start the automated schedule generation check.
              </div>
            )}

            {isBusy && <PipelineLoadingExperience steps={steps} activeStepKey={activeStepKey} />}

            {prepare && !isPreparing && !isValidating && !isGenerating && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {([
                    { label: "Course Offerings", value: prepare.activeCourseOfferingsCount ?? 0, icon: BookOpen },
                    { label: "Rooms", value: prepare.availableRoomsCount ?? prepare.roomsCount ?? 0, icon: DoorOpen },
                    { label: "Proctors", value: prepare.proctorsCount ?? 0, icon: UserCheck },
                    { label: "TimeSlots", value: prepare.timeSlotsCount ?? 0, icon: Clock },
                  ] as { label: string; value: number; icon: React.ComponentType<{ className?: string }> }[]).map((stat) => (
                    <ResourceStatCard key={stat.label} {...stat} />
                  ))}
                </div>
                {prepare.semester?.name && (
                  <div className="inline-flex items-center gap-2 rounded-none border border-zinc-200 bg-zinc-50/70 px-3 py-2 text-[11px] text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
                    <CalendarDays className="size-3.5 shrink-0 text-zinc-500 dark:text-zinc-400" />
                    <span className="font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Semester</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{prepare.semester.name}</span>
                  </div>
                )}
              </div>
            )}

            {phase === "ready" && !zeroAssignments && (
              <div className="space-y-3">
                <div className="rounded-none border border-emerald-200 bg-linear-to-r from-emerald-50 via-white to-emerald-100/70 px-4 py-4 shadow-[0_18px_36px_-24px_rgba(16,185,129,0.45)] dark:border-emerald-900/70 dark:from-emerald-950/50 dark:via-zinc-950 dark:to-emerald-900/30 dark:shadow-black/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-none border border-emerald-200 bg-white text-emerald-700 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <CheckCircle2 className="size-4" />
                      </span>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Ready</p>
                        <p className="mt-1 text-base font-semibold text-emerald-950 dark:text-emerald-100">Ready to generate</p>
                        <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">Feasible draft confirmed</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                      Optimized
                    </span>
                  </div>
                </div>

                {shouldShowQuality && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.25fr_0.75fr]">
                      <div className="rounded-none border border-zinc-200 bg-linear-to-br from-white via-zinc-50/60 to-zinc-100/70 px-4 py-4 shadow-sm dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-900/80 dark:shadow-black/30">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Weak Areas</p>
                            <p className="mt-1 text-sm font-semibold text-zinc-950 dark:text-zinc-50">Priority quality gaps in the evaluated draft</p>
                          </div>
                          <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-zinc-500 shadow-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
                            Evaluated Draft
                          </span>
                        </div>
                        {weakAreas.length > 0 ? (
                          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {weakAreas.slice(0, 4).map((area, index) => (
                              <WeakAreaItem key={`${area.area}-${area.score}`} area={area.area} score={area.score} index={index} />
                            ))}
                          </div>
                        ) : (
                          <div className="mt-4 rounded-none border border-emerald-200 bg-emerald-50/80 px-3 py-3 text-xs text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300">
                            No weak areas detected in the evaluated draft.
                          </div>
                        )}
                      </div>
                      <div className="rounded-none border border-emerald-200 bg-linear-to-br from-emerald-50 via-white to-emerald-100/80 px-4 py-4 shadow-[0_18px_40px_-24px_rgba(16,185,129,0.6)] dark:border-emerald-900/70 dark:from-emerald-950/60 dark:via-zinc-950 dark:to-emerald-900/30 dark:shadow-black/30">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Optimization Changes Applied</p>
                            <p className="mt-1 text-sm font-semibold text-emerald-950 dark:text-emerald-100">Accepted repair actions and re-check summary</p>
                          </div>
                          <span className="inline-flex size-10 items-center justify-center rounded-none border border-emerald-200 bg-white text-emerald-700 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <Sparkles className="size-4" />
                          </span>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="rounded-none border border-emerald-200/70 bg-white/80 px-3 py-3 dark:border-emerald-900/60 dark:bg-zinc-950/50">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Changes</p>
                            <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-950 dark:text-emerald-100">{optimizationChangesApplied}</p>
                          </div>
                          <div className="rounded-none border border-emerald-200/70 bg-white/80 px-3 py-3 dark:border-emerald-900/60 dark:bg-zinc-950/50">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Strategies</p>
                            <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-950 dark:text-emerald-100">{optimizationStrategyCount}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-3 rounded-none border border-emerald-200/70 bg-white/80 px-3 py-2.5 dark:border-emerald-900/60 dark:bg-zinc-950/50">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Search Coverage</p>
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                            {optimizationStrategyCount} strategies checked
                          </span>
                        </div>
                        <p className="mt-3 text-xs font-medium text-emerald-800 dark:text-emerald-300">Re-evaluated improved score: {formatScore(afterScore)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      <QualityMetricCard label="Room Utilization" value={getQualityMetric(validationResult, optimizationResult, "roomUtilization")} beforeValue={optimizationResult ? getBeforeQualityMetric(validationResult, optimizationResult, "roomUtilization") : undefined} />
                      <QualityMetricCard label="Proctor Balance" value={getQualityMetric(validationResult, optimizationResult, "proctorWorkloadBalance")} beforeValue={optimizationResult ? getBeforeQualityMetric(validationResult, optimizationResult, "proctorWorkloadBalance") : undefined} />
                      <QualityMetricCard label="Student Spacing" value={getQualityMetric(validationResult, optimizationResult, "studentSpacing")} beforeValue={optimizationResult ? getBeforeQualityMetric(validationResult, optimizationResult, "studentSpacing") : undefined} />
                      <QualityMetricCard label="Exam Distribution" value={getQualityMetric(validationResult, optimizationResult, "examDistribution")} beforeValue={optimizationResult ? getBeforeQualityMetric(validationResult, optimizationResult, "examDistribution") : undefined} />
                      <QualityMetricCard label="Spacing Balance" value={getQualityMetric(validationResult, optimizationResult, "spacingBalance")} beforeValue={optimizationResult ? getBeforeQualityMetric(validationResult, optimizationResult, "spacingBalance") : undefined} />
                    </div>
                    {(() => {
                      const rm = getQualityMetric(validationResult, optimizationResult, "roomUtilization");
                      const pb = getQualityMetric(validationResult, optimizationResult, "proctorWorkloadBalance");
                      const ss = getQualityMetric(validationResult, optimizationResult, "studentSpacing");
                      const ed = getQualityMetric(validationResult, optimizationResult, "examDistribution");
                      const sb = getQualityMetric(validationResult, optimizationResult, "spacingBalance");
                      const computedTotal = Math.round(rm * 0.25 + pb * 0.25 + ss * 0.20 + ed * 0.15 + sb * 0.15);
                      return (
                        <div className="rounded-none border border-zinc-200/80 bg-zinc-50/60 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/40">
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Weighted Score Breakdown</p>
                          <div className="grid grid-cols-3 gap-x-4 gap-y-1 sm:grid-cols-5">
                            {([
                              ["Room ×25%", rm * 0.25],
                              ["Proctor ×25%", pb * 0.25],
                              ["Spacing ×20%", ss * 0.20],
                              ["Distribution ×15%", ed * 0.15],
                              ["Spacing Balance ×15%", sb * 0.15],
                            ] as [string, number][]).map(([lbl, contribution]) => (
                              <div key={lbl} className="flex items-baseline justify-between gap-1 text-[11px]">
                                <span className="text-zinc-500 dark:text-zinc-400">{lbl}</span>
                                <span className="font-semibold tabular-nums text-zinc-700 dark:text-zinc-200">{contribution.toFixed(1)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 flex items-center justify-end gap-2 border-t border-zinc-200/80 pt-2 dark:border-zinc-700">
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Computed total:</span>
                            <span className="text-[12px] font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{computedTotal}%</span>
                            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">(reported: {formatScore(afterScore)})</span>
                          </div>
                        </div>
                      );
                    })()}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <ScoreSummaryCard label="Before Optimization" value={formatScore(beforeScore)} variant="draft" />
                      <ScoreSummaryCard label="After Optimization" value={formatScore(afterScore)} variant="optimized" />
                      <ScoreSummaryCard label="Improvement" value={`${improvement >= 0 ? "+" : ""}${improvement}%`} variant="improvement" />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <FinalStatCard label="Assignments" value={assignmentCount} icon={ClipboardList} tone="neutral" />
                  <FinalStatCard label="Hard Violations" value={hardViolationCount} icon={ShieldCheck} tone={hardViolationCount === 0 ? "success" : "neutral"} />
                  <FinalStatCard label="Final Quality" value={formatScore(finalQualityScore)} icon={Sparkles} tone="quality" />
                </div>
              </div>
            )}

            {phase === "failed" && (
              <div className="space-y-3">
                {missingDates ? (
                  <div className="flex items-start gap-2.5 rounded-none border border-amber-200 bg-amber-50 px-4 py-3">
                    <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-800">Semester has no exam period dates</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Please edit the semester and set a start date and end date before running pre-flight checks.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 rounded-none border border-amber-200 bg-amber-50 px-4 py-3">
                    <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-900">{GENERATION_BLOCKED_MESSAGE}</p>
                      <p className="text-[11px] text-amber-800 mt-0.5">{blockingMessage}</p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {(blockingSuggestions.length > 0 ? blockingSuggestions : [
                    "Increase usable room capacity.",
                    "Increase available proctor coverage.",
                    "Add more valid exam time slots.",
                  ]).map((suggestion) => (
                    <div key={suggestion} className="rounded-none border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                      {suggestion}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {zeroAssignments && (
              <div className="flex items-start gap-2.5 rounded-none border border-amber-200 bg-amber-50 px-4 py-3">
                <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-800">No assignments were created</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    No schedule was created. Add resources, then run the automatic check again.
                  </p>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-zinc-200/70 bg-zinc-50/60 flex sm:items-center gap-3 dark:border-zinc-800/80 dark:bg-zinc-900/70">
          <Button
            type="button"
            variant="outline"
            className="rounded-none h-10 border-zinc-200 font-semibold"
            onClick={() => onOpenChange(false)}
            disabled={isBusy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-none h-10 bg-zinc-950 text-white hover:bg-zinc-900 font-semibold inline-flex items-center gap-2 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
            disabled={!canGenerate}
            onClick={handleGenerate}
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Generating schedule…
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Generate Schedule
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// -------------------- Page --------------------

// -------------------- Sheet primitives --------------------

const SheetSection = ({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-none border border-zinc-200/60 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex size-8 items-center justify-center rounded-none bg-zinc-950 text-white shadow-sm">
          <Icon className="size-4" />
        </span>
        <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
      </div>
      {hint && (
        <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          {hint}
        </span>
      )}
    </div>
    {children}
  </section>
);

const KVRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="grid grid-cols-3 gap-3 py-1.5 text-sm">
    <div className="col-span-1 text-xs uppercase tracking-wide text-zinc-500">
      {label}
    </div>
    <div className="col-span-2 text-zinc-900 wrap-break-word">{value}</div>
  </div>
);

// -------------------- Calendar / Timeline view --------------------

type CalendarPalette = {
  cardBg: string;
  cardBorder: string;
  badgeBg: string;
  badgeText: string;
  accent: string;
};

type ScheduleAssignmentListItem = ScheduleAssignment & {
  assignmentIds: string[];
  roomIds: string[];
  proctorIds: string[];
  centerIds: string[];
  searchIndex: string;
  logicalAssignments: ScheduleAssignment[];
};

const CALENDAR_PALETTES: CalendarPalette[] = [
  {
    cardBg: "bg-indigo-50/70 dark:bg-indigo-950/40",
    cardBorder: "border-indigo-200/70 dark:border-indigo-800/60",
    badgeBg: "bg-white dark:bg-indigo-950/60",
    badgeText: "text-indigo-700 dark:text-indigo-300",
    accent: "text-indigo-700 dark:text-indigo-400",
  },
  {
    cardBg: "bg-amber-50/80 dark:bg-amber-950/40",
    cardBorder: "border-amber-200/70 dark:border-amber-800/60",
    badgeBg: "bg-white dark:bg-amber-950/60",
    badgeText: "text-amber-700 dark:text-amber-300",
    accent: "text-amber-700 dark:text-amber-400",
  },
  {
    cardBg: "bg-rose-50/70 dark:bg-rose-950/40",
    cardBorder: "border-rose-200/70 dark:border-rose-800/60",
    badgeBg: "bg-white dark:bg-rose-950/60",
    badgeText: "text-rose-700 dark:text-rose-300",
    accent: "text-rose-700 dark:text-rose-400",
  },
  {
    cardBg: "bg-emerald-50/70 dark:bg-emerald-950/40",
    cardBorder: "border-emerald-200/70 dark:border-emerald-800/60",
    badgeBg: "bg-white dark:bg-emerald-950/60",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    accent: "text-emerald-700 dark:text-emerald-400",
  },
  {
    cardBg: "bg-sky-50/70 dark:bg-sky-950/40",
    cardBorder: "border-sky-200/70 dark:border-sky-800/60",
    badgeBg: "bg-white dark:bg-sky-950/60",
    badgeText: "text-sky-700 dark:text-sky-300",
    accent: "text-sky-700 dark:text-sky-400",
  },
  {
    cardBg: "bg-violet-50/70 dark:bg-violet-950/40",
    cardBorder: "border-violet-200/70 dark:border-violet-800/60",
    badgeBg: "bg-white dark:bg-violet-950/60",
    badgeText: "text-violet-700 dark:text-violet-300",
    accent: "text-violet-700 dark:text-violet-400",
  },
  {
    cardBg: "bg-teal-50/70 dark:bg-teal-950/40",
    cardBorder: "border-teal-200/70 dark:border-teal-800/60",
    badgeBg: "bg-white dark:bg-teal-950/60",
    badgeText: "text-teal-700 dark:text-teal-300",
    accent: "text-teal-700 dark:text-teal-400",
  },
];

const paletteForKey = (key: string): CalendarPalette => {
  if (!key) return CALENDAR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return CALENDAR_PALETTES[hash % CALENDAR_PALETTES.length];
};

const ScheduleCalendarView = ({
  assignments,
  isFinal,
  hasActiveFilters,
  onClearFilters,
  onSelectAssignment,
}: {
  assignments: ScheduleAssignment[];
  isFinal?: boolean;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onSelectAssignment: (assignment: ScheduleAssignment) => void;
}) => {
  // Group all assignments by date key (YYYY-MM-DD)
  const assignmentsByDay = useMemo(() => {
    const groups = new Map<string, ScheduleAssignment[]>();
    for (const a of assignments) {
      const key = dateKey(a.timeSlot?.date ?? a.timeSlot?.startTime);
      if (!key) continue;
      const list = groups.get(key) ?? [];
      list.push(a);
      groups.set(key, list);
    }
    for (const [k, list] of groups) {
      list.sort((a, b) => {
        const ta = new Date(a.timeSlot?.startTime ?? 0).getTime();
        const tb = new Date(b.timeSlot?.startTime ?? 0).getTime();
        return ta - tb;
      });
      groups.set(k, list);
    }
    return groups;
  }, [assignments]);

  // Distinct months that have assignments (YYYY-MM), sorted ascending
  const monthsWithExams = useMemo(() => {
    const set = new Set<string>();
    for (const k of assignmentsByDay.keys()) {
      set.add(k.slice(0, 7));
    }
    return Array.from(set).sort();
  }, [assignmentsByDay]);

  // Years that have at least one assignment, sorted asc
  const yearsWithExams = useMemo(() => {
    const set = new Set<number>();
    for (const k of assignmentsByDay.keys()) {
      set.add(Number(k.slice(0, 4)));
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [assignmentsByDay]);

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // Effective year: the user's selection, falling back to the first year that has exams
  // or the current year as a last resort.
  const effectiveYear = useMemo(() => {
    if (selectedYear && yearsWithExams.includes(selectedYear)) return selectedYear;
    if (yearsWithExams.length > 0) return yearsWithExams[0];
    return new Date().getFullYear();
  }, [selectedYear, yearsWithExams]);

  // 12 month keys for the effective year (always show the full year)
  const monthsOfYear = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      return `${effectiveYear}-${String(i + 1).padStart(2, "0")}`;
    });
  }, [effectiveYear]);

  // Sync selected month when assignments / filters / year change.
  // Default to first month of the active year that has exams, else January.
  const effectiveMonth = useMemo(() => {
    if (
      selectedMonth &&
      selectedMonth.startsWith(`${effectiveYear}-`) &&
      monthsOfYear.includes(selectedMonth)
    ) {
      return selectedMonth;
    }
    const firstWithExams = monthsWithExams.find((m) =>
      m.startsWith(`${effectiveYear}-`)
    );
    return firstWithExams ?? monthsOfYear[0];
  }, [selectedMonth, effectiveYear, monthsOfYear, monthsWithExams]);

  const monthIndex = monthsOfYear.indexOf(effectiveMonth);
  const canGoPrev = monthIndex > 0;
  const canGoNext = monthIndex >= 0 && monthIndex < monthsOfYear.length - 1;

  // Build the list of every day in the active month with its (possibly empty) assignments
  const daysInMonth = useMemo(() => {
    if (!effectiveMonth) return [] as Array<{ key: string; items: ScheduleAssignment[] }>;
    const [yearStr, monthStr] = effectiveMonth.split("-");
    const year = Number(yearStr);
    const monthIdx = Number(monthStr) - 1;
    if (Number.isNaN(year) || Number.isNaN(monthIdx)) return [];
    const total = new Date(year, monthIdx + 1, 0).getDate();
    const days: Array<{ key: string; items: ScheduleAssignment[] }> = [];
    for (let d = 1; d <= total; d += 1) {
      const key = `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ key, items: assignmentsByDay.get(key) ?? [] });
    }
    return days;
  }, [effectiveMonth, assignmentsByDay]);

  // Collapse consecutive empty days into a single "range" row.
  type CalendarRow =
    | { kind: "day"; key: string; items: ScheduleAssignment[] }
    | { kind: "empty"; startKey: string; endKey: string; count: number };

  const calendarRows = useMemo<CalendarRow[]>(() => {
    const rows: CalendarRow[] = [];
    let buffer: typeof daysInMonth = [];
    const flush = () => {
      if (buffer.length === 0) return;
      if (buffer.length === 1) {
        rows.push({ kind: "day", key: buffer[0].key, items: [] });
      } else {
        rows.push({
          kind: "empty",
          startKey: buffer[0].key,
          endKey: buffer[buffer.length - 1].key,
          count: buffer.length,
        });
      }
      buffer = [];
    };
    for (const d of daysInMonth) {
      if (d.items.length === 0) {
        buffer.push(d);
      } else {
        flush();
        rows.push({ kind: "day", key: d.key, items: d.items });
      }
    }
    flush();
    return rows;
  }, [daysInMonth]);

  const examsThisMonth = useMemo(
    () => daysInMonth.reduce((acc, d) => acc + d.items.length, 0),
    [daysInMonth]
  );

  if (assignments.length === 0) {
    return (
      <Card className="rounded-none border border-zinc-200/60 bg-white shadow-sm dark:border-zinc-800/60 dark:bg-zinc-950">
        <CardContent className="p-12">
          <EmptyState
            icon={CalendarRange}
            title="No exams to display"
            description={
              hasActiveFilters
                ? "Try clearing filters or selecting another schedule."
                : "This schedule has no assignments. Generate or regenerate to populate it."
            }
            action={
              hasActiveFilters
                ? { label: "Clear filters", onClick: onClearFilters }
                : undefined
            }
          />
        </CardContent>
      </Card>
    );
  }

  const formatMonthLabel = (monthKey: string) => {
    const [y, m] = monthKey.split("-");
    const d = new Date(Number(y), Number(m) - 1, 1);
    return d.toLocaleDateString([], { month: "short" });
  };

  const formatMonthFullLabel = (monthKey: string) => {
    const [y, m] = monthKey.split("-");
    const d = new Date(Number(y), Number(m) - 1, 1);
    return d.toLocaleDateString([], { month: "long", year: "numeric" });
  };

  return (
    <Card className="rounded-none border border-zinc-200/60 bg-white shadow-sm dark:border-zinc-800/60 dark:bg-zinc-950">
      <CardContent className="p-0">
        {/* Sticky month switcher */}
        <div className="sticky top-0 z-10 border-b border-zinc-200/70 bg-white/95 px-4 py-3 backdrop-blur-sm dark:border-zinc-800/70 dark:bg-zinc-950/95 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (canGoPrev) setSelectedMonth(monthsOfYear[monthIndex - 1]);
              }}
              disabled={!canGoPrev}
              aria-label="Previous month"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div className="-mx-1 flex flex-1 items-center gap-2 overflow-x-auto px-1">
              {monthsOfYear.map((mKey) => {
                const isActive = mKey === effectiveMonth;
                const hasExams = monthsWithExams.includes(mKey);
                return (
                  <button
                    key={mKey}
                    type="button"
                    onClick={() => setSelectedMonth(mKey)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors",
                      isActive
                        ? "border-zinc-900 bg-zinc-900 text-white shadow-sm dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
                        : hasExams
                        ? "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
                        : "border-zinc-200 bg-white text-zinc-400 hover:border-zinc-300 hover:text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-600 dark:hover:border-zinc-700 dark:hover:text-zinc-500"
                    )}
                  >
                    {formatMonthLabel(mKey)}
                    {hasExams && (
                      <span
                        className={cn(
                          "inline-block size-1.5 rounded-full",
                          isActive ? "bg-zinc-950/70 dark:bg-zinc-100/70" : "bg-zinc-900 dark:bg-zinc-300"
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                if (canGoNext) setSelectedMonth(monthsOfYear[monthIndex + 1]);
              }}
              disabled={!canGoNext}
              aria-label="Next month"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            {effectiveMonth && (
              <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {formatMonthFullLabel(effectiveMonth)}
                <span className="ml-2 normal-case tracking-normal text-zinc-400 dark:text-zinc-500">
                  · {examsThisMonth} {examsThisMonth === 1 ? "exam" : "exams"}
                </span>
              </div>
            )}
            {yearsWithExams.length > 1 && (
              <div className="flex items-center gap-1">
                {yearsWithExams.map((y) => {
                  const isActive = y === effectiveYear;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        setSelectedYear(y);
                        setSelectedMonth(null);
                      }}
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors",
                        isActive
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                          : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                      )}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Days list */}
        {examsThisMonth === 0 ? (
          <div className="px-6 py-16 text-center">
            <CalendarRange className="mx-auto size-8 text-zinc-300 dark:text-zinc-600" />
            <div className="mt-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              No exam available
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-500">
              No exams are scheduled in {formatMonthFullLabel(effectiveMonth)}.
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
            {calendarRows.map((row) => {
              if (row.kind === "empty") {
                const startNum = Number(row.startKey.slice(8, 10));
                const endNum = Number(row.endKey.slice(8, 10));
                return (
                  <li
                    key={`empty-${row.startKey}`}
                    className="flex items-center gap-4 px-4 py-4 sm:px-6 lg:gap-6"
                  >
                    <div className="flex shrink-0 items-center gap-2 lg:w-16 lg:justify-center">
                      <span className="inline-flex items-center justify-center rounded-full border border-dashed border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-400">
                        {startNum}–{endNum}
                      </span>
                    </div>
                    <div className="text-sm italic text-zinc-400">
                      No exam ({row.count} days).
                    </div>
                  </li>
                );
              }
              const dayNum = Number(row.key.slice(8, 10));
              const items = row.items;
              return (
                <li key={row.key} className="px-4 py-5 sm:px-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
                    {/* Day index */}
                    <div className="flex shrink-0 items-center gap-3 lg:w-16 lg:flex-col lg:items-center">
                      <div className="inline-flex size-9 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white shadow-sm">
                        {dayNum}
                      </div>
                    </div>

                    {/* Cards */}
                    <div className="min-w-0 flex-1">
                      <div
                        className={cn(
                          "-mx-1 flex gap-3 px-1 pb-2",
                          "snap-x snap-mandatory overflow-x-auto scroll-smooth",
                          "[scrollbar-width:thin] [scrollbar-color:var(--color-zinc-300)_transparent]",
                          "lg:flex-wrap lg:overflow-visible lg:snap-none"
                        )}
                      >
                        {items.map((a) => {
                          const course = a.exam?.courseOffering?.course;
                          const ts = a.timeSlot;
                          const studentsCount =
                            a.exam?.courseOffering?.registrations?.length ??
                            a.exam?.courseOffering?.expectedStudents ??
                            0;
                          const code = course?.code ?? "Not assigned";
                          const palette = paletteForKey(
                            course?.id ?? course?.code ?? a.id
                          );
                          const title =
                            course?.title ?? course?.name ?? "Untitled course";
                          return (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => onSelectAssignment(a)}
                              className={cn(
                                "group relative flex w-72 shrink-0 snap-start flex-col gap-3 rounded-2xl border p-4 text-left",
                                "shadow-[0_1px_2px_rgba(24,24,27,0.04),0_4px_12px_-4px_rgba(24,24,27,0.06)]",
                                "transition-all duration-200 ease-out",
                                "hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(24,24,27,0.06),0_12px_24px_-8px_rgba(24,24,27,0.12)]",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-900",
                                "lg:w-76",
                                palette.cardBg,
                                palette.cardBorder
                              )}
                              aria-label={`View details for ${title}`}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <span
                                      className={cn(
                                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wide",
                                        palette.badgeBg,
                                        palette.badgeText
                                      )}
                                    >
                                      {code}
                                    </span>
                                    <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
                                      {title}
                                    </h3>
                                  </div>
                                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                                    <ExamStatusBadge
                                      status={getAssignmentDisplayStatus({
                                        status: a.exam?.status,
                                        isFinal,
                                      })}
                                      variant="pill"
                                    />
                                  </div>
                                </div>

                                {/* Time */}
                                <div className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                                  <Clock
                                    className={cn("size-3.5", palette.accent)}
                                  />
                                  <span className="font-semibold tabular-nums">
                                    {formatTime(ts?.startTime)} – {formatTime(ts?.endTime)}
                                  </span>
                                  {a.exam?.duration != null && (
                                    <span className="ml-auto inline-flex items-center rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
                                      {a.exam.duration} min
                                    </span>
                                  )}
                                </div>

                                {/* Inner mini card */}
                                <div className="rounded-xl border border-white/70 bg-white/80 p-3 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                                  <div className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                                    <DoorOpen className="size-3.5 text-zinc-500 dark:text-zinc-400" />
                                    <span className="truncate font-medium">
                                      {a.room?.name ?? "Not assigned"}
                                    </span>
                                    {a.room?.center?.name && (
                                      <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                                        <MapPin className="size-3" />
                                        <span className="truncate">
                                          {a.room.center.name}
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                                    <UserCheck className="size-3.5 text-zinc-500 dark:text-zinc-400" />
                                    <span className="truncate">
                                      {a.proctor?.user?.name ?? "Not assigned"}
                                    </span>
                                  </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between border-t border-white/70 pt-2.5 dark:border-white/10">
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 dark:bg-white/10 dark:text-zinc-300">
                                    <Users className="size-3.5" />
                                    {studentsCount}{" "}
                                    {studentsCount === 1 ? "student" : "students"}
                                  </span>
                                  {a.exam?.courseOffering?.semester?.name && (
                                    <span className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                                      {a.exam.courseOffering.semester.name}
                                    </span>
                                  )}
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

const ViewProctorsDialog = ({
  open,
  onOpenChange,
  assignments: proctorAssignments,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  assignments: ScheduleAssignment[];
}) => {
  const proctorsPagination = useDetailListPagination(proctorAssignments, {
    pageSize: 12,
    threshold: 12,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="size-4" />
            Assigned Proctors
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-1 max-h-80 overflow-y-auto">
          {proctorsPagination.visibleItems.map((a, i) => {
            const sup = a.proctor;
            return (
              <div
                key={a.id ?? i}
                className="flex items-center gap-3 p-3 rounded-none border border-zinc-200/60 bg-zinc-50/40 dark:border-zinc-800/60 dark:bg-zinc-900/40"
              >
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-none bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200 font-semibold text-sm">
                  {(sup?.user?.name?.[0] ?? "?").toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-zinc-950 truncate dark:text-zinc-100">
                    {sup?.user?.name ?? "Unknown"}
                  </div>
                  {sup?.user?.email && (
                    <div className="text-xs text-zinc-500 flex items-center gap-1 truncate dark:text-zinc-400">
                      <Mail className="size-3 shrink-0" />
                      {sup.user.email}
                    </div>
                  )}
                  {(sup?.center?.name ?? sup?.department) && (
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      {sup?.center?.name ?? sup?.department}
                    </div>
                  )}
                  {a.room?.name && (
                    <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                      <DoorOpen className="size-3 shrink-0" />
                      {a.room.name}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {proctorsPagination.shouldPaginate && (
          <div className="flex items-center justify-between gap-3 border border-zinc-200/60 bg-white px-4 py-3 text-xs text-zinc-600">
            <p>
              Showing <span className="font-semibold text-zinc-900">{proctorsPagination.start}</span>-<span className="font-semibold text-zinc-900">{proctorsPagination.end}</span> of <span className="font-semibold text-zinc-900">{proctorsPagination.total}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={proctorsPagination.page <= 1}
                onClick={() => proctorsPagination.setPage(proctorsPagination.page - 1)}
                className="h-8 rounded-none px-2"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="font-semibold text-zinc-900">
                Page {proctorsPagination.page} of {proctorsPagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={proctorsPagination.page >= proctorsPagination.totalPages}
                onClick={() => proctorsPagination.setPage(proctorsPagination.page + 1)}
                className="h-8 rounded-none px-2"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-none h-9"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AssignmentDetailsSheet = ({
  assignment,
  assignments,
  isFinal,
  onOpenChange,
}: {
  assignment: ScheduleAssignment | null;
  assignments: ScheduleAssignment[];
  isFinal?: boolean;
  onOpenChange: (next: boolean) => void;
}) => {
  const open = Boolean(assignment);
  const a = assignment;
  const courseOffering = a?.exam?.courseOffering;
  const course = courseOffering?.course;
  const sem = courseOffering?.semester;
  const ts = a?.timeSlot;
  const registrations = courseOffering?.registrations ?? [];
  const studentsCount =
    registrations.length || courseOffering?.expectedStudents || 0;
  const registrationsPagination = useDetailListPagination(registrations, {
    pageSize: 25,
    threshold: 25,
  });
  const groupedAssignments = useMemo(() => {
    if (!a) return [] as ScheduleAssignment[];
    return assignments.filter(
      (candidate) =>
        candidate.examId === a.examId && candidate.timeSlotId === a.timeSlotId
    );
  }, [a, assignments]);
  const groupedRooms = useMemo(() => {
    const roomGroups = new Map<string, {
      room: ScheduleAssignment["room"];
      assignments: ScheduleAssignment[];
      proctors: Array<NonNullable<ScheduleAssignment["proctor"]>>;
    }>();

    for (const item of groupedAssignments) {
      const roomKey = item.room?.id ?? item.roomId ?? item.id;
      const existing = roomGroups.get(roomKey) ?? {
        room: item.room ?? null,
        assignments: [],
        proctors: [],
      };

      existing.assignments.push(item);

      if (!existing.room && item.room) {
        existing.room = item.room;
      }

      if (item.proctor?.id && !existing.proctors.some((proctor) => proctor.id === item.proctor?.id)) {
        existing.proctors.push(item.proctor);
      }

      roomGroups.set(roomKey, existing);
    }

    return Array.from(roomGroups.values());
  }, [groupedAssignments]);
  const totalAllocatedCapacity = useMemo(
    () => groupedRooms.reduce((sum, group) => sum + (group.room?.capacity ?? 0), 0),
    [groupedRooms]
  );

  // The schedule schema does not model `program` directly, but the API
  // includes it on the courseOffering / course payload when available.
  const programInfo =
    (courseOffering as unknown as {
      program?: { id?: string; name?: string; code?: string };
    } | null | undefined)?.program ??
    (course as unknown as {
      program?: { id?: string; name?: string; code?: string };
    } | null | undefined)?.program ??
    null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl bg-zinc-50 p-0 flex flex-col"
      >
        {/* Premium header */}
        <SheetHeader className="bg-white border-b border-zinc-200/70 px-5 py-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wide text-zinc-700">
                  {course?.code ?? "Not assigned"}
                </span>
                {sem?.name && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    <CalendarDays className="size-3" />
                    {sem.name}
                  </span>
                )}
              </div>
              <SheetTitle className="text-lg leading-tight mt-1.5 truncate text-zinc-950">
                {course?.title ?? course?.name ?? "Untitled course"}
              </SheetTitle>
              <SheetDescription className="sr-only">
                Assignment details for {course?.title ?? course?.code ?? "exam"}.
              </SheetDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ExamStatusBadge
              status={getAssignmentDisplayStatus({
                status: a?.exam?.status,
                isFinal,
              })}
              variant="pill"
            />
          </div>
        </SheetHeader>

        {a ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Course Info */}
            <SheetSection icon={ClipboardList} title="Course Info">
              <div className="divide-y divide-zinc-100">
                <KVRow
                  label="Title"
                  value={course?.title ?? course?.name ?? "Not assigned"}
                />
                <KVRow
                  label="Code"
                  value={
                    <span className="font-mono text-zinc-700">
                      {course?.code ?? "Not assigned"}
                    </span>
                  }
                />
                {course?.credits != null && (
                  <KVRow label="Credits" value={course.credits} />
                )}
                <KVRow label="Semester" value={sem?.name ?? "Not assigned"} />
              </div>
            </SheetSection>

            {/* Program (only if available) */}
            {programInfo?.name && (
              <SheetSection icon={BookOpen} title="Program">
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-none bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200">
                    <GraduationCap className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-zinc-950 truncate">
                      {programInfo.name}
                    </div>
                    {programInfo.code && (
                      <div className="text-xs text-zinc-500 font-mono mt-0.5">
                        {programInfo.code}
                      </div>
                    )}
                  </div>
                </div>
              </SheetSection>
            )}

            {/* Time Slot */}
            <SheetSection icon={Clock} title="Time Slot">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-none border border-zinc-200/60 bg-zinc-50/40 p-3">
                  <div className="text-[10px] uppercase tracking-wide font-semibold text-zinc-500">
                    Date
                  </div>
                  <div className="mt-1 text-sm font-semibold text-zinc-950">
                    {formatDate(ts?.date ?? ts?.startTime) || "Not assigned"}
                  </div>
                </div>
                <div className="rounded-none border border-zinc-200/60 bg-zinc-50/40 p-3">
                  <div className="text-[10px] uppercase tracking-wide font-semibold text-zinc-500">
                    Start – End
                  </div>
                  <div className="mt-1 text-sm font-semibold text-zinc-950 tabular-nums">
                    {formatTime(ts?.startTime)} – {formatTime(ts?.endTime)}
                  </div>
                </div>
                <div className="rounded-none border border-zinc-200/60 bg-zinc-50/40 p-3">
                  <div className="text-[10px] uppercase tracking-wide font-semibold text-zinc-500">
                    Duration
                  </div>
                  <div className="mt-1 text-sm font-semibold text-zinc-950">
                    {a.exam?.duration != null
                      ? `${a.exam.duration} min`
                      : ts?.duration != null
                      ? `${ts.duration} min`
                      : "—"}
                  </div>
                </div>
              </div>
            </SheetSection>

            {/* Room & Center */}
            <SheetSection icon={DoorOpen} title="Room & Center">
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-none border border-zinc-200/60 bg-zinc-50/40 p-3">
                    <div className="text-[10px] uppercase tracking-wide font-semibold text-zinc-500">
                      Rooms
                    </div>
                    <div className="mt-1 text-sm font-semibold text-zinc-950 tabular-nums">
                      {groupedRooms.length}
                    </div>
                  </div>
                  <div className="rounded-none border border-zinc-200/60 bg-zinc-50/40 p-3">
                    <div className="text-[10px] uppercase tracking-wide font-semibold text-zinc-500">
                      Total Capacity
                    </div>
                    <div className="mt-1 text-sm font-semibold text-zinc-950 tabular-nums">
                      {totalAllocatedCapacity}
                    </div>
                  </div>
                  <div className="rounded-none border border-zinc-200/60 bg-zinc-50/40 p-3">
                    <div className="text-[10px] uppercase tracking-wide font-semibold text-zinc-500">
                      Needed Seats
                    </div>
                    <div className="mt-1 text-sm font-semibold text-zinc-950 tabular-nums">
                      {studentsCount}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {groupedRooms.map((group, index) => (
                    <div
                      key={group.room?.id ?? `${group.room?.name ?? "room"}-${index}`}
                      className="rounded-none border border-zinc-200/60 bg-zinc-50/40 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
                            <DoorOpen className="size-4 text-emerald-700" />
                            <span className="truncate">{group.room?.name ?? "Not assigned"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <MapPin className="size-3.5" />
                            <span className="truncate">{group.room?.center?.name ?? "No center"}</span>
                          </div>
                        </div>
                        <div className="shrink-0 text-right text-xs text-zinc-500">
                          <div className="font-semibold text-zinc-950 tabular-nums">
                            {group.room?.capacity ?? 0} Seats
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 border-t border-zinc-200/70 pt-3">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                          Assigned Proctors
                        </div>
                        {group.proctors.length === 0 ? (
                          <div className="mt-2 text-sm text-zinc-500">No proctor</div>
                        ) : (
                          <div className="mt-2 space-y-2">
                            {group.proctors.map((proctor) => (
                              <div key={proctor.id} className="flex items-start gap-2 text-sm text-zinc-700">
                                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-zinc-400" />
                                <div className="min-w-0">
                                  <div className="truncate font-medium text-zinc-900">
                                    {proctor.user?.name ?? "No proctor"}
                                  </div>
                                  {proctor.user?.email && (
                                    <div className="truncate text-xs text-zinc-500">{proctor.user.email}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SheetSection>

            {/* Proctor(s) */}
            <SheetSection
              icon={UserCheck}
              title={groupedAssignments.length > 1 ? `Proctors (${groupedAssignments.length})` : "Proctor"}
            >
              {groupedAssignments.length === 0 || !groupedAssignments[0]?.proctor ? (
                <div className="text-sm text-zinc-500">Not assigned</div>
              ) : (
                <div className="space-y-2">
                  {groupedAssignments.map((item, idx) => {
                    const sup = item.proctor;
                    if (!sup?.user?.name) return null;
                    return (
                      <div key={item.id ?? idx} className="flex items-center gap-3">
                        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-none bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200 font-semibold text-sm">
                          {(sup.user.name?.[0] ?? "?").toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-zinc-950 truncate">
                            {sup.user.name}
                          </div>
                          {sup.user.email && (
                            <div className="text-xs text-zinc-500 mt-0.5 truncate flex items-center gap-1">
                              <Mail className="size-3" />
                              {sup.user.email}
                            </div>
                          )}
                          {sup.department && (
                            <div className="text-[11px] text-zinc-400 mt-0.5">
                              {sup.department}
                            </div>
                          )}
                        </div>
                        {item.room?.name && groupedAssignments.length > 1 && (
                          <span className="shrink-0 text-[11px] text-zinc-500 flex items-center gap-1">
                            <DoorOpen className="size-3" />
                            {item.room.name}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </SheetSection>

            {/* Exam Status & Duration */}
            <SheetSection icon={GraduationCap} title="Exam">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-none border border-zinc-200/60 bg-zinc-50/40 p-3">
                  <div className="text-[10px] uppercase tracking-wide font-semibold text-zinc-500">
                    Status
                  </div>
                  <div className="mt-1.5">
                    <ExamStatusBadge
                      status={getAssignmentDisplayStatus({
                        status: a?.exam?.status,
                        isFinal,
                      })}
                      variant="pill"
                    />
                  </div>
                </div>
                <div className="rounded-none border border-zinc-200/60 bg-zinc-50/40 p-3">
                  <div className="text-[10px] uppercase tracking-wide font-semibold text-zinc-500">
                    Duration
                  </div>
                  <div className="mt-1 text-sm font-semibold text-zinc-950 tabular-nums">
                    {a.exam?.duration != null ? `${a.exam.duration} min` : "—"}
                  </div>
                </div>
                <div className="rounded-none border border-zinc-200/60 bg-zinc-50/40 p-3">
                  <div className="text-[10px] uppercase tracking-wide font-semibold text-zinc-500">
                    Students
                  </div>
                  <div className="mt-1 text-sm font-semibold text-zinc-950 tabular-nums">
                    {studentsCount}
                  </div>
                </div>
              </div>
            </SheetSection>

            {/* Enrolled Students */}
            <SheetSection
              icon={Users}
              title="Enrolled Students"
              hint={`${registrations.length} ${
                registrations.length === 1 ? "student" : "students"
              }`}
            >
              {registrations.length === 0 ? (
                <div className="text-sm text-zinc-500 py-1">
                  No students are registered for this exam.
                </div>
              ) : (
                <>
                  <ul className="-mx-1 max-h-72 divide-y divide-zinc-100 overflow-y-auto px-1">
                    {registrationsPagination.visibleItems.map((reg, idx) => {
                      const u = reg.student?.user;
                      const name = u?.name ?? "Unknown student";
                      const email = u?.email;
                      const initial = (name?.[0] ?? "?").toUpperCase();
                      return (
                        <li
                          key={reg.id ?? `${reg.studentId}-${idx}`}
                          className="flex items-center gap-3 py-2.5"
                        >
                          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-none bg-zinc-100 text-xs font-semibold text-zinc-700 ring-1 ring-inset ring-zinc-200">
                            {initial}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-zinc-950 truncate">
                              {name}
                            </div>
                            {email && (
                              <div className="text-xs text-zinc-500 truncate flex items-center gap-1">
                                <Mail className="size-3" />
                                {email}
                              </div>
                            )}
                          </div>
                          {reg.status && (
                            <span className="text-[10px] uppercase tracking-wide font-semibold text-zinc-600 bg-zinc-50 border border-zinc-200 px-1.5 py-0.5 rounded-full">
                              {reg.status}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  {registrationsPagination.shouldPaginate && (
                    <div className="flex items-center justify-between gap-3 border border-zinc-200/60 bg-white px-4 py-3 text-xs text-zinc-600">
                      <p>
                        Showing <span className="font-semibold text-zinc-900">{registrationsPagination.start}</span>-<span className="font-semibold text-zinc-900">{registrationsPagination.end}</span> of <span className="font-semibold text-zinc-900">{registrationsPagination.total}</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={registrationsPagination.page <= 1}
                          onClick={() => registrationsPagination.setPage(registrationsPagination.page - 1)}
                          className="h-8 rounded-none px-2"
                        >
                          <ChevronLeft className="size-4" />
                        </Button>
                        <span className="font-semibold text-zinc-900">
                          Page {registrationsPagination.page} of {registrationsPagination.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={registrationsPagination.page >= registrationsPagination.totalPages}
                          onClick={() => registrationsPagination.setPage(registrationsPagination.page + 1)}
                          className="h-8 rounded-none px-2"
                        >
                          <ChevronRight className="size-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </SheetSection>

          </div>
        ) : null}

        <SheetFooter className="bg-white border-t border-zinc-200/70 px-5 py-3 flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-none h-10 border-zinc-200 font-semibold ml-auto"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

const EditAssignmentDialog = ({
  assignment,
  isPublished,
  onOpenChange,
  onChanged,
}: {
  assignment: ScheduleAssignmentListItem | null;
  isPublished: boolean;
  onOpenChange: (next: boolean) => void;
  onChanged?: (scheduleId: string) => void;
}) => {
  const open = Boolean(assignment);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-none border border-zinc-200/80 bg-white p-0 shadow-xl shadow-zinc-950/15 dark:border-zinc-800/80 dark:bg-zinc-950 dark:shadow-black/50 sm:max-w-2xl">
        <DialogHeader className="border-b border-zinc-200/70 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),rgba(244,244,245,0.96)_45%,rgba(228,228,231,0.88))] px-6 py-5 text-left dark:border-zinc-800/80 dark:bg-[radial-gradient(circle_at_top_left,rgba(39,39,42,0.96),rgba(24,24,27,0.98)_44%,rgba(9,9,11,0.98))]">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-none border border-zinc-200 bg-white text-zinc-950 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
              <Pencil className="size-5" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Edit Assignment</DialogTitle>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Update room, proctor, time slot, and exam metadata for the selected scheduled exam.
              </p>
            </div>
          </div>
        </DialogHeader>
        {assignment ? (
          <EditAssignmentForm
            key={assignment.id}
            assignment={assignment}
            isPublished={isPublished}
            onClose={() => onOpenChange(false)}
            onChanged={onChanged}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

const PUBLISHED_EXAM_STATUS_OPTIONS = [
  "SCHEDULED",
  "COMPLETED",
  "CANCELLED",
] as const;
type ExamStatusValue = (typeof PUBLISHED_EXAM_STATUS_OPTIONS)[number];

const EditAssignmentForm = ({
  assignment,
  isPublished,
  onClose,
  onChanged,
}: {
  assignment: ScheduleAssignmentListItem;
  isPublished: boolean;
  onClose: () => void;
  onChanged?: (scheduleId: string) => void;
}) => {
  const updateMutation = useUpdateAssignment();
  const [roomSearch, setRoomSearch] = useState("");
  const [proctorSearch, setProctorSearch] = useState("");
  const [proctorPickerOpen, setProctorPickerOpen] = useState(false);
  const roomsQuery = useRooms();
  const proctorsQuery = useProctors();
  const timeSlotsQuery = useTimeSlots();
  const groupedAssignments = useMemo(
    () => assignment.logicalAssignments?.length ? assignment.logicalAssignments : [assignment],
    [assignment]
  );

  const [roomId, setRoomId] = useState<string>(assignment.roomId ?? "");
  const [selectedProctorIds, setSelectedProctorIds] = useState<string[]>(() => groupedAssignments.map((item) => item.proctorId ?? ""));
  const [timeSlotId, setTimeSlotId] = useState<string>(
    assignment.timeSlotId ?? ""
  );

  const initialDuration =
    assignment.exam?.duration != null ? String(assignment.exam.duration) : "";
  const currentDisplayStatus = getAssignmentDisplayStatus({
    status: assignment.exam?.status,
    isFinal: isPublished,
  });
  const initialStatus = isPublished && PUBLISHED_EXAM_STATUS_OPTIONS.includes(currentDisplayStatus as ExamStatusValue)
    ? (currentDisplayStatus as ExamStatusValue)
    : "";

  const [duration, setDuration] = useState<string>(initialDuration);
  const [status, setStatus] = useState<ExamStatusValue | "">(initialStatus);

  const rooms = useMemo(() => roomsQuery.data ?? [], [roomsQuery.data]);
  const proctors = useMemo(() => proctorsQuery.data ?? [], [proctorsQuery.data]);
  const timeSlots = useMemo(() => timeSlotsQuery.data ?? [], [timeSlotsQuery.data]);
  const timeSlotOptions = useMemo(() => {
    if (!assignment.timeSlot?.id || timeSlots.some((timeSlot) => timeSlot.id === assignment.timeSlot?.id)) return timeSlots;
    return [assignment.timeSlot, ...timeSlots];
  }, [assignment.timeSlot, timeSlots]);
  const roomName = assignment.roomIds.length > 1 ? `${assignment.roomIds.length} rooms assigned` : assignment.room?.name ?? "Unassigned room";
  const centerName = assignment.room?.center?.name ?? "No center";
  const proctorName = assignment.proctorIds.length > 1
    ? `${assignment.proctorIds.length} proctors assigned`
    : (assignment.proctor as { user?: { name?: string | null } | null } | null)?.user?.name ?? "Unassigned proctor";
  const roomOptions = useMemo(() => {
    if (!assignment.room?.id || rooms.some((room) => room.id === assignment.room?.id)) return rooms;
    return [assignment.room, ...rooms];
  }, [assignment.room, rooms]);
  const proctorOptions = useMemo(() => {
    if (!assignment.proctor?.id || proctors.some((proctor) => proctor.id === assignment.proctor?.id)) return proctors;
    return [assignment.proctor, ...proctors];
  }, [assignment.proctor, proctors]);
  const filteredRoomOptions = useMemo(() => {
    const term = roomSearch.trim().toLowerCase();
    if (!term) return roomOptions;
    return roomOptions.filter((room) => [room.name, room.center?.name, String(room.capacity ?? "")]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLowerCase().includes(term)));
  }, [roomOptions, roomSearch]);
  const getProctorOptionName = useCallback((proctor: (typeof proctorOptions)[number]) =>
    proctor.user?.name ?? (proctor as { name?: string }).name ?? "—", []);
  const getProctorOptionEmail = useCallback((proctor: (typeof proctorOptions)[number]) =>
    proctor.user?.email ?? (proctor as { email?: string }).email, []);
  const filteredProctorOptions = useMemo(() => {
    const term = proctorSearch.trim().toLowerCase();
    if (!term) return proctorOptions;
    return proctorOptions.filter((proctor) => [getProctorOptionName(proctor), getProctorOptionEmail(proctor), proctor.department]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLowerCase().includes(term)));
  }, [getProctorOptionEmail, getProctorOptionName, proctorOptions, proctorSearch]);
  const isProctorUnavailableForSelectedSlot = (proctor: (typeof proctorOptions)[number]) => {
    const availableTimeSlots = (proctor as { availableTimeSlots?: Array<{ id?: string; timeSlotId?: string; timeSlot?: { id?: string } }> }).availableTimeSlots;
    if (!timeSlotId || !Array.isArray(availableTimeSlots)) return false;
    return !availableTimeSlots.some((slot) => (slot.id ?? slot.timeSlotId ?? slot.timeSlot?.id) === timeSlotId);
  };
  const selectedProctors = useMemo(
    () => selectedProctorIds
      .map((selectedId) => proctorOptions.find((proctor) => proctor.id === selectedId) ?? null)
      .filter((proctor): proctor is (typeof proctorOptions)[number] => proctor !== null),
    [proctorOptions, selectedProctorIds]
  );
  const duplicateSelectedProctorIds = new Set(
    selectedProctorIds.filter((selectedId, index) => selectedId && selectedProctorIds.indexOf(selectedId) !== index)
  );
  const selectedProctorAvailabilityError = selectedProctors.some((proctor) => proctor && isProctorUnavailableForSelectedSlot(proctor))
    ? "One or more selected proctors are not available for the selected time slot."
    : duplicateSelectedProctorIds.size > 0
      ? "Each assignment row must have a different proctor selected."
      : selectedProctorIds.length !== groupedAssignments.length
        ? `Select ${groupedAssignments.length} proctor${groupedAssignments.length === 1 ? "" : "s"} for this assignment.`
        : undefined;
  const selectedRoomLabel = useMemo(() => {
    const selectedRoom = roomOptions.find((room) => room.id === roomId);
    if (!selectedRoom) return roomName;
    return selectedRoom.center?.name ? `${selectedRoom.name} • ${selectedRoom.center.name}` : selectedRoom.name;
  }, [roomId, roomName, roomOptions]);
  const selectedProctorSummaryLabel = useMemo(() => {
    if (selectedProctors.length === 0) return `Select ${groupedAssignments.length} proctor${groupedAssignments.length === 1 ? "" : "s"}`;
    if (selectedProctors.length === 1) return getProctorOptionName(selectedProctors[0]);
    return `${selectedProctors.length} proctors selected`;
  }, [getProctorOptionName, groupedAssignments.length, selectedProctors]);

  const trimmedDuration = duration.trim();
  const parsedDuration =
    trimmedDuration === "" ? null : Number.parseInt(trimmedDuration, 10);
  const durationInvalid =
    trimmedDuration !== "" &&
    (Number.isNaN(parsedDuration) || (parsedDuration ?? 0) <= 0);

  const dirty = isPublished
    ? status !== currentDisplayStatus
    : roomId !== assignment.roomId ||
      [...selectedProctorIds].sort().join(":") !== [...groupedAssignments.map((item) => item.proctorId ?? "")].sort().join(":") ||
      timeSlotId !== assignment.timeSlotId ||
      parsedDuration !== (assignment.exam?.duration ?? null);

  const toggleSelectedProctor = (proctorId: string) => {
    setSelectedProctorIds((current) => {
      if (current.includes(proctorId)) {
        return current.filter((id) => id !== proctorId);
      }
      if (current.length >= groupedAssignments.length) {
        return current;
      }
      return [...current, proctorId];
    });
  };

  const removeSelectedProctor = (proctorId: string) => {
    setSelectedProctorIds((current) => current.filter((id) => id !== proctorId));
  };

  const isProctorOptionDisabled = (proctor: (typeof proctorOptions)[number]) => {
    const alreadySelected = selectedProctorIds.includes(proctor.id ?? "");
    if (isProctorUnavailableForSelectedSlot(proctor) && !alreadySelected) return true;
    if (!alreadySelected && selectedProctorIds.length >= groupedAssignments.length) return true;
    return false;
  };

  const getProctorOptionDisabledReason = (proctor: (typeof proctorOptions)[number]) => {
    const alreadySelected = selectedProctorIds.includes(proctor.id ?? "");
    if (isProctorUnavailableForSelectedSlot(proctor) && !alreadySelected) return "Unavailable for selected time slot";
    if (!alreadySelected && selectedProctorIds.length >= groupedAssignments.length) {
      return `Only ${groupedAssignments.length} proctor${groupedAssignments.length === 1 ? "" : "s"} can be selected`;
    }
    return undefined;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!dirty || durationInvalid || (!isPublished && selectedProctorAvailabilityError)) return;

    const payload: {
      assignmentIds?: string[];
      roomId?: string;
      proctorId?: string;
      proctorIds?: string[];
      timeSlotId?: string;
      exam?: { duration?: number; status?: ExamStatusValue };
    } = {};

    if (!isPublished) {
      if (assignment.assignmentIds.length > 1) payload.assignmentIds = assignment.assignmentIds;
      if (roomId !== assignment.roomId) payload.roomId = roomId;
      if (assignment.assignmentIds.length > 1) {
        if ([...selectedProctorIds].sort().join(":") !== [...groupedAssignments.map((item) => item.proctorId ?? "")].sort().join(":")) {
          payload.proctorIds = selectedProctorIds;
        }
      } else if (selectedProctorIds[0] !== assignment.proctorId) {
        payload.proctorId = selectedProctorIds[0];
      }
      if (timeSlotId !== assignment.timeSlotId)
        payload.timeSlotId = timeSlotId;
    }

    const examPatch: { duration?: number; status?: ExamStatusValue } = {};
    if (!isPublished && parsedDuration !== (assignment.exam?.duration ?? null)) {
      if (parsedDuration != null) examPatch.duration = parsedDuration;
    }
    if (isPublished && status !== currentDisplayStatus) {
      if (status) examPatch.status = status;
    }
    if (Object.keys(examPatch).length > 0) payload.exam = examPatch;

    updateMutation.mutate(
      {
        scheduleId: assignment.scheduleId,
        assignmentId: assignment.id,
        data: payload,
      },
      {
        onSuccess: () => {
          onChanged?.(assignment.scheduleId);
          onClose();
          updateMutation.reset();
        },
      }
    );
  };

  const errorMessage = updateMutation.isError
    ? getApiErrorMessage(updateMutation.error, "Failed to update assignment.")
    : undefined;

  const isPending = updateMutation.isPending;
  const course = assignment.exam?.courseOffering?.course;
  const scheduleName = assignment.schedule?.name ?? "Current schedule";
  const timeSlotLabel = formatTimeSlotLabel(assignment.timeSlot, "Time slot not set");
  const selectedTimeSlotLabel = useMemo(() => {
    const selectedTimeSlot = timeSlotOptions.find((timeSlot) => timeSlot.id === timeSlotId);
    return selectedTimeSlot ? formatTimeSlotLabel(selectedTimeSlot, timeSlotLabel) : timeSlotLabel;
  }, [timeSlotId, timeSlotLabel, timeSlotOptions]);

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-none border border-zinc-200 bg-zinc-50/80 px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-black/20 md:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Exam</p>
            <p className="mt-1 text-sm font-semibold text-zinc-950 dark:text-zinc-100">
              {course?.title ?? course?.name ?? "Selected exam"}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {[course?.code, scheduleName].filter(Boolean).join(" · ") || "Assignment details"}
            </p>
          </div>
          <div className="rounded-none border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80 dark:shadow-black/20">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Current slot</p>
            <p className="mt-1 text-sm font-semibold text-zinc-950 dark:text-zinc-100">{timeSlotLabel}</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-none border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80 dark:shadow-black/20">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Assigned room</p>
            <p className="mt-1 text-sm font-semibold text-zinc-950 dark:text-zinc-100">{roomName}</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{centerName}</p>
          </div>
          <div className="rounded-none border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80 dark:shadow-black/20">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Assigned proctors</p>
            <p className="mt-1 text-sm font-semibold text-zinc-950 dark:text-zinc-100">{proctorName}</p>
          </div>
          <div className="rounded-none border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80 dark:shadow-black/20">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Exam status</p>
            <div className="mt-1">
              <ExamStatusBadge status={isPublished ? status || currentDisplayStatus : currentDisplayStatus} />
            </div>
          </div>
        </div>

        {!isPublished ? (
          <>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:*:min-w-0">
          <div className="min-w-0 space-y-2">
            <Label htmlFor="edit-room" className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Room</Label>
        <AsyncSearchSelect
          value={roomId}
          selectedLabel={selectedRoomLabel}
          placeholder="Select a room"
          searchPlaceholder="Search rooms by name"
          options={filteredRoomOptions}
          searchValue={roomSearch}
          onSearchChange={setRoomSearch}
          onValueChange={setRoomId}
          getOptionValue={(room) => room.id ?? ""}
          getOptionLabel={(room) => room.name}
          renderOption={(room) => (
            <>
              {room.name}
              {room.capacity != null ? <span className="ml-1 text-xs text-zinc-400">· cap {room.capacity}</span> : null}
              {room.center?.name ? <span className="ml-1 text-xs text-zinc-400">· {room.center.name}</span> : null}
            </>
          )}
          disabled={isPending || roomsQuery.isLoading}
          isLoading={roomsQuery.isFetching}
          className="h-11 min-w-0 bg-zinc-50/40 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-100"
        />
      </div>

          <div className="min-w-0 space-y-2">
            <Label htmlFor="edit-proctor" className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              {groupedAssignments.length > 1 ? `Proctors (${groupedAssignments.length})` : "Proctor"}
            </Label>
        <Popover open={proctorPickerOpen} onOpenChange={setProctorPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={isPending || proctorsQuery.isLoading}
              className={cn(
                "min-h-11 h-auto w-full justify-between rounded-none border-zinc-200 bg-zinc-50/40 px-3 py-2 text-left text-sm font-normal shadow-sm hover:border-zinc-300 hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-100",
                selectedProctorAvailabilityError && "border-destructive/60 bg-destructive/5"
              )}
            >
              <span className={cn("min-w-0 flex-1 whitespace-normal wrap-anywhere text-left leading-4", selectedProctorIds.length === 0 && "text-zinc-500")}>
                {selectedProctorSummaryLabel}
              </span>
              <ChevronDown className="ml-2 size-4 shrink-0 text-zinc-400" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
            <div className="border-b border-zinc-200 p-2 dark:border-zinc-800">
              <Input
                value={proctorSearch}
                onChange={(event) => setProctorSearch(event.target.value)}
                placeholder="Search proctors by name or email"
                className="h-9 rounded-none border-zinc-200 text-sm shadow-none dark:border-zinc-700"
              />
              <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                Select {groupedAssignments.length} proctor{groupedAssignments.length === 1 ? "" : "s"} for this assignment.
              </p>
            </div>
            <div className="max-h-72 overflow-y-auto p-1">
              {proctorsQuery.isFetching ? (
                <div className="flex items-center gap-2 px-2 py-3 text-sm text-zinc-500">
                  <Loader2 className="size-4 animate-spin" />
                  Loading
                </div>
              ) : filteredProctorOptions.length === 0 ? (
                <div className="px-2 py-3 text-sm text-zinc-500">No results found</div>
              ) : (
                filteredProctorOptions.map((proctor) => {
                  const proctorId = proctor.id ?? "";
                  const selected = selectedProctorIds.includes(proctorId);
                  const disabled = isProctorOptionDisabled(proctor);
                  const disabledReason = getProctorOptionDisabledReason(proctor);
                  return (
                    <button
                      key={proctorId}
                      type="button"
                      disabled={disabled}
                      title={disabledReason}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-none px-2 py-2 text-left text-sm outline-none transition-colors hover:bg-zinc-100 focus:bg-zinc-100 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800",
                        disabled && "cursor-not-allowed opacity-50 hover:bg-transparent focus:bg-transparent"
                      )}
                      onClick={() => toggleSelectedProctor(proctorId)}
                    >
                      <Check className={cn("size-4 shrink-0", selected ? "opacity-100" : "opacity-0")} />
                      <span className="min-w-0 flex-1 whitespace-normal wrap-anywhere leading-4">
                        {getProctorOptionName(proctor)}
                        {getProctorOptionEmail(proctor) ? <span className="ml-1 text-xs text-zinc-400">· {getProctorOptionEmail(proctor)}</span> : null}
                        {disabledReason ? <span className="mt-0.5 block text-xs text-zinc-500">{disabledReason}</span> : null}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </PopoverContent>
        </Popover>
        {selectedProctorIds.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedProctorIds.map((selectedId) => {
              const selectedProctor = proctorOptions.find((proctor) => proctor.id === selectedId);
              const label = selectedProctor ? getProctorOptionName(selectedProctor) : selectedId;
              return (
                <Badge key={selectedId} variant="secondary" className="rounded-none border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                  <span className="max-w-56 truncate">{label}</span>
                  <button
                    type="button"
                    onClick={() => removeSelectedProctor(selectedId)}
                    className="ml-1 inline-flex size-4 items-center justify-center rounded-none hover:bg-zinc-200/70 dark:hover:bg-zinc-800"
                    aria-label={`Remove ${label}`}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        ) : null}
        {selectedProctorAvailabilityError ? (
          <p className="text-[11px] text-rose-600 dark:text-rose-400">{selectedProctorAvailabilityError}</p>
        ) : null}
      </div>
        </div>

        <div className="space-y-2">
            <Label htmlFor="edit-timeslot" className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Time Slot</Label>
            <Select
              value={timeSlotId}
              onValueChange={setTimeSlotId}
              disabled={isPending || timeSlotsQuery.isLoading}
            >
              <SelectTrigger
                id="edit-timeslot"
                title={selectedTimeSlotLabel}
                className="min-h-11 h-auto rounded-none border-zinc-200 bg-zinc-50/40 py-2 shadow-sm hover:border-zinc-300 focus-visible:ring-zinc-300/50 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-100 dark:hover:border-zinc-600 dark:focus-visible:ring-zinc-700"
              >
                <SelectValue placeholder="Select a time slot" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                {timeSlotOptions.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {formatTimeSlotLabel(t, "Time slot TBD")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="edit-duration" className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            Duration{" "}
            <span className="font-normal text-zinc-400 dark:text-zinc-500">(optional, min)</span>
          </Label>
          <Input
            id="edit-duration"
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="e.g. 90"
            className="h-11 rounded-none border-zinc-200 bg-zinc-50/40 shadow-sm hover:border-zinc-300 focus-visible:ring-zinc-300/50 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:border-zinc-600 dark:focus-visible:ring-zinc-700"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            disabled={isPending}
          />
          {durationInvalid && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400">
              Duration must be a positive whole number.
            </p>
          )}
        </div>
          </div>
          </>
        ) : (
          <div className="space-y-2 rounded-none border border-zinc-200 bg-zinc-50/80 px-4 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-black/20">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Published schedule control</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                Published schedules allow status updates while keeping the assigned room, proctor, and time locked.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status" className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                Status
              </Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as ExamStatusValue)}
                disabled={isPending}
              >
                <SelectTrigger id="edit-status" className="h-11 rounded-none border-zinc-200 bg-white shadow-sm hover:border-zinc-300 focus-visible:ring-zinc-300/50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-zinc-600 dark:focus-visible:ring-zinc-700">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                  {PUBLISHED_EXAM_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

      {errorMessage && (
          <div className="flex items-start gap-2 border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-300">
          <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
        </div>

        <DialogFooter className="mt-auto border-t border-zinc-200/70 bg-zinc-50/70 px-6 py-4 dark:border-zinc-800/80 dark:bg-zinc-900/70 sm:justify-between">
        <Button
          type="button"
          variant="outline"
            className="rounded-none border-zinc-200 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          onClick={onClose}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="rounded-none bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
          disabled={!dirty || durationInvalid || Boolean(selectedProctorAvailabilityError) || isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            isPublished ? "Update Status" : "Save Changes"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

const DeleteAssignmentDialog = ({
  assignment,
  onOpenChange,
  onChanged,
}: {
  assignment: ScheduleAssignmentListItem | null;
  onOpenChange: (next: boolean) => void;
  onChanged?: (scheduleId: string) => void;
}) => {
  const open = Boolean(assignment);
  const deleteMutation = useDeleteAssignment();
  const course = assignment?.exam?.courseOffering?.course;

  const handleConfirm = () => {
    if (!assignment) return;
    deleteMutation.mutate(
      {
        scheduleId: assignment.scheduleId,
        assignmentId: assignment.id,
        deleteGroup: true,
      },
      {
        onSuccess: () => {
          onChanged?.(assignment.scheduleId);
          onOpenChange(false);
          deleteMutation.reset();
        },
      }
    );
  };

  const errorMessage = deleteMutation.isError
    ? getApiErrorMessage(deleteMutation.error, "Failed to delete assignment.")
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Assignment</DialogTitle>
        </DialogHeader>
        <div className="mt-2 text-sm text-zinc-700">
          Are you sure you want to delete the saved schedule event for{" "}
          <span className="font-semibold text-zinc-950">
            {course?.title ?? course?.name ?? "this exam"}
          </span>
          {course?.code ? (
            <span className="text-zinc-500"> ({course.code})</span>
          ) : null}
          ? This removes all persisted assignment rows for this exam at the selected time slot. The exam, course, students, and registrations are preserved.
        </div>
        {errorMessage && (
          <div className="border border-rose-200 bg-rose-50 text-rose-700 text-xs p-2 mt-3">
            {errorMessage}
          </div>
        )}
        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            className="rounded-none"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="rounded-none"
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="size-4 mr-2" />
                Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export function SchedulesPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | undefined>(() => {
    return localStorage.getItem(SELECTED_SCHEDULE_STORAGE_KEY) ?? undefined;
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const [generateOpen, setGenerateOpen] = useState(false);
  const [publishTarget, setPublishTarget] = useState<Schedule | null>(null);

  // Filter state is declared before the assignment query so active values are passed as server params.

  // view mode (table | calendar)
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");

  const schedulesQuery = useSchedules({ limit: 100 });
  const schedules = useMemo(() => schedulesQuery.data?.data ?? [], [schedulesQuery.data?.data]);
  const knownScheduleIds = useMemo(() => new Set(schedules.map((schedule) => schedule.id)), [schedules]);

  const openGenerateFromRoute = searchParams.get("openGenerate") === "true";
  const routeView = searchParams.get("view");
  const routeScheduleId =
    searchParams.get("scheduleId") ?? searchParams.get("id") ?? undefined;
  const routeAssignmentId = searchParams.get("assignmentId") ?? undefined;

  useHighlightRow("data-schedule-id", routeScheduleId ?? null, schedules.length);

  const setGenerateDialogOpen = (next: boolean) => {
    setGenerateOpen(next);
    const nextParams = new URLSearchParams(searchParams);
    if (next) {
      nextParams.set("openGenerate", "true");
    } else {
      nextParams.delete("openGenerate");
    }
    setSearchParams(nextParams);
  };

  // Sync URL param → React state so the dialog `open` prop depends only on
  // `generateOpen`. This avoids a race condition where React Router's
  // `setSearchParams` and React's `setGenerateOpen` update in separate renders,
  // briefly making `openGenerateFromRoute=true` after `generateOpen` was set
  // to false, causing the dialog to flicker open for ~1s on close.
  useEffect(() => {
    if (openGenerateFromRoute && !generateOpen) {
      setGenerateOpen(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openGenerateFromRoute]);

  const hasLoadedSchedules = schedulesQuery.isSuccess;

  // Validate persisted and route schedule IDs against the live list before issuing detail queries.
  const effectiveId = useMemo(() => {
    if (!hasLoadedSchedules) return undefined;
    if (routeScheduleId && knownScheduleIds.has(routeScheduleId)) return routeScheduleId;
    if (selectedId && knownScheduleIds.has(selectedId)) return selectedId;
    return schedules[0]?.id;
  }, [hasLoadedSchedules, knownScheduleIds, routeScheduleId, schedules, selectedId]);

  useEffect(() => {
    if (!hasLoadedSchedules) return;

    if (routeScheduleId && !knownScheduleIds.has(routeScheduleId)) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("scheduleId");
      nextParams.delete("id");
      nextParams.delete("assignmentId");
      nextParams.delete("aPage");
      setSearchParams(nextParams, { replace: true });
    }

    if (selectedId && !knownScheduleIds.has(selectedId)) {
      setSelectedId(undefined);
      localStorage.removeItem(SELECTED_SCHEDULE_STORAGE_KEY);
    }
  }, [hasLoadedSchedules, knownScheduleIds, routeScheduleId, searchParams, selectedId, setSearchParams]);

  useEffect(() => {
    if (!effectiveId) return;
    localStorage.setItem(SELECTED_SCHEDULE_STORAGE_KEY, effectiveId);
  }, [effectiveId]);

  const scheduleQuery = useSchedule(effectiveId);
  const schedule: Schedule | undefined = scheduleQuery.data?.id === effectiveId ? scheduleQuery.data : undefined;
  // ---- Server-side paginated assignments ----
  // Filter state is declared before the query so active values can be passed as server params.
  // Use the full selected schedule when available so filter dropdowns cover all existing values.
  const nowMs = Date.now();
  const adminStatusOptions = useMemo(
    () => (schedule?.isFinal ? [...PUBLISHED_STATUS_FILTER_OPTIONS] : [...DRAFT_STATUS_FILTER_OPTIONS]),
    [schedule?.isFinal]
  );
  const filters = useAssignmentScheduleFilters(schedule?.assignments ?? [], nowMs, {
    statusOptions: adminStatusOptions,
    includePhaseFilter: false,
  });
  const search = filters.state.query;
  const setSearch = filters.setters.setQuery;
  const commandSearchText = searchParams.get('_hl');

  useEffect(() => {
    if (routeScheduleId && commandSearchText) {
      setSearch(commandSearchText);
      return;
    }

    if (!routeScheduleId) {
      setSearch('');
    }
  }, [commandSearchText, routeScheduleId, setSearch]);

  const [debouncedAssignmentSearch, setDebouncedAssignmentSearch] = useState(filters.state.query);
  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedAssignmentSearch(filters.state.query), 250);
    return () => window.clearTimeout(handle);
  }, [filters.state.query]);
  useEffect(() => {
    if (!adminStatusOptions.some((option) => option.value === filters.state.status)) {
      filters.setters.setStatus("all");
    }
  }, [adminStatusOptions, filters.setters, filters.state.status]);
  const ASSIGNMENT_PAGE_SIZE = 100;
  const assignmentPageParam = Number(searchParams.get("aPage") ?? "1");
  const assignmentSortField = "startTime";
  const assignmentSortDirection = filters.state.sort === "latest" ? "desc" : "asc";
  const assignmentPage =
    Number.isFinite(assignmentPageParam) && assignmentPageParam >= 1
      ? Math.floor(assignmentPageParam)
      : 1;
  const setAssignmentPage = (next: number) => {
    const nextParams = new URLSearchParams(searchParams);
    if (next <= 1) nextParams.delete("aPage");
    else nextParams.set("aPage", String(next));
    setSearchParams(nextParams, { replace: true });
  };

  const assignmentsQuery = useAssignmentsPage({
    scheduleId: effectiveId,
    page: assignmentPage,
    pageSize: ASSIGNMENT_PAGE_SIZE,
    search: debouncedAssignmentSearch,
    sortField: assignmentSortField,
    sortDirection: assignmentSortDirection,
    status: filters.state.status !== "all" ? filters.state.status : undefined,
    centerId: filters.state.center !== ALL ? filters.state.center : undefined,
    roomId: filters.state.room !== ALL ? filters.state.room : undefined,
    timeSlotId: filters.state.timeSlot !== ALL ? filters.state.timeSlot : undefined,
    proctorId: filters.state.proctor !== ALL ? filters.state.proctor : undefined,
    courseId: filters.state.course !== ALL ? filters.state.course : undefined,
    semesterId: undefined,
    phase: undefined,
    examDate: filters.state.examDate || undefined,
    startDate: filters.state.startDate || undefined,
    endDate: filters.state.endDate || undefined,
  });

  const assignmentsTotalPages = assignmentsQuery.data?.meta?.totalPages ?? 1;
  const assignmentsTotal = assignmentsQuery.data?.meta?.total ?? 0;
  const filteredAssignmentsTotal = assignmentsQuery.data?.meta?.logicalTotal ?? assignmentsTotal;
  const selectedScheduleSummary = schedule ?? schedules.find((item) => item.id === effectiveId);
  const scheduleAssignmentsCount = getScheduleAssignmentCount(selectedScheduleSummary) || filteredAssignmentsTotal;

  const publishMutation = usePublishSchedule();
  const unpublishMutation = useUnpublishSchedule();
  const semestersQuery = useSemesters();
  const semesters = useMemo(() => (semestersQuery.data ?? []) as SemesterOption[], [semestersQuery.data]);
  const activeSemesterId = useMemo(() => semesters.find(s => (s as { isActive?: boolean }).isActive)?.id, [semesters]);

  const showPageLoading = useDelayedLoading(schedulesQuery.isLoading, 800);

  const assignments: ScheduleAssignment[] = useMemo(
    () => assignmentsQuery.data?.data ?? [],
    [assignmentsQuery.data]
  );

  // Reset assignment page to 1 when any filter / search changes
  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (next.has("aPage")) {
        next.delete("aPage");
        return next;
      }
      return prev;
    }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveId, debouncedAssignmentSearch, filters.state.room, filters.state.proctor, filters.state.course, filters.state.semester, filters.state.center, filters.state.timeSlot, filters.state.status, filters.state.phase, filters.state.examDate, filters.state.startDate, filters.state.endDate, filters.state.sort]);

  const persistedAssignments = useMemo<ScheduleAssignmentListItem[]>(() => {
    const groups = new Map<string, ScheduleAssignment[]>();

    for (const assignment of assignments) {
      const key = `${assignment.examId}:${assignment.timeSlotId}`;
      const list = groups.get(key) ?? [];
      list.push(assignment);
      groups.set(key, list);
    }

    return Array.from(groups.values()).map((group) => {
      const primary = group[0];
      const assignmentIds = group.map((assignment) => assignment.id);
      const roomIds = [...new Set(group.map((assignment) => assignment.roomId).filter(Boolean))];
      const proctorIds = [...new Set(group.map((assignment) => assignment.proctorId).filter(Boolean))];
      const centerIds = [...new Set(group.map((assignment) => assignment.room?.center?.id).filter(Boolean))] as string[];
      const searchIndex = buildSearchIndex(
        ...group.flatMap((assignment) => [
          assignment.exam?.courseOffering?.course?.code,
          assignment.exam?.courseOffering?.course?.name,
          assignment.exam?.courseOffering?.course?.title,
          assignment.exam?.courseOffering?.semester?.name,
          assignment.exam?.status,
          assignment.schedule?.name,
          assignment.schedule?.examPeriod,
          assignment.room?.name,
          assignment.room?.center?.name,
          assignment.proctor?.user?.name,
          assignment.proctor?.user?.email,
          formatDate(assignment.timeSlot?.date ?? assignment.timeSlot?.startTime),
          formatTime(assignment.timeSlot?.startTime),
        ])
      );

      return {
        ...primary,
        assignmentIds,
        roomIds,
        proctorIds,
        centerIds,
        searchIndex,
        logicalAssignments: group,
      };
    });
  }, [assignments]);

  // Server handles filtering and sorting; client only groups the current page.
  const filteredAssignments = useMemo(
    () => persistedAssignments,
    [persistedAssignments]
  );
  const assignmentById = useMemo(
    () => new Map(assignments.map((assignment) => [assignment.id, assignment])),
    [assignments]
  );
  const {
    scrollRef: assignmentTableScrollRef,
    onScroll: onAssignmentTableScroll,
    virtualRows: virtualAssignmentRows,
    topPadding: assignmentTopPadding,
    bottomPadding: assignmentBottomPadding,
    isVirtualized: isAssignmentTableVirtualized,
    containerClassName: assignmentTableContainerClassName,
  } = useVirtualRows(filteredAssignments, { estimateRowHeight: 72, threshold: 80, maxHeight: 720 });

  const calendarAssignments = filteredAssignments;

  const stats = useMemo(() => {
    const rooms = new Set<string>();
    const proctors = new Set<string>();
    for (const a of assignments) {
      if (a.roomId) rooms.add(a.roomId);
      if (a.proctorId) proctors.add(a.proctorId);
    }
    return {
      total: scheduleAssignmentsCount,
      rooms: rooms.size,
      proctors: proctors.size,
    };
  }, [assignments, scheduleAssignmentsCount]);

  const versionCountOverrides = useMemo(() => {
    if (!effectiveId) return {} as Record<string, { assignments?: number }>;

    return {
      [effectiveId]: {
        assignments: scheduleAssignmentsCount,
      },
    };
  }, [effectiveId, scheduleAssignmentsCount]);

  // Selected assignment for the row actions
  const [viewAssignment, setViewAssignment] = useState<ScheduleAssignment | null>(null);
  const [editAssignment, setEditAssignment] = useState<ScheduleAssignmentListItem | null>(null);
  const [deleteAssignment, setDeleteAssignment] = useState<ScheduleAssignmentListItem | null>(null);
  const [viewProctors, setViewProctors] = useState<ScheduleAssignment[] | null>(null);
  const [lastHighlightedAssignmentId, setLastHighlightedAssignmentId] = useState<string | null>(null);

  // Bulk delete for assignments
  const deleteAssignmentMutation = useDeleteAssignment();
  const assignmentBulkDelete = useBulkDelete({
    entityName: "assignment",
    entityNamePlural: "assignments",
    deleteItem: (id) =>
      deleteAssignmentMutation.mutateAsync({ scheduleId: effectiveId!, assignmentId: id, deleteGroup: true }),
  });

  const clearFilters = filters.reset;
  const adminAssignmentFields = useMemo(
    () => filters.fields.filter((field) => field.key !== "semester"),
    [filters.fields]
  );
  const adminAssignmentBadges = useMemo(
    () => filters.badges.filter((badge) => badge.key !== "semester"),
    [filters.badges]
  );
  const activeAssignmentFilterCount = adminAssignmentBadges.length;
  const hasActiveFilters = filters.hasActiveFilters;
  const highlightedAssignmentId =
    routeAssignmentId && routeAssignmentId !== lastHighlightedAssignmentId
      ? routeAssignmentId
      : null;
  const activeViewMode = routeAssignmentId
    ? "table"
    : routeView === "calendar"
      ? "calendar"
      : routeView === "table"
        ? "table"
        : viewMode;

  useEffect(() => {
    if (!highlightedAssignmentId || activeViewMode !== "table") return;

    const row = document.querySelector<HTMLElement>(
      `[data-assignment-ids~="${highlightedAssignmentId}"]`
    );
    if (!row) return;

    row.scrollIntoView({ behavior: "smooth", block: "center" });
    const timeout = window.setTimeout(() => {
      setLastHighlightedAssignmentId(highlightedAssignmentId);
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [activeViewMode, filteredAssignments, highlightedAssignmentId]);

  const handleGenerated = (result: { scheduleId?: string; schedule?: { id?: string } }) => {
    setGenerateDialogOpen(false);
    // Kick off the refetch immediately so data is ready when the animation ends.
    void schedulesQuery.refetch();
    const newId = result?.scheduleId ?? result?.schedule?.id;
    if (newId) {
      // State updates and URL sync are deferred until after the close animation.
      window.setTimeout(() => {
        window.requestAnimationFrame(() => {
          startTransition(() => {
            setViewAssignment(null);
            setEditAssignment(null);
            setDeleteAssignment(null);
            setViewProctors(null);
            setLastHighlightedAssignmentId(null);
            clearFilters();
            setSelectedId(newId);

            const nextParams = new URLSearchParams(searchParams);
            nextParams.set("scheduleId", newId);
            nextParams.delete("id");
            nextParams.delete("assignmentId");
            nextParams.delete("aPage");
            nextParams.delete("openGenerate");
            setSearchParams(nextParams);
          });
        });
      }, DIALOG_CLOSE_SETTLE_DELAY_MS);
    }
  };

  const handleAssignmentChanged = (scheduleId: string) => {
    void invalidateScheduleQuerySync(queryClient, {
      includeAssignments: true,
      includeDashboards: true,
      includeNotifications: true,
      includeSearch: true,
    });
    void queryClient.invalidateQueries({ queryKey: scheduleAssignmentKeys.schedule(scheduleId) });
    void queryClient.invalidateQueries({ queryKey: scheduleKeys.lists });
    if (scheduleId === effectiveId) {
      void queryClient.invalidateQueries({ queryKey: scheduleKeys.detail(scheduleId) });
      void queryClient.invalidateQueries({ queryKey: scheduleKeys.analysis(scheduleId) });
    }
  };

  const openPublishDialog = (target?: Schedule | null) => {
    if (!target || target.isFinal) return;
    setPublishTarget(target);
  };

  const handleConfirmPublish = (examPeriod: string) => {
    if (!publishTarget?.id) return;

    const targetId = publishTarget.id;
    publishMutation.mutate(
      { id: targetId, examPeriod },
      {
        onSuccess: () => {
          setPublishTarget(null);
          void schedulesQuery.refetch();
          if (targetId === effectiveId) {
            void scheduleQuery.refetch();
          }
        },
      }
    );
  };

  const handlePublish = () => {
    if (!schedule?.id || schedule.isFinal === true) return;
    openPublishDialog(schedule);
  };

  const { download: downloadPdf, isDownloading: isAdminPdfDownloading } = useSchedulePdfDownload();

  const handleDownloadActiveSchedulePdf = () => {
    if (!schedule?.id || !schedule.isFinal) return;
    void downloadPdf(() => downloadAdminSchedulePdf(schedule.id), {
      startTitle: 'Generating schedule PDF',
      successTitle: 'Schedule PDF downloaded',
      errorTitle: 'Failed to generate PDF',
    });
  };

  // -------------------- render --------------------

  if (showPageLoading) {
    return (
      <div className="p-6">
        <PageSpinner label="Loading schedules" />
      </div>
    );
  }

  if (schedulesQuery.isError) {
    return (
      <div className="p-5 sm:p-6 lg:p-8">
        <Card className="rounded-none border border-rose-200/60 bg-rose-50/40 shadow-sm">
          <CardContent className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-none bg-rose-100 text-rose-700">
                <AlertTriangle className="size-5" />
              </span>
              <div>
                <div className="text-sm font-semibold text-rose-800">
                  Failed to load schedules
                </div>
                <div className="mt-0.5 text-xs text-rose-700/80">
                  {getApiErrorMessage(
                    schedulesQuery.error,
                    "Something went wrong while fetching schedules."
                  )}
                </div>
              </div>
            </div>
            <Button
              onClick={() => schedulesQuery.refetch()}
              disabled={schedulesQuery.isFetching}
              className="h-10 rounded-none border border-zinc-950 bg-zinc-950 font-semibold text-white shadow-sm transition-all hover:bg-zinc-900 active:scale-95 inline-flex items-center gap-2"
            >
              <RefreshCw
                className={cn(
                  "size-4 transition-transform",
                  schedulesQuery.isFetching && "animate-spin"
                )}
              />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAssignmentsInitialLoading = assignmentsQuery.isLoading && !assignmentsQuery.data;
  const isAssignmentsRefreshing = assignmentsQuery.isFetching && !!assignmentsQuery.data;
  const isDetailLoading =
    scheduleQuery.isLoading ||
    scheduleQuery.isFetching ||
    isAssignmentsInitialLoading;
  const suppressDetailError = scheduleQuery.isError && isAuthExpiredError(scheduleQuery.error);

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 space-y-1">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-none bg-zinc-950 text-white shadow-sm">
            <CalendarDays className="size-5" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">Schedules</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Generate, review and publish exam schedules across semesters, centers and proctors.
            </p>
          </div>
        </div>
      </div>

      {/* Action bar: actions + selected schedule status */}
      <StickyActionBar className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Button
          onClick={() => setGenerateDialogOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-none border border-zinc-950 bg-zinc-950 font-semibold text-white shadow-sm transition-all hover:bg-zinc-900 active:scale-95"
        >
          <Sparkles className="size-4" />
          Generate Schedule
        </Button>

        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              {(() => {
                const semesterInactive = isSchedulePublishBlocked(schedule, activeSemesterId);
                return (
                  <span className="inline-flex">
                    <Button
                      variant="outline"
                      onClick={handlePublish}
                      disabled={
                        !schedule ||
                        schedule.isFinal === true ||
                        publishMutation.isPending ||
                        semesterInactive
                      }
                      className="h-10 rounded-none border-zinc-200 text-zinc-950 font-semibold hover:bg-zinc-50 active:scale-95 transition-all inline-flex items-center gap-2"
                    >
                      {publishMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="size-4" />
                      )}
                      {schedule?.isFinal ? "Published" : "Mark as Final"}
                    </Button>
                  </span>
                );
              })()}
            </TooltipTrigger>
            {(() => {
              const semesterInactive = !!schedule && !schedule.isFinal && isSchedulePublishBlocked(schedule, activeSemesterId);
              return semesterInactive ? (
                <TooltipContent side="bottom" className="text-xs bg-zinc-950 text-white rounded-none border-0">
                  Semester inactive
                </TooltipContent>
              ) : null;
            })()} 
          </Tooltip>
        </TooltipProvider>

        {schedule?.isFinal && (
          <Button
            variant="outline"
            onClick={() => {
              if (!schedule?.id) return;
              unpublishMutation.mutate(schedule.id, {
                onSuccess: () => scheduleQuery.refetch(),
              });
            }}
            disabled={unpublishMutation.isPending}
            className="h-10 rounded-none border-amber-300 text-amber-700 font-semibold hover:bg-amber-50 active:scale-95 transition-all inline-flex items-center gap-2"
          >
            {unpublishMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Wrench className="size-4" />
            )}
            Return to Draft
          </Button>
        )}

        {schedule?.isFinal && (
          <Button
            variant="outline"
            onClick={handleDownloadActiveSchedulePdf}
            disabled={isAdminPdfDownloading}
            className="h-10 rounded-none border-zinc-200 text-zinc-950 font-semibold hover:bg-zinc-50 active:scale-95 transition-all inline-flex items-center gap-2"
          >
            {isAdminPdfDownloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Download Schedule PDF
          </Button>
        )}

        <Button
          variant="outline"
          onClick={() => {
            schedulesQuery.refetch();
            if (effectiveId) scheduleQuery.refetch();
          }}
          className="h-10 rounded-none border-zinc-200 text-zinc-950 font-semibold hover:bg-zinc-50 active:scale-95 transition-all inline-flex items-center gap-2"
        >
          <RefreshCw
            className={cn(
              "size-4 transition-transform",
              (schedulesQuery.isFetching || scheduleQuery.isFetching) && "animate-spin"
            )}
          />
          Refresh
        </Button>

        <div className="lg:ml-auto flex items-center gap-3">
          {schedule && (
            <>
              <span className="max-w-56 truncate text-sm font-semibold text-zinc-900">
                {schedule.name}
              </span>
              <StatusBadge schedule={schedule} />
            </>
          )}
        </div>
      </StickyActionBar>

      <ScheduleVersionsTable
        schedules={schedules}
        activeId={effectiveId}
        countOverrides={versionCountOverrides}
        onRequestPublish={openPublishDialog}
        onSelect={(id) => {
          localStorage.setItem(SELECTED_SCHEDULE_STORAGE_KEY, id);
          setViewAssignment(null);
          setEditAssignment(null);
          setDeleteAssignment(null);
          setViewProctors(null);
          setLastHighlightedAssignmentId(null);
          clearFilters();
          setSelectedId(id);
          const nextParams = new URLSearchParams(searchParams);
          nextParams.set("scheduleId", id);
          nextParams.delete("id");
          nextParams.delete("assignmentId");
          nextParams.delete("aPage");
          setSearchParams(nextParams);
        }}
        onDeleted={(deletedId) => {
          if (deletedId === effectiveId) {
            localStorage.removeItem(SELECTED_SCHEDULE_STORAGE_KEY);
            setSelectedId(undefined);
          }
          schedulesQuery.refetch();
        }}
        isPublishing={publishMutation.isPending}
        onRefetch={() => schedulesQuery.refetch()}
        isLoading={schedulesQuery.isLoading}
        activeSemesterId={activeSemesterId}
      />

      <PublishScheduleDialog
        open={Boolean(publishTarget)}
        schedule={publishTarget}
        isPublishing={publishMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setPublishTarget(null);
        }}
        onConfirm={handleConfirmPublish}
      />

      {/* Empty: no schedules at all */}
      {schedules.length === 0 ? (
        <Card className="rounded-none border border-zinc-200/60 bg-white shadow-sm">
          <CardContent className="p-0">
            <EmptyState
              icon={CalendarDays}
              title="No schedules yet"
              description="Generate your first schedule to start assigning exams to rooms, proctors and time slots."
              action={{
                label: "Generate Schedule",
                onClick: () => setGenerateDialogOpen(true),
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Lock banner — shown when selected schedule is Published */}
          {schedule?.isFinal && (
            <div className="mb-6 flex items-center gap-3 rounded-none border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
              <ShieldCheck className="size-5 shrink-0 text-amber-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-800">
                  This schedule is published and locked.
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Published schedules still block reassignment and deletion. You can only update an
                  assignment to Completed or Cancelled until the schedule is returned to draft.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!schedule?.id) return;
                  unpublishMutation.mutate(schedule.id, {
                    onSuccess: () => scheduleQuery.refetch(),
                  });
                }}
                disabled={unpublishMutation.isPending}
                className="shrink-0 h-8 rounded-none border-amber-300 bg-white text-amber-700 font-semibold hover:bg-amber-50 inline-flex items-center gap-1.5 text-xs"
              >
                {unpublishMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Wrench className="size-3.5" />
                )}
                Return to Draft
              </Button>
            </div>
          )}

          {isAutoUnpublishedSchedule(schedule) && (
            <div className="mb-6 flex items-start gap-3 rounded-none border border-rose-200 bg-rose-50 px-4 py-3 shadow-sm">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-rose-700" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-rose-800">
                  This schedule was auto-unpublished after upstream changes.
                </p>
                <p className="mt-0.5 text-xs text-rose-700/90">
                  {getAutoUnpublishSummary(schedule)} It has been returned to draft so invalid published assignments are not shown in student and proctor portals.
                </p>
                {getAutoUnpublishReasonLines(schedule).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {getAutoUnpublishReasonLines(schedule).map((reason) => (
                      <span
                        key={reason}
                        className="inline-flex items-center rounded-none border border-rose-200 bg-white px-2 py-1 text-[11px] font-semibold text-rose-700"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {isDetailLoading && !schedule ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="rounded-none border border-zinc-200/60 bg-white shadow-sm">
                  <CardContent className="p-6 space-y-3">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-32" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <StatCard
                  label="Assignments"
                  value={stats.total}
                  hint="Total exam assignments"
                  icon={ClipboardList}
                  tone="blue"
                />
                <StatCard
                  label="Rooms Used"
                  value={stats.rooms}
                  hint="Distinct rooms allocated"
                  icon={DoorOpen}
                  tone="emerald"
                />
                <StatCard
                  label="Proctors"
                  value={stats.proctors}
                  hint="Distinct proctors assigned"
                  icon={ShieldCheck}
                  tone="violet"
                />
              </>
            )}
          </div>

          {/* Filters */}
          <div className="mb-4 space-y-2">
            <ScheduleFilterToolbar
              query={search}
              onQueryChange={setSearch}
              queryPlaceholder="Search course name, code, room, center, proctor, schedule"
              activeCount={activeAssignmentFilterCount}
              resultSummary={`Showing ${filteredAssignments.length} of ${filteredAssignmentsTotal} assignments`}
              startDate={filters.state.startDate}
              endDate={filters.state.endDate}
              onStartDateChange={filters.setters.setStartDate}
              onEndDateChange={filters.setters.setEndDate}
              examDate={filters.state.examDate}
              onExamDateChange={filters.setters.setExamDate}
              onReset={clearFilters}
              fields={adminAssignmentFields}
            />
            <ActiveFilterBadges badges={adminAssignmentBadges} onClearAll={clearFilters} />
          </div>

          {/* Detail error */}
          {scheduleQuery.isError && !suppressDetailError && (
            <Card className="rounded-none border border-rose-200/60 bg-rose-50/40 shadow-sm mb-4">
              <CardContent className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-none bg-rose-100 text-rose-700">
                    <AlertTriangle className="size-4" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-rose-800">
                      Failed to load schedule details
                    </div>
                    <div className="text-xs text-rose-700/80">
                      {getApiErrorMessage(
                        scheduleQuery.error,
                        "Something went wrong while fetching the selected schedule."
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => scheduleQuery.refetch()}
                  disabled={scheduleQuery.isFetching}
                  className="h-9 rounded-none border-rose-200 bg-white text-rose-800 hover:bg-rose-50 inline-flex items-center gap-2"
                >
                  <RefreshCw
                    className={cn(
                      "size-4 transition-transform",
                      scheduleQuery.isFetching && "animate-spin"
                    )}
                  />
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {/* View toggle */}
          <div className="mb-3 flex items-center justify-end gap-3">
          
            <div
              role="tablist"
              aria-label="Schedule view"
              className="inline-flex items-center rounded-full border border-zinc-200 bg-white p-1 shadow-sm"
            >
              <button
                type="button"
                role="tab"
                data-state={viewMode === "table" ? "active" : "inactive"}
                onClick={() => {
                  setViewMode("table");
                  const nextParams = new URLSearchParams(searchParams);
                  nextParams.set("view", "table");
                  setSearchParams(nextParams);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  viewMode === "table"
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                )}
              >
                <LayoutList className="size-3.5" />
                Table
              </button>
              <button
                type="button"
                role="tab"
                data-state={viewMode === "calendar" ? "active" : "inactive"}
                onClick={() => {
                  setViewMode("calendar");
                  const nextParams = new URLSearchParams(searchParams);
                  nextParams.set("view", "calendar");
                  setSearchParams(nextParams);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  viewMode === "calendar"
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                )}
              >
                <CalendarRange className="size-3.5" />
                Calendar
              </button>
            </div>
          </div>

          {/* Assignments Section Header */}
          <Card className="rounded-none border border-zinc-200/60 bg-white shadow-sm mb-4 overflow-hidden">
            <CardHeader className="flex flex-col gap-4 border-b border-zinc-200/60 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
              <div className="space-y-2">
                <div className="inline-flex items-center rounded-none bg-zinc-950 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-white shadow-sm shadow-zinc-950/10">
                  Scheduling
                </div>
                <CardTitle className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                  Schedule Assignments
                </CardTitle>
                <p className="max-w-2xl text-sm leading-6 text-zinc-500">
                  View generated exam assignments, rooms, proctors, time slots, and publication status in one relational schedule view.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-none border border-zinc-200/60 bg-linear-to-br from-zinc-50 to-zinc-100/80 px-5 py-3 shadow-sm shrink-0">
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">
                    Total Assignments
                  </p>
                  <p className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">
                    {stats.total}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Assignments table */}
          {activeViewMode === "table" ? (
          <>
          {!schedule?.isFinal && (
            <BulkDeleteToolbar
              selectedCount={assignmentBulkDelete.selectedCount}
              totalCount={filteredAssignments.length}
              isDeleting={assignmentBulkDelete.isDeleting}
              onClear={assignmentBulkDelete.clearSelection}
              onDelete={() => assignmentBulkDelete.setIsConfirmOpen(true)}
              className="mb-3"
            />
          )}
          <Card className="rounded-none border border-zinc-200/60 bg-white shadow-sm">
            <CardContent className="p-0">
              <div
                ref={assignmentTableScrollRef}
                onScroll={onAssignmentTableScroll}
                className={cn("overflow-x-auto", assignmentTableContainerClassName)}
              >
                {isAssignmentsRefreshing && (
                  <div className="sticky top-0 z-10 flex items-center justify-end gap-2 border-b border-zinc-200/60 bg-white/90 px-4 py-2 text-xs text-zinc-500 backdrop-blur sm:px-6">
                    <Loader2 className="size-3.5 animate-spin" />
                    Updating assignments...
                  </div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow className="bg-zinc-50/60">
                      {!schedule?.isFinal && (
                        <TableHead className="w-10 pl-3">
                          <RowSelectCheckbox
                            checked={
                              filteredAssignments.length > 0 &&
                              filteredAssignments.every((a) => assignmentBulkDelete.selectedIds.has(a.id))
                            }
                            indeterminate={
                              assignmentBulkDelete.selectedCount > 0 &&
                              !filteredAssignments.every((a) => assignmentBulkDelete.selectedIds.has(a.id))
                            }
                            label="Select all assignments"
                            onChange={(checked) => assignmentBulkDelete.toggleAll(filteredAssignments, checked)}
                          />
                        </TableHead>
                      )}
                      <TableHead className="text-xs uppercase tracking-wide text-zinc-500">Course</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide text-zinc-500">Code</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide text-zinc-500">Semester</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide text-zinc-500">Date</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide text-zinc-500">Time</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide text-zinc-500">Room</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide text-zinc-500">Center</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide text-zinc-500">Proctor</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide text-zinc-500 text-right">Students</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide text-zinc-500">Status</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide text-zinc-500 text-right">Duration</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide text-zinc-500 text-right w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isAssignmentsInitialLoading ? (
                      <TableRow>
                        <TableCell colSpan={schedule?.isFinal ? 12 : 13} className="p-0">
                          <TableSkeletonRows columns={schedule?.isFinal ? 12 : 13} rows={10} />
                        </TableCell>
                      </TableRow>
                    ) : filteredAssignments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={schedule?.isFinal ? 12 : 13} className="p-0">
                          <EmptyState
                            icon={ClipboardList}
                            title={hasActiveFilters ? "No matching assignments" : "No assignments yet"}
                            description={hasActiveFilters ? "Try clearing filters or selecting another schedule." : "This schedule has no assignments. Generate or regenerate to populate it."}
                            action={
                              hasActiveFilters
                                ? { label: "Clear filters", onClick: clearFilters }
                                : undefined
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                      {isAssignmentTableVirtualized && assignmentTopPadding > 0 && (
                        <TableRow aria-hidden="true">
                          <TableCell colSpan={12} style={{ height: assignmentTopPadding, padding: 0 }} />
                        </TableRow>
                      )}
                      {virtualAssignmentRows.map(({ item: a }) => {
                        const course = a.exam?.courseOffering?.course;
                        const sem = a.exam?.courseOffering?.semester;
                        const ts = a.timeSlot;
                        const proctorAssignments = a.assignmentIds
                          .map((id) => assignmentById.get(id))
                          .filter((assignment): assignment is ScheduleAssignment => Boolean(assignment));
                        const hasMultipleProctors = a.proctorIds.length > 1;
                        const studentsCount =
                          a.exam?.courseOffering?.registrations?.length ??
                          a.exam?.courseOffering?.expectedStudents ??
                          0;
                        const duration = a.exam?.duration;
                        const courseTitle = course?.title ?? course?.name ?? "Not assigned";
                        const isHighlighted = a.assignmentIds.includes(highlightedAssignmentId ?? "");
                        return (
                          <TableRow
                            key={a.id}
                            data-assignment-ids={a.assignmentIds.join(" ")}
                            className={cn(
                              "text-sm cursor-pointer transition-all duration-200 hover:bg-zinc-50/60 focus-visible:bg-zinc-50/60 focus:outline-none",
                              isHighlighted &&
                                "bg-amber-50/80 ring-1 ring-inset ring-amber-300 shadow-[inset_4px_0_0_0_rgb(251_191_36)] animate-[pulse_1.1s_ease-out_2]"
                            )}
                            tabIndex={0}
                            role="button"
                            aria-label={`View details for ${courseTitle}`}
                            onClick={() => setViewAssignment(a)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setViewAssignment(a);
                              }
                            }}
                          >
                            {!schedule?.isFinal && (
                              <TableCell className="w-10 pl-3" onClick={(e) => e.stopPropagation()}>
                                <RowSelectCheckbox
                                  checked={assignmentBulkDelete.selectedIds.has(a.id)}
                                  label={`Select ${courseTitle}`}
                                  onChange={(checked) => assignmentBulkDelete.toggleSelected(a.id, checked)}
                                />
                              </TableCell>
                            )}
                            <TableCell>
                              <div className="font-semibold text-zinc-950">{courseTitle}</div>
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center rounded-none border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-mono font-semibold text-zinc-700">
                                {course?.code ?? "Not assigned"}
                              </span>
                            </TableCell>
                            <TableCell className="text-zinc-700">{sem?.name ?? "Not assigned"}</TableCell>
                            <TableCell className="text-zinc-700 whitespace-nowrap">
                              {formatDate(ts?.date ?? ts?.startTime)}
                            </TableCell>
                            <TableCell className="text-zinc-700 whitespace-nowrap">
                              {formatTime(ts?.startTime)} – {formatTime(ts?.endTime)}
                            </TableCell>
                            <TableCell className="text-zinc-700">
                              <div className="font-medium">{a.room?.name ?? "Not assigned"}</div>
                              {a.room?.capacity != null && (
                                <div className="text-xs text-zinc-500">Capacity {a.room.capacity}</div>
                              )}
                            </TableCell>
                            <TableCell className="text-zinc-700">{a.room?.center?.name ?? "Not assigned"}</TableCell>
                            <TableCell className="text-zinc-700">
                              <>
                                <div className="flex items-center gap-2">
                                  <div className="min-w-0 truncate font-medium">
                                    {a.proctor?.user?.name ?? "Not assigned"}
                                    {hasMultipleProctors ? " and others" : ""}
                                  </div>
                                  {hasMultipleProctors && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-6 rounded-none px-2 text-[11px] font-medium"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        setViewProctors(proctorAssignments);
                                      }}
                                    >
                                      View
                                    </Button>
                                  )}
                                </div>
                                {a.proctor?.user?.email && (
                                  <div className="text-xs text-zinc-500">{a.proctor.user.email}</div>
                                )}
                              </>
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-zinc-700">{studentsCount}</TableCell>
                            <TableCell>
                              <ExamStatusBadge
                                status={getAssignmentDisplayStatus({
                                  status: a.exam?.status,
                                  isFinal: schedule?.isFinal,
                                })}
                              />
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-zinc-700 whitespace-nowrap">
                              {duration != null ? `${duration} min` : "—"}
                            </TableCell>
                            <TableCell
                              className="text-right"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 rounded-none hover:bg-zinc-100"
                                    aria-label="Row actions"
                                  >
                                    <MoreHorizontal className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-none w-48">
                                  <DropdownMenuLabel className="text-xs uppercase tracking-wide text-zinc-500">
                                    Actions
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="rounded-none cursor-pointer"
                                    onClick={() => setViewAssignment(a)}
                                  >
                                    <Eye className="size-4 mr-2" /> View details
                                  </DropdownMenuItem>

                                  {hasMultipleProctors && (
                                    <DropdownMenuItem
                                      className="rounded-none cursor-pointer"
                                      onClick={() => setViewProctors(proctorAssignments)}
                                    >
                                      <UserCheck className="size-4 mr-2" /> View all proctors
                                    </DropdownMenuItem>
                                  )}

                                  <DropdownMenuItem
                                    className="rounded-none cursor-pointer"
                                    onClick={() => setEditAssignment(a)}
                                  >
                                    <Pencil className="size-4 mr-2" /> {schedule?.isFinal ? "Update assignment status" : "Edit assignment"}
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator />

                                  <LockedActionTooltip isLocked={!!schedule?.isFinal}>
                                    <DropdownMenuItem
                                      className="rounded-none text-rose-700 focus:text-rose-700 focus:bg-rose-50 cursor-pointer"
                                      disabled={!!schedule?.isFinal}
                                      onClick={(e) => {
                                        if (schedule?.isFinal) return e.preventDefault();
                                        setDeleteAssignment(a);
                                      }}
                                    >
                                      <Trash2 className="size-4 mr-2" /> Delete assignment
                                    </DropdownMenuItem>
                                  </LockedActionTooltip>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {isAssignmentTableVirtualized && assignmentBottomPadding > 0 && (
                        <TableRow aria-hidden="true">
                          <TableCell colSpan={schedule?.isFinal ? 12 : 13} style={{ height: assignmentBottomPadding, padding: 0 }} />
                        </TableRow>
                      )}
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
              {assignmentsTotalPages > 1 && (
                <div className="flex items-center justify-between gap-3 border-t border-zinc-200/60 bg-white px-4 py-3 text-xs text-zinc-600 sm:px-6">
                  <p>
                    Page{" "}
                    <span className="font-semibold text-zinc-900">{assignmentPage}</span>{" "}
                    of{" "}
                    <span className="font-semibold text-zinc-900">{assignmentsTotalPages}</span>
                    {" · "}
                    <span className="font-semibold text-zinc-900">{filteredAssignmentsTotal}</span>{" "}
                    total assignments
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={assignmentPage <= 1}
                      onClick={() => setAssignmentPage(Math.max(1, assignmentPage - 1))}
                      className="h-8 rounded-none px-2"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={assignmentPage >= assignmentsTotalPages}
                      onClick={() => setAssignmentPage(Math.min(assignmentsTotalPages, assignmentPage + 1))}
                      className="h-8 rounded-none px-2"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <DeleteConfirmModal
            open={assignmentBulkDelete.isConfirmOpen}
            title="Delete Assignments?"
            description={`This will permanently delete ${assignmentBulkDelete.selectedCount} selected assignment${assignmentBulkDelete.selectedCount === 1 ? "" : "s"} and all their grouped rows. This action cannot be undone.`}
            isLoading={assignmentBulkDelete.isDeleting}
            onCancel={() => assignmentBulkDelete.setIsConfirmOpen(false)}
            onConfirm={assignmentBulkDelete.confirmDelete}
          />
          </>
          ) : isDetailLoading ? (
            <Card className="rounded-none border border-zinc-200/60 bg-white shadow-sm">
              <CardContent className="p-6 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-14 w-14 rounded-2xl" />
                    <div className="flex-1 flex gap-3 overflow-hidden">
                      <Skeleton className="h-36 w-72 rounded-2xl" />
                      <Skeleton className="h-36 w-72 rounded-2xl" />
                      <Skeleton className="h-36 w-72 rounded-2xl" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <ScheduleCalendarView
              assignments={calendarAssignments}
              isFinal={schedule?.isFinal}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={clearFilters}
              onSelectAssignment={setViewAssignment}
            />
          )}
        </>
      )}

      <GenerateScheduleDialog
        open={generateOpen}
        onOpenChange={setGenerateDialogOpen}
        semesters={semesters}
        semestersLoading={semestersQuery.isLoading}
        onGenerated={handleGenerated}
        existingNames={schedules.map((s) => s.name)}
        onValidateScheduleName={async (scheduleName) => {
          const result = await fetchSchedules({ limit: 100, search: scheduleName });
          return !result.data.some((schedule) => schedule.name.trim().toLowerCase() === scheduleName.trim().toLowerCase());
        }}
      />

      <AssignmentDetailsSheet
        assignment={viewAssignment}
        assignments={assignments}
        isFinal={schedule?.isFinal}
        onOpenChange={(next) => {
          if (!next) setViewAssignment(null);
        }}
      />

      <EditAssignmentDialog
        assignment={editAssignment}
        isPublished={!!schedule?.isFinal}
        onChanged={handleAssignmentChanged}
        onOpenChange={(next) => {
          if (!next) setEditAssignment(null);
        }}
      />

      <DeleteAssignmentDialog
        assignment={deleteAssignment}
        onChanged={handleAssignmentChanged}
        onOpenChange={(next) => {
          if (!next) setDeleteAssignment(null);
        }}
      />

      <ViewProctorsDialog
        open={Boolean(viewProctors)}
        onOpenChange={(next) => {
          if (!next) setViewProctors(null);
        }}
        assignments={viewProctors ?? []}
      />
    </div>
  );
}

export default SchedulesPage;
