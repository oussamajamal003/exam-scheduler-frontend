import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
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
  Search,
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
  useSchedules,
  useUpdateSchedule,
  useValidateSchedulingInput,
} from "../../hooks/schedules/useSchedules";
import { useSemesters } from "../../hooks/semesters/useSemesters";
import { useRooms } from "../../hooks/rooms/useRooms";
import { useProctors } from "../../hooks/proctors/useProctors";
import { useTimeSlots } from "../../hooks/timeSlots/useTimeSlots";
import {
  useScheduleAssignments,
  useDeleteAssignment,
  useUpdateAssignment,
} from "../../hooks/assignments/useAssignments";
import type {
  Schedule,
  ScheduleAssignment,
} from "../../schemas/schedule";
import type { ValidateSchedulingResult } from "../../api/schedulingApi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
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
import { FilterPopover, FilterField } from "../../components/shared/FilterPopover";
import { PageSpinner } from "../../components/shared/PageSpinner";
import { useDelayedLoading } from "../../hooks/common/useDelayedLoading";
import { getApiErrorMessage, isAuthExpiredError } from "../../lib/apiError";
import { cn } from "../../lib/utils";

// -------------------- helpers --------------------

const ALL = "__all__";

const formatTime = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
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
  const [examPeriod, setExamPeriod] = useState("");

  useEffect(() => {
    if (!open) return;
    setExamPeriod(inferExamPeriod(schedule));
  }, [open, schedule]);

  const trimmedExamPeriod = examPeriod.trim();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedExamPeriod) return;
    onConfirm(trimmedExamPeriod);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isPublishing && onOpenChange(next)}>
      <DialogContent className="overflow-hidden rounded-none border border-zinc-200/80 bg-white p-0 shadow-xl sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b border-zinc-200/70 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),rgba(244,244,245,0.96)_45%,rgba(228,228,231,0.88))] px-6 py-5 text-left">
            <div className="flex items-start gap-3">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-none border border-zinc-200 bg-white text-zinc-950 shadow-sm">
                <CalendarRange className="size-5" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-lg font-semibold tracking-tight text-zinc-950">
                  Publish Schedule
                </DialogTitle>
                <p className="mt-1 text-sm text-zinc-500">
                  Choose the exam period for this published schedule. Each semester can publish up to two schedules across different periods.
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 px-6 py-5">
            <div className="rounded-none border border-zinc-200 bg-zinc-50/80 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Schedule
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-zinc-950">
                {schedule?.name ?? "Selected schedule"}
              </p>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="publish-exam-period" className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
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
                        "h-9 rounded-none border-zinc-200 px-3 text-sm font-semibold shadow-sm",
                        isActive
                          ? "border-zinc-950 bg-zinc-950 text-white hover:bg-zinc-900 hover:text-white"
                          : "bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950"
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
                className="h-11 rounded-none border-zinc-200 bg-white shadow-sm focus-visible:ring-zinc-300/60"
              />
              <p className="text-xs text-zinc-500">
                Use a clear label like Midterm or Final. Publishing blocks duplicate periods within the same semester.
              </p>
            </div>
          </div>

          <DialogFooter className="border-t border-zinc-200/70 bg-zinc-50/70 px-6 py-4 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPublishing}
              className="h-10 rounded-none border-zinc-200 bg-white text-zinc-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!trimmedExamPeriod || isPublishing}
              className="h-10 rounded-none border-0 bg-zinc-950 text-white hover:bg-zinc-900"
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

const StatusBadge = ({ isFinal }: { isFinal: boolean }) =>
  isFinal ? (
    <span className="inline-flex items-center gap-1 rounded-none border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      <CheckCircle2 className="size-3.5" />
      Published
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

const ScheduleVersionsTable = ({
  schedules,
  activeId,
  countOverrides,
  onSelect,
  onRequestPublish,
  onDeleted,
  isLoading,
  isPublishing,
  onRefetch,
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
}) => {
  const deleteMutation = useDeleteSchedule();
  const updateMutation = useUpdateSchedule();
  const unpublishMutation = useUnpublishSchedule();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<Schedule | null>(null);
  const [newName, setNewName] = useState("");

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

      <Card className="rounded-none border border-zinc-200/60 bg-white shadow-sm mb-6 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-zinc-200/70 bg-zinc-50/60 hover:bg-zinc-50/60">
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
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j} className="py-3 pl-5">
                        <Skeleton className="h-4 w-full max-w-28" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : schedules.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
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
                    (s.assignments ? getLogicalAssignmentCount(s.assignments) : undefined) ??
                    s._count?.assignments ??
                    0;
                  return (
                    <TableRow
                      key={s.id}
                      className={cn(
                        "border-b border-zinc-100 transition-colors hover:bg-zinc-50/70",
                        isActive && "bg-zinc-50"
                      )}
                    >
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
                        <StatusBadge isFinal={s.isFinal} />
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <span className="inline-flex items-center justify-center min-w-8 rounded-none border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-semibold text-zinc-700 tabular-nums">
                          {assignmentsCount}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 pr-4 text-right">
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
                              <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-zinc-500 font-semibold px-3 py-1.5">
                                Actions
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {!s.isFinal ? (
                                <DropdownMenuItem
                                  disabled={isPublishing}
                                  onClick={() => onRequestPublish(s)}
                                  className="cursor-pointer px-3 py-2 text-sm font-medium text-emerald-700 focus:bg-emerald-50 focus:text-emerald-700"
                                >
                                  <CheckCircle2 className="size-4 mr-2" />
                                  Publish
                                </DropdownMenuItem>
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
            <DialogFooter className="gap-2 sm:gap-0 mt-2">
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
                className="rounded-none h-10 bg-zinc-950 text-white hover:bg-zinc-900 border-0"
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
    </>
  );
};

const examStatusToneMap: Record<string, string> = {
  DRAFT: "border-amber-200 bg-amber-50 text-amber-700",
  REVIEW: "border-amber-200 bg-amber-50 text-amber-700",
  SCHEDULED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  IN_PROGRESS: "border-sky-200 bg-sky-50 text-sky-700",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  COMPLETED: "border-blue-200 bg-blue-50 text-blue-700",
  CANCELLED: "border-zinc-200 bg-zinc-50 text-zinc-600",
};

const getAssignmentDisplayStatus = ({
  isFinal,
}: {
  isFinal?: boolean;
}) => {
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
  isActive?: boolean | null;
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
    label: "Prepare",
    description: "Loading scheduling resources...",
  },
  {
    key: "validate",
    label: "Validate",
    description: "Validating hard constraints...",
  },
  {
    key: "build-draft",
    label: "Build Draft",
    description: "Building feasible assignments...",
  },
  {
    key: "evaluate",
    label: "Evaluate",
    description: "Evaluating schedule quality...",
  },
  {
    key: "optimize",
    label: "Optimize",
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
    label: "Generate",
    description: "Saving final conflict-free schedule...",
  },
];

const MIN_BUILD_DRAFT_STAGE_DELAY_MS = 2200;
const EVALUATE_STAGE_DELAY_MS = 320;
const OPTIMIZE_STAGE_DELAY_MS = 420;
const RE_EVALUATE_STAGE_DELAY_MS = 350;
const CONFIRM_STAGE_DELAY_MS = 300;

const GENERATION_BLOCKED_MESSAGE = "Schedule generation is currently blocked.";
const GENERATION_BLOCKED_DETAIL_FALLBACK = "No valid schedule can be generated with the current data and available resources. Review rooms, proctors, time slots, and semester dates, then try again.";

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
const getQualityMetric = (
  evaluationResult: ValidateSchedulingResult | undefined,
  optimizationResult: ValidateSchedulingResult | undefined,
  key: string,
) => getMetricNumber(
  optimizationResult?.optimization?.qualityMetrics?.[key]
    ?? optimizationResult?.quality?.qualityMetrics?.[key]
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
const normalizeBlockingMessage = (message: string | null | undefined) => {
  if (!message) return GENERATION_BLOCKED_DETAIL_FALLBACK;

  if (/conflict-free schedule exists/i.test(message)) {
    return GENERATION_BLOCKED_DETAIL_FALLBACK;
  }

  return message
    .replace(/conflict-free/gi, "valid")
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
  <div className="rounded-none border border-zinc-200 bg-linear-to-br from-white via-zinc-50/80 to-zinc-100/70 px-4 py-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
        <p className="mt-2 text-3xl font-bold tabular-nums text-zinc-950">{value}</p>
      </div>
      <span className="inline-flex size-10 items-center justify-center rounded-none border border-zinc-200 bg-white text-zinc-700 shadow-sm">
        <Icon className="size-4" />
      </span>
    </div>
  </div>
);

const QualityMetricCard = ({ label, value }: { label: string; value: number }) => (
  (() => {
    const tone = getQualityTone(value);
    const normalizedValue = Math.max(0, Math.min(100, Math.round(value)));
    const descriptor = getQualityDescriptor(value);

    return (
      <div className={cn("rounded-none border px-4 py-4", tone.shell, tone.glow)}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
            <p className={cn("mt-2 text-3xl font-bold tabular-nums", tone.score)}>{formatScore(value)}</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className={cn("h-2.5 overflow-hidden rounded-full", tone.track)}>
            <div className={cn("h-full rounded-full", tone.fill)} style={{ width: `${normalizedValue}%` }} />
          </div>
          <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500">
            <span className={cn("uppercase tracking-wide", tone.score)}>{descriptor}</span>
            <span className="tabular-nums text-zinc-400">{normalizedValue}/100</span>
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
      shell: "border-zinc-200 bg-linear-to-br from-white via-zinc-50/70 to-zinc-100/70",
      eyebrow: "text-zinc-500",
      value: "text-zinc-950",
      caption: "text-zinc-500",
      iconWrap: "bg-white text-zinc-700 border border-zinc-200",
    },
    optimized: {
      shell: "border-emerald-200 bg-linear-to-br from-emerald-50 via-white to-emerald-100/80 shadow-[0_18px_40px_-24px_rgba(16,185,129,0.65)]",
      eyebrow: "text-emerald-700",
      value: "text-emerald-950",
      caption: "text-emerald-800",
      iconWrap: "bg-white text-emerald-700 border border-emerald-200",
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
    <div className="rounded-none border border-zinc-200 bg-zinc-50/80 px-3 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900">{formatQualityArea(area)}</p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-zinc-500">{descriptor}</p>
          <p className="mt-1 text-[11px] text-zinc-400">Before optimization</p>
        </div>
        <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-600">
          {formatScore(score)}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200/80">
        <div className={cn("h-full rounded-full bg-linear-to-r", stripeTone)} style={{ width: `${width}%` }} />
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
      shell: "border-zinc-200 bg-linear-to-br from-white via-zinc-50/80 to-zinc-100/70",
      label: "text-zinc-500",
      value: "text-zinc-950",
      icon: "border-zinc-200 bg-white text-zinc-700",
    },
    success: {
      shell: "border-emerald-200 bg-linear-to-br from-emerald-50 via-white to-emerald-100/80 shadow-[0_18px_40px_-24px_rgba(16,185,129,0.55)]",
      label: "text-emerald-700",
      value: "text-emerald-950",
      icon: "border-emerald-200 bg-white text-emerald-700",
    },
    quality: {
      shell: "border-sky-200 bg-linear-to-br from-sky-50 via-white to-indigo-50 shadow-[0_18px_40px_-24px_rgba(59,130,246,0.5)]",
      label: "text-sky-700",
      value: "text-sky-950",
      icon: "border-sky-200 bg-white text-sky-700",
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
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  semesters: SemesterOption[];
  semestersLoading: boolean;
  onGenerated: (result: { scheduleId?: string; schedule?: { id?: string } }) => void;
  existingNames?: string[];
}) => {
  const [name, setName] = useState("");
  const [semesterId, setSemesterId] = useState<string>("");
  const [phase, setPhase] = useState<PipelinePhase>("idle");
  const [zeroAssignments, setZeroAssignments] = useState(false);
  const [missingDates, setMissingDates] = useState(false);
  const [generateErrorMessage, setGenerateErrorMessage] = useState<string | null>(null);
  const pipelineTimerIdsRef = useRef<number[]>([]);
  const buildDraftStartedAtRef = useRef<number | null>(null);

  const prepareMutation = usePrepareScheduling();
  const validateMutation = useValidateSchedulingInput();
  const optimizeMutation = useOptimizeScheduling();
  const generateMutation = useGenerateSchedule();

  const prepare = prepareMutation.data;
  const validationResult = validateMutation.data;
  const optimizationResult = optimizeMutation.data;
  const finalPipelineResult = optimizationResult ?? validationResult;

  const defaultSemesterId = useMemo(() => {
    if (semesters.length === 0) return "";
    return (semesters.find((s) => s.isActive) ?? semesters[0]).id;
  }, [semesters]);
  const effectiveSemesterId = semesterId || defaultSemesterId;

  const clearPipelineTimers = () => {
    for (const timerId of pipelineTimerIdsRef.current) {
      window.clearTimeout(timerId);
    }
    pipelineTimerIdsRef.current = [];
  };

  const queuePipelinePhase = (nextPhase: PipelinePhase, delayMs: number) => {
    const timerId = window.setTimeout(() => {
      setPhase(nextPhase);
      pipelineTimerIdsRef.current = pipelineTimerIdsRef.current.filter((id) => id !== timerId);
    }, delayMs);
    pipelineTimerIdsRef.current.push(timerId);
  };

  const resetPipelineClock = () => {
    buildDraftStartedAtRef.current = null;
  };

  // Reset pipeline state whenever the dialog closes
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        clearPipelineTimers();
        resetPipelineClock();
        setName("");
        setSemesterId("");
        setPhase("idle");
        setZeroAssignments(false);
        setMissingDates(false);
        setGenerateErrorMessage(null);
        prepareMutation.reset();
        validateMutation.reset();
        optimizeMutation.reset();
        generateMutation.reset();
      }, 300);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSemesterChange = (next: string) => {
    clearPipelineTimers();
    resetPipelineClock();
    setSemesterId(next);
    setPhase("idle");
    setZeroAssignments(false);
    setMissingDates(false);
    setGenerateErrorMessage(null);
    prepareMutation.reset();
    validateMutation.reset();
    optimizeMutation.reset();
    generateMutation.reset();
  };

  const runSmartSchedulingFlow = () => {
    if (!effectiveSemesterId) return;
    const sem = semesters.find((s) => s.id === effectiveSemesterId);
    const startDate = sem?.startDate ?? undefined;
    const endDate = sem?.endDate ?? undefined;
    if (!startDate || !endDate) {
      setMissingDates(true);
      setPhase("failed");
      return;
    }
    setMissingDates(false);
    setPhase("preparing");
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
          setPhase("validating");
          validateMutation.mutate(
            { semesterId: effectiveSemesterId },
            {
              onSuccess: (result) => {
                if (!result.isValid) {
                  setPhase("failed");
                  return;
                }

                setPhase("building-draft");
                buildDraftStartedAtRef.current = Date.now();
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

                      const elapsedBuildDraftMs = buildDraftStartedAtRef.current
                        ? Date.now() - buildDraftStartedAtRef.current
                        : 0;
                      const remainingBuildDraftMs = Math.max(0, MIN_BUILD_DRAFT_STAGE_DELAY_MS - elapsedBuildDraftMs);

                      queuePipelinePhase("evaluating", remainingBuildDraftMs);
                      queuePipelinePhase("optimizing", remainingBuildDraftMs + EVALUATE_STAGE_DELAY_MS);
                      queuePipelinePhase("re-evaluating", remainingBuildDraftMs + EVALUATE_STAGE_DELAY_MS + OPTIMIZE_STAGE_DELAY_MS);
                      queuePipelinePhase("confirming", remainingBuildDraftMs + EVALUATE_STAGE_DELAY_MS + OPTIMIZE_STAGE_DELAY_MS + RE_EVALUATE_STAGE_DELAY_MS);
                      queuePipelinePhase("ready", remainingBuildDraftMs + EVALUATE_STAGE_DELAY_MS + OPTIMIZE_STAGE_DELAY_MS + RE_EVALUATE_STAGE_DELAY_MS + CONFIRM_STAGE_DELAY_MS);
                      resetPipelineClock();
                    },
                    onError: () => {
                      clearPipelineTimers();
                      resetPipelineClock();
                      setPhase("failed");
                    },
                  }
                );
              },
              onError: () => {
                clearPipelineTimers();
                resetPipelineClock();
                setPhase("failed");
              },
            }
          );
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
    if (phase !== "ready" || !effectiveSemesterId || name.trim().length < 3 || isDuplicateName) return;
    clearPipelineTimers();
    resetPipelineClock();
    setPhase("generating");
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
            setPhase("ready");
          } else {
            onGenerated(result);
          }
        },
        onError: (error) => {
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
  const isBusy = isRunningChecks || isGenerating;

  const hasRun = phase !== "idle";
  const canRunChecks = Boolean(effectiveSemesterId) && !isBusy;
  const isDuplicateName = existingNames.some(
    (n) => n.trim().toLowerCase() === name.trim().toLowerCase()
  );
  const canGenerate = Boolean(validationResult?.isValid) && Boolean(optimizationResult?.isValid) && phase === "ready" && name.trim().length >= 3 && !isDuplicateName && !isGenerating && !zeroAssignments;
  const beforeScore = getOptimizationBeforeScore(validationResult, optimizationResult);
  const afterScore = getOptimizationAfterScore(optimizationResult);
  const improvement = optimizationResult?.optimization?.improvementPercentage ?? Math.max(0, afterScore - beforeScore);
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
    const hasOptimized = hasSuccessfulOptimization && phase !== "optimizing";
    const hasReEvaluated = hasSuccessfulOptimization && phase !== "optimizing" && phase !== "re-evaluating";
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
    if (status === "complete") return "border-emerald-200 bg-linear-to-br from-emerald-50 via-white to-emerald-100/80 text-emerald-700 shadow-[0_18px_36px_-26px_rgba(16,185,129,0.5)]";
    if (status === "active") return "border-zinc-900 bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-800 text-white shadow-[0_18px_36px_-24px_rgba(24,24,27,0.8)]";
    if (status === "blocked") return "border-amber-200 bg-linear-to-br from-amber-50 via-white to-orange-50 text-amber-700";
    return "border-zinc-200 bg-linear-to-br from-white to-zinc-50 text-zinc-400";
  };

  const stepStatusLabel = (status: PipelineStepStatus) => {
    if (status === "complete") return "Done";
    if (status === "active") return "In Progress";
    if (status === "blocked") return "Blocked";
    return "Waiting";
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!isBusy) onOpenChange(next); }}>
      <DialogContent className="!flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-none p-0 gap-0 sm:max-w-3xl">
        {/* Dialog header */}
        <DialogHeader className="border-b border-zinc-200/70 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),rgba(244,244,245,0.92)_42%,rgba(228,228,231,0.82))] px-5 py-4 sm:px-6 sm:py-5">
          <div className="relative rounded-none border border-zinc-200/80 bg-white/80 p-4 shadow-[0_20px_48px_-34px_rgba(24,24,27,0.35)] backdrop-blur-sm sm:p-5">
            <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-32 bg-[linear-gradient(135deg,rgba(24,24,27,0.05),rgba(24,24,27,0))] lg:block" />
            <div className="relative flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-none border border-zinc-900 bg-zinc-950 text-white shadow-[0_18px_36px_-22px_rgba(24,24,27,0.8)]">
                  <Sparkles className="size-4.5" />
                </span>
                <div className="space-y-1.5">
                  <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                    <ShieldCheck className="size-3.5" />
                    Confirmed Schedule Only
                  </span>
                  <div className="space-y-1">
                    <DialogTitle className="text-lg font-semibold tracking-tight text-zinc-950 sm:text-xl">
                      Generate Schedule
                    </DialogTitle>
                    <p className="max-w-2xl text-xs leading-5 text-zinc-600 sm:text-sm sm:leading-6">
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
          <div className="space-y-4 rounded-none border border-zinc-200/70 bg-linear-to-br from-white via-zinc-50/70 to-zinc-100/70 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Schedule Flow</p>
                <p className="mt-1 text-sm font-semibold text-zinc-950">End-to-end generation pipeline</p>
              </div>
              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 shadow-sm">
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

          <div className="space-y-4 rounded-none border border-zinc-200/70 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-[10px] font-bold text-white">
                1
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Prepare
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="gen-semester" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Semester
                </Label>
                <Select
                  value={effectiveSemesterId}
                  onValueChange={handleSemesterChange}
                  disabled={semestersLoading || semesters.length === 0 || isBusy}
                >
                  <SelectTrigger id="gen-semester" className="h-11 w-full min-w-0 rounded-none border-zinc-200 bg-zinc-50/40 px-3 shadow-sm hover:border-zinc-300 focus-visible:ring-zinc-300/50">
                    <SelectValue placeholder={semestersLoading ? "Loading…" : "Select semester"} />
                  </SelectTrigger>
                  <SelectContent className="max-w-[min(30rem,var(--radix-select-trigger-width))]">
                    {semesters.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}{s.year ? ` (${s.year})` : ""}{s.isActive ? " · Active" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="gen-name" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Name
                </Label>
                <Input
                  id="gen-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Spring 2026 — Final Exams"
                  className="h-11 rounded-none border-zinc-200 bg-zinc-50/40 shadow-sm hover:border-zinc-300 focus-visible:ring-zinc-300/50"
                  disabled={isBusy}
                />
                {name.trim().length > 0 && name.trim().length < 3 && (
                  <p className="text-[11px] text-amber-600">Name must be at least 3 characters.</p>
                )}
                {name.trim().length >= 3 && isDuplicateName && (
                  <p className="text-[11px] text-rose-600">A schedule with this name already exists. Choose a different name.</p>
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
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
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
                ) : (
                  <ShieldCheck className="size-3.5" />
                )}
                {isPreparing ? "Preparing..." : isValidating ? "Validating..." : isBuildingDraft ? "Building..." : isEvaluating ? "Evaluating..." : isOptimizing ? "Optimizing..." : isReEvaluating ? "Re-evaluating..." : isConfirming ? "Confirming..." : hasRun ? "Run Again" : "Start"}
              </Button>
            </div>

            {phase === "idle" && (
              <div className="flex items-center gap-2.5 rounded-none border border-dashed border-zinc-200 bg-zinc-50/60 px-4 py-3 text-xs text-zinc-500">
                <ShieldCheck className="size-4 shrink-0 text-zinc-300" />
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
                  <div className="inline-flex items-center gap-2 rounded-none border border-zinc-200 bg-zinc-50/70 px-3 py-2 text-[11px] text-zinc-600 shadow-sm">
                    <CalendarDays className="size-3.5 shrink-0 text-zinc-500" />
                    <span className="font-semibold uppercase tracking-[0.14em] text-zinc-500">Semester</span>
                    <span className="font-semibold text-zinc-900">{prepare.semester.name}</span>
                  </div>
                )}
              </div>
            )}

            {phase === "ready" && !zeroAssignments && (
              <div className="space-y-3">
                <div className="rounded-none border border-emerald-200 bg-linear-to-r from-emerald-50 via-white to-emerald-100/70 px-4 py-4 shadow-[0_18px_36px_-24px_rgba(16,185,129,0.45)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-none border border-emerald-200 bg-white text-emerald-700 shadow-sm">
                        <CheckCircle2 className="size-4" />
                      </span>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Ready</p>
                        <p className="mt-1 text-base font-semibold text-emerald-950">Ready to generate</p>
                        <p className="mt-1 text-xs text-emerald-800">Feasible draft confirmed</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 shadow-sm">
                      Optimized
                    </span>
                  </div>
                </div>

                {shouldShowQuality && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.25fr_0.75fr]">
                      <div className="rounded-none border border-zinc-200 bg-linear-to-br from-white via-zinc-50/60 to-zinc-100/70 px-4 py-4 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Weak Areas</p>
                            <p className="mt-1 text-sm font-semibold text-zinc-950">Priority quality gaps in the evaluated draft</p>
                          </div>
                          <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-zinc-500 shadow-sm">
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
                          <div className="mt-4 rounded-none border border-emerald-200 bg-emerald-50/80 px-3 py-3 text-xs text-emerald-800">
                            No weak areas detected in the evaluated draft.
                          </div>
                        )}
                      </div>
                      <div className="rounded-none border border-emerald-200 bg-linear-to-br from-emerald-50 via-white to-emerald-100/80 px-4 py-4 shadow-[0_18px_40px_-24px_rgba(16,185,129,0.6)]">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Optimization Changes Applied</p>
                            <p className="mt-1 text-sm font-semibold text-emerald-950">Accepted repair actions and re-check summary</p>
                          </div>
                          <span className="inline-flex size-10 items-center justify-center rounded-none border border-emerald-200 bg-white text-emerald-700 shadow-sm">
                            <Sparkles className="size-4" />
                          </span>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="rounded-none border border-emerald-200/70 bg-white/80 px-3 py-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Changes</p>
                            <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-950">{optimizationChangesApplied}</p>
                          </div>
                          <div className="rounded-none border border-emerald-200/70 bg-white/80 px-3 py-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Strategies</p>
                            <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-950">{optimizationStrategyCount}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-3 rounded-none border border-emerald-200/70 bg-white/80 px-3 py-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Search Coverage</p>
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-800">
                            {optimizationStrategyCount} strategies checked
                          </span>
                        </div>
                        <p className="mt-3 text-xs font-medium text-emerald-800">Re-evaluated improved score: {formatScore(afterScore)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <QualityMetricCard label="Room Utilization" value={getQualityMetric(validationResult, optimizationResult, "roomUtilization")} />
                      <QualityMetricCard label="Proctor Balance" value={getQualityMetric(validationResult, optimizationResult, "proctorWorkloadBalance")} />
                      <QualityMetricCard label="Student Spacing" value={getQualityMetric(validationResult, optimizationResult, "studentSpacing")} />
                      <QualityMetricCard label="Exam Distribution" value={getQualityMetric(validationResult, optimizationResult, "examDistribution")} />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <ScoreSummaryCard label="After Optimization" value={formatScore(afterScore)} variant="optimized" />
                      <ScoreSummaryCard label="Improvement" value={`+${Math.max(0, Math.round(improvement))}%`} variant="improvement" />
                      <ScoreSummaryCard label="Before Score" value={formatScore(beforeScore)} variant="draft" />
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
                    <div key={suggestion} className="rounded-none border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700">
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
        <DialogFooter className="px-6 py-4 border-t border-zinc-200/70 bg-zinc-50/60 flex sm:items-center gap-3">
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
            className="rounded-none h-10 bg-zinc-950 text-white hover:bg-zinc-900 font-semibold inline-flex items-center gap-2"
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
};

const getLogicalAssignmentCount = (assignments: ScheduleAssignment[] = []) => {
  const keys = new Set<string>();
  for (const assignment of assignments) {
    keys.add(`${assignment.examId}:${assignment.timeSlotId}`);
  }
  return keys.size;
};

const CALENDAR_PALETTES: CalendarPalette[] = [
  {
    cardBg: "bg-indigo-50/70",
    cardBorder: "border-indigo-200/70",
    badgeBg: "bg-white",
    badgeText: "text-indigo-700",
    accent: "text-indigo-700",
  },
  {
    cardBg: "bg-amber-50/80",
    cardBorder: "border-amber-200/70",
    badgeBg: "bg-white",
    badgeText: "text-amber-700",
    accent: "text-amber-700",
  },
  {
    cardBg: "bg-rose-50/70",
    cardBorder: "border-rose-200/70",
    badgeBg: "bg-white",
    badgeText: "text-rose-700",
    accent: "text-rose-700",
  },
  {
    cardBg: "bg-emerald-50/70",
    cardBorder: "border-emerald-200/70",
    badgeBg: "bg-white",
    badgeText: "text-emerald-700",
    accent: "text-emerald-700",
  },
  {
    cardBg: "bg-sky-50/70",
    cardBorder: "border-sky-200/70",
    badgeBg: "bg-white",
    badgeText: "text-sky-700",
    accent: "text-sky-700",
  },
  {
    cardBg: "bg-violet-50/70",
    cardBorder: "border-violet-200/70",
    badgeBg: "bg-white",
    badgeText: "text-violet-700",
    accent: "text-violet-700",
  },
  {
    cardBg: "bg-teal-50/70",
    cardBorder: "border-teal-200/70",
    badgeBg: "bg-white",
    badgeText: "text-teal-700",
    accent: "text-teal-700",
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
      <Card className="rounded-none border border-zinc-200/60 bg-white shadow-sm">
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
    <Card className="rounded-none border border-zinc-200/60 bg-white shadow-sm">
      <CardContent className="p-0">
        {/* Sticky month switcher */}
        <div className="sticky top-0 z-10 border-b border-zinc-200/70 bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (canGoPrev) setSelectedMonth(monthsOfYear[monthIndex - 1]);
              }}
              disabled={!canGoPrev}
              aria-label="Previous month"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                        ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                        : hasExams
                        ? "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:text-zinc-900"
                        : "border-zinc-200 bg-white text-zinc-400 hover:border-zinc-300 hover:text-zinc-600"
                    )}
                  >
                    {formatMonthLabel(mKey)}
                    {hasExams && (
                      <span
                        className={cn(
                          "inline-block size-1.5 rounded-full",
                          isActive ? "bg-white/80" : "bg-zinc-900"
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
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            {effectiveMonth && (
              <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                {formatMonthFullLabel(effectiveMonth)}
                <span className="ml-2 normal-case tracking-normal text-zinc-400">
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
                          ? "bg-zinc-900 text-white"
                          : "text-zinc-500 hover:text-zinc-900"
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
            <CalendarRange className="mx-auto size-8 text-zinc-300" />
            <div className="mt-2 text-sm font-semibold text-zinc-700">
              No exam available
            </div>
            <div className="text-xs text-zinc-500">
              No exams are scheduled in {formatMonthFullLabel(effectiveMonth)}.
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
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
                                    <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug text-zinc-900">
                                      {title}
                                    </h3>
                                  </div>
                                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                                    <ExamStatusBadge
                                      status={getAssignmentDisplayStatus({ isFinal })}
                                      variant="pill"
                                    />
                                  </div>
                                </div>

                                {/* Time */}
                                <div className="flex items-center gap-2 text-xs text-zinc-700">
                                  <Clock
                                    className={cn("size-3.5", palette.accent)}
                                  />
                                  <span className="font-semibold tabular-nums">
                                    {formatTime(ts?.startTime)} – {formatTime(ts?.endTime)}
                                  </span>
                                  {a.exam?.duration != null && (
                                    <span className="ml-auto inline-flex items-center rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                                      {a.exam.duration} min
                                    </span>
                                  )}
                                </div>

                                {/* Inner mini card */}
                                <div className="rounded-xl border border-white/70 bg-white/80 p-3 shadow-sm backdrop-blur-sm">
                                  <div className="flex items-center gap-2 text-xs text-zinc-700">
                                    <DoorOpen className="size-3.5 text-zinc-500" />
                                    <span className="truncate font-medium">
                                      {a.room?.name ?? "Not assigned"}
                                    </span>
                                    {a.room?.center?.name && (
                                      <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-zinc-500">
                                        <MapPin className="size-3" />
                                        <span className="truncate">
                                          {a.room.center.name}
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-700">
                                    <UserCheck className="size-3.5 text-zinc-500" />
                                    <span className="truncate">
                                      {a.proctor?.user?.name ?? "Not assigned"}
                                    </span>
                                  </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between border-t border-white/70 pt-2.5">
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                                    <Users className="size-3.5" />
                                    {studentsCount}{" "}
                                    {studentsCount === 1 ? "student" : "students"}
                                  </span>
                                  {a.exam?.courseOffering?.semester?.name && (
                                    <span className="truncate text-[11px] text-zinc-500">
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
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="rounded-none max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <UserCheck className="size-4" />
          Assigned Proctors
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-2 py-1 max-h-80 overflow-y-auto">
        {proctorAssignments.map((a, i) => {
          const sup = a.proctor;
          return (
            <div
              key={a.id ?? i}
              className="flex items-center gap-3 p-3 rounded-none border border-zinc-200/60 bg-zinc-50/40"
            >
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-none bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200 font-semibold text-sm">
                {(sup?.user?.name?.[0] ?? "?").toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-zinc-950 truncate">
                  {sup?.user?.name ?? "Unknown"}
                </div>
                {sup?.user?.email && (
                  <div className="text-xs text-zinc-500 flex items-center gap-1 truncate">
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
  const groupedAssignments = useMemo(() => {
    if (!a) return [] as ScheduleAssignment[];
    return assignments.filter(
      (candidate) =>
        candidate.examId === a.examId && candidate.timeSlotId === a.timeSlotId
    );
  }, [a, assignments]);
  const totalAllocatedCapacity = useMemo(
    () => groupedAssignments.reduce((sum, item) => sum + (item.room?.capacity ?? 0), 0),
    [groupedAssignments]
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
              status={getAssignmentDisplayStatus({ isFinal })}
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
                      Room Rows
                    </div>
                    <div className="mt-1 text-sm font-semibold text-zinc-950 tabular-nums">
                      {groupedAssignments.length}
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
                  {groupedAssignments.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 rounded-none border border-zinc-200/60 bg-zinc-50/40 p-3"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
                          <DoorOpen className="size-4 text-emerald-700" />
                          <span className="truncate">{item.room?.name ?? "Not assigned"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <MapPin className="size-3.5" />
                          <span className="truncate">{item.room?.center?.name ?? "No center"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <UserCheck className="size-3.5" />
                          <span className="truncate">{item.proctor?.user?.name ?? "No proctor"}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-xs text-zinc-500">
                        <div className="font-semibold text-zinc-950 tabular-nums">
                          {item.room?.capacity ?? 0} seats
                        </div>
                        {item.proctor?.user?.email && (
                          <div className="mt-1 max-w-42 truncate">{item.proctor.user.email}</div>
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
                          {(sup.center?.name ?? sup.department) && (
                            <div className="text-[11px] text-zinc-400 mt-0.5">
                              {sup.center?.name ?? sup.department}
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
                    <ExamStatusBadge status={getAssignmentDisplayStatus({ isFinal })} variant="pill" />
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
                <ul className="divide-y divide-zinc-100 max-h-72 overflow-y-auto -mx-1 px-1">
                  {registrations.map((reg, idx) => {
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
  onOpenChange,
  onChanged,
}: {
  assignment: ScheduleAssignment | null;
  onOpenChange: (next: boolean) => void;
  onChanged?: (scheduleId: string) => void;
}) => {
  const open = Boolean(assignment);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Assignment</DialogTitle>
        </DialogHeader>
        {assignment ? (
          <EditAssignmentForm
            key={assignment.id}
            assignment={assignment}
            onClose={() => onOpenChange(false)}
            onChanged={onChanged}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

const EXAM_STATUS_OPTIONS = [
  "DRAFT",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;
type ExamStatusValue = (typeof EXAM_STATUS_OPTIONS)[number];

const EditAssignmentForm = ({
  assignment,
  onClose,
  onChanged,
}: {
  assignment: ScheduleAssignment;
  onClose: () => void;
  onChanged?: (scheduleId: string) => void;
}) => {
  const updateMutation = useUpdateAssignment();
  const roomsQuery = useRooms();
  const proctorsQuery = useProctors();
  const timeSlotsQuery = useTimeSlots();

  const [roomId, setRoomId] = useState<string>(assignment.roomId ?? "");
  const [proctorId, setProctorId] = useState<string>(
    assignment.proctorId ?? ""
  );
  const [timeSlotId, setTimeSlotId] = useState<string>(
    assignment.timeSlotId ?? ""
  );

  const initialDuration =
    assignment.exam?.duration != null ? String(assignment.exam.duration) : "";
  const initialStatus = (assignment.exam?.status ?? "") as ExamStatusValue | "";

  const [duration, setDuration] = useState<string>(initialDuration);
  const [status, setStatus] = useState<ExamStatusValue | "">(initialStatus);

  const rooms = roomsQuery.data ?? [];
  const proctors = proctorsQuery.data ?? [];
  const timeSlots = timeSlotsQuery.data ?? [];

  const trimmedDuration = duration.trim();
  const parsedDuration =
    trimmedDuration === "" ? null : Number.parseInt(trimmedDuration, 10);
  const durationInvalid =
    trimmedDuration !== "" &&
    (Number.isNaN(parsedDuration) || (parsedDuration ?? 0) <= 0);

  const dirty =
    roomId !== assignment.roomId ||
    proctorId !== assignment.proctorId ||
    timeSlotId !== assignment.timeSlotId ||
    parsedDuration !== (assignment.exam?.duration ?? null) ||
    (status || null) !== (assignment.exam?.status ?? null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!dirty || durationInvalid) return;

    const payload: {
      roomId?: string;
      proctorId?: string;
      timeSlotId?: string;
      exam?: { duration?: number; status?: ExamStatusValue };
    } = {};

    if (roomId !== assignment.roomId) payload.roomId = roomId;
    if (proctorId !== assignment.proctorId)
      payload.proctorId = proctorId;
    if (timeSlotId !== assignment.timeSlotId)
      payload.timeSlotId = timeSlotId;

    const examPatch: { duration?: number; status?: ExamStatusValue } = {};
    if (parsedDuration !== (assignment.exam?.duration ?? null)) {
      if (parsedDuration != null) examPatch.duration = parsedDuration;
    }
    if ((status || null) !== (assignment.exam?.status ?? null)) {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
      <div className="space-y-1.5">
        <Label htmlFor="edit-room">Room</Label>
        <Select
          value={roomId}
          onValueChange={setRoomId}
          disabled={isPending || roomsQuery.isLoading}
        >
          <SelectTrigger id="edit-room" className="rounded-none">
            <SelectValue placeholder="Select a room" />
          </SelectTrigger>
          <SelectContent>
            {rooms.map((r) => (
              <SelectItem key={r.id} value={r.id ?? ""}>
                {r.name}
                {r.capacity != null ? ` · cap ${r.capacity}` : ""}
                {r.center?.name ? ` · ${r.center.name}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit-proctor">Proctor</Label>
        <Select
          value={proctorId}
          onValueChange={setProctorId}
          disabled={isPending || proctorsQuery.isLoading}
        >
          <SelectTrigger id="edit-proctor" className="rounded-none">
            <SelectValue placeholder="Select a proctor" />
          </SelectTrigger>
          <SelectContent>
            {proctors.map((s) => (
              <SelectItem key={s.id} value={s.id ?? ""}>
                {s.user?.name ?? s.name ?? "—"}
                {s.user?.email ? ` · ${s.user.email}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit-timeslot">Time Slot</Label>
        <Select
          value={timeSlotId}
          onValueChange={setTimeSlotId}
          disabled={isPending || timeSlotsQuery.isLoading}
        >
          <SelectTrigger id="edit-timeslot" className="rounded-none">
            <SelectValue placeholder="Select a time slot" />
          </SelectTrigger>
          <SelectContent>
            {timeSlots.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {formatDate(t.date ?? t.startTime)} · {formatTime(t.startTime)}{" "}
                – {formatTime(t.endTime)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="edit-duration">
            Duration{" "}
            <span className="text-zinc-400 font-normal">(optional, min)</span>
          </Label>
          <Input
            id="edit-duration"
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="e.g. 90"
            className="rounded-none"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            disabled={isPending}
          />
          {durationInvalid && (
            <p className="text-[11px] text-rose-600">
              Duration must be a positive whole number.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-status">
            Status <span className="text-zinc-400 font-normal">(optional)</span>
          </Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as ExamStatusValue)}
            disabled={isPending}
          >
            <SelectTrigger id="edit-status" className="rounded-none">
              <SelectValue placeholder="Keep current" />
            </SelectTrigger>
            <SelectContent>
              {EXAM_STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {errorMessage && (
        <div className="border border-rose-200 bg-rose-50 text-rose-700 text-xs p-2 flex items-start gap-2">
          <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <DialogFooter className="mt-4">
        <Button
          type="button"
          variant="outline"
          className="rounded-none"
          onClick={onClose}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="rounded-none bg-zinc-950 hover:bg-zinc-800"
          disabled={!dirty || durationInvalid || isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            "Save Changes"
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
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [generateOpen, setGenerateOpen] = useState(false);
  const [publishTarget, setPublishTarget] = useState<Schedule | null>(null);

  // filters
  const [semesterFilter, setSemesterFilter] = useState<string>(ALL);
  const [courseFilter, setCourseFilter] = useState<string>(ALL);
  const [proctorFilter, setProctorFilter] = useState<string>(ALL);
  const [centerFilter, setCenterFilter] = useState<string>(ALL);
  const [dateFilter, setDateFilter] = useState<string>(ALL);

  // view mode (table | calendar)
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");

  const schedulesQuery = useSchedules({ limit: 100 });
  const schedules = schedulesQuery.data?.data ?? [];

  const routeScheduleId =
    searchParams.get("scheduleId") ?? searchParams.get("id") ?? undefined;
  const routeAssignmentId = searchParams.get("assignmentId") ?? undefined;

  // auto-select most recent
  const effectiveId = routeScheduleId ?? selectedId ?? schedules[0]?.id;

  const scheduleQuery = useSchedule(effectiveId);
  const schedule: Schedule | undefined = scheduleQuery.data?.id === effectiveId ? scheduleQuery.data : undefined;
  const assignmentsQuery = useScheduleAssignments(effectiveId);

  const publishMutation = usePublishSchedule();
  const unpublishMutation = useUnpublishSchedule();
  const semestersQuery = useSemesters();
  const semesters = (semestersQuery.data ?? []) as SemesterOption[];

  const showPageLoading = useDelayedLoading(schedulesQuery.isLoading, 800);

  const assignments: ScheduleAssignment[] = useMemo(
    () => (assignmentsQuery.data ?? []).filter((assignment) => assignment.scheduleId === effectiveId),
    [assignmentsQuery.data, effectiveId]
  );

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
      const searchIndex = group
        .flatMap((assignment) => [
          assignment.exam?.courseOffering?.course?.code,
          assignment.exam?.courseOffering?.course?.name,
          assignment.exam?.courseOffering?.course?.title,
          assignment.exam?.courseOffering?.semester?.name,
          assignment.room?.name,
          assignment.room?.center?.name,
          assignment.proctor?.user?.name,
          assignment.proctor?.user?.email,
        ])
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return {
        ...primary,
        assignmentIds,
        roomIds,
        proctorIds,
        centerIds,
        searchIndex,
      };
    });
  }, [assignments]);

  // derived filter options from the current schedule
  const filterOptions = useMemo(() => {
    const semestersMap = new Map<string, string>();
    const coursesMap = new Map<string, string>();
    const proctorsMap = new Map<string, string>();
    const centersMap = new Map<string, string>();
    const datesSet = new Set<string>();

    for (const a of assignments) {
      const sem = a.exam?.courseOffering?.semester;
      if (sem?.id) semestersMap.set(sem.id, sem.name ?? sem.id);
      const course = a.exam?.courseOffering?.course;
      if (course?.id) coursesMap.set(course.id, course.code ?? course.name ?? course.id);
      const sup = a.proctor;
      if (sup?.id) proctorsMap.set(sup.id, sup.user?.name ?? sup.user?.email ?? sup.id);
      const center = a.room?.center;
      if (center?.id) centersMap.set(center.id, center.name);
      const dKey = dateKey(a.timeSlot?.date ?? a.timeSlot?.startTime);
      if (dKey) datesSet.add(dKey);
    }

    const sortedDates = Array.from(datesSet).sort();
    return {
      semesters: Array.from(semestersMap.entries()),
      courses: Array.from(coursesMap.entries()),
      proctors: Array.from(proctorsMap.entries()),
      centers: Array.from(centersMap.entries()),
      dates: sortedDates,
    };
  }, [assignments]);

  // filtered + searched assignments
  const filteredAssignments = useMemo(() => {
    const term = search.trim().toLowerCase();
    return persistedAssignments.filter((a) => {
      if (semesterFilter !== ALL && a.exam?.courseOffering?.semester?.id !== semesterFilter) return false;
      if (courseFilter !== ALL && a.exam?.courseOffering?.course?.id !== courseFilter) return false;
      if (proctorFilter !== ALL && !a.proctorIds.includes(proctorFilter)) return false;
      if (centerFilter !== ALL && !a.centerIds.includes(centerFilter)) return false;
      if (dateFilter !== ALL) {
        const k = dateKey(a.timeSlot?.date ?? a.timeSlot?.startTime);
        if (k !== dateFilter) return false;
      }
      if (!term) return true;
      return a.searchIndex.includes(term);
    });
  }, [persistedAssignments, search, semesterFilter, courseFilter, proctorFilter, centerFilter, dateFilter]);

  const calendarAssignments = filteredAssignments;

  const stats = useMemo(() => {
    const rooms = new Set<string>();
    const proctors = new Set<string>();
    for (const a of assignments) {
      if (a.roomId) rooms.add(a.roomId);
      if (a.proctorId) proctors.add(a.proctorId);
    }
    return {
      total: persistedAssignments.length,
      rooms: rooms.size,
      proctors: proctors.size,
    };
  }, [assignments, persistedAssignments.length]);

  const versionCountOverrides = useMemo(() => {
    if (!effectiveId) return {} as Record<string, { assignments?: number }>;

    return {
      [effectiveId]: {
        assignments: persistedAssignments.length,
      },
    };
  }, [effectiveId, persistedAssignments.length]);

  // Selected assignment for the row actions
  const [viewAssignment, setViewAssignment] = useState<ScheduleAssignment | null>(null);
  const [editAssignment, setEditAssignment] = useState<ScheduleAssignment | null>(null);
  const [deleteAssignment, setDeleteAssignment] = useState<ScheduleAssignmentListItem | null>(null);
  const [viewProctors, setViewProctors] = useState<ScheduleAssignment[] | null>(null);
  const [lastHighlightedAssignmentId, setLastHighlightedAssignmentId] = useState<string | null>(null);

  const clearFilters = () => {
    setSemesterFilter(ALL);
    setCourseFilter(ALL);
    setProctorFilter(ALL);
    setCenterFilter(ALL);
    setDateFilter(ALL);
    setSearch("");
  };

  const activeFilterCount = [
    semesterFilter,
    courseFilter,
    proctorFilter,
    centerFilter,
    dateFilter,
  ].filter((v) => v !== ALL).length;

  const hasActiveFilters = search.trim() !== "" || activeFilterCount > 0;
  const highlightedAssignmentId =
    routeAssignmentId && routeAssignmentId !== lastHighlightedAssignmentId
      ? routeAssignmentId
      : null;
  const activeViewMode = routeAssignmentId ? "table" : viewMode;

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
    setGenerateOpen(false);
    const newId = result?.scheduleId ?? result?.schedule?.id;
    if (newId) {
      // Delay navigation until after the dialog close animation (duration-200) to
      // prevent the re-render from remounting the dialog mid-animation (reappear glitch).
      setTimeout(() => {
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
        setSearchParams(nextParams);
        void schedulesQuery.refetch();
      }, 250);
    } else {
      void schedulesQuery.refetch();
    }
  };

  const handleAssignmentChanged = (scheduleId: string) => {
    void schedulesQuery.refetch();
    void assignmentsQuery.refetch();
    if (scheduleId === effectiveId) {
      void scheduleQuery.refetch();
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

  const isDetailLoading =
    scheduleQuery.isLoading ||
    scheduleQuery.isFetching ||
    assignmentsQuery.isLoading ||
    assignmentsQuery.isFetching;
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
          onClick={() => setGenerateOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-none border border-zinc-950 bg-zinc-950 font-semibold text-white shadow-sm transition-all hover:bg-zinc-900 active:scale-95"
        >
          <Sparkles className="size-4" />
          Generate Schedule
        </Button>

        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button
                  variant="outline"
                  onClick={handlePublish}
                  disabled={
                    !schedule ||
                    schedule.isFinal === true ||
                    publishMutation.isPending
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
            </TooltipTrigger>
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
              <StatusBadge isFinal={schedule.isFinal} />
            </>
          )}
        </div>
      </StickyActionBar>

      {/* Schedule Versions */}
      <ScheduleVersionsTable
        schedules={schedules}
        activeId={effectiveId}
        countOverrides={versionCountOverrides}
        onRequestPublish={openPublishDialog}
        onSelect={(id) => {
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
          setSearchParams(nextParams);
        }}
        onDeleted={(deletedId) => {
          if (deletedId === effectiveId) {
            setSelectedId(undefined);
          }
          schedulesQuery.refetch();
        }}
        isPublishing={publishMutation.isPending}
        onRefetch={() => schedulesQuery.refetch()}
        isLoading={schedulesQuery.isLoading}
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
                onClick: () => setGenerateOpen(true),
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
                  Assignments cannot be edited or deleted while published. Use &ldquo;Return to
                  Draft&rdquo; to unlock, make changes, then republish.
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
          <Card className="rounded-none border border-zinc-200/60 bg-white shadow-sm mb-4">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search course, room, proctor…"
                    className="h-10 rounded-none border-zinc-200 bg-transparent pl-9 text-sm"
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
                    <FilterField label="Semester">
                      <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                        <SelectTrigger className="h-10 rounded-none border-zinc-200 bg-transparent">
                          <SelectValue placeholder="All semesters" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL}>All semesters</SelectItem>
                          {filterOptions.semesters.map(([id, label]) => (
                            <SelectItem key={id} value={id}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FilterField>

                    <FilterField label="Course">
                      <Select value={courseFilter} onValueChange={setCourseFilter}>
                        <SelectTrigger className="h-10 rounded-none border-zinc-200 bg-transparent">
                          <SelectValue placeholder="All courses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL}>All courses</SelectItem>
                          {filterOptions.courses.map(([id, label]) => (
                            <SelectItem key={id} value={id}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FilterField>

                    <FilterField label="Proctor">
                      <Select value={proctorFilter} onValueChange={setProctorFilter}>
                        <SelectTrigger className="h-10 rounded-none border-zinc-200 bg-transparent">
                          <SelectValue placeholder="All proctors" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL}>All proctors</SelectItem>
                          {filterOptions.proctors.map(([id, label]) => (
                            <SelectItem key={id} value={id}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FilterField>

                    <FilterField label="Center">
                      <Select value={centerFilter} onValueChange={setCenterFilter}>
                        <SelectTrigger className="h-10 rounded-none border-zinc-200 bg-transparent">
                          <SelectValue placeholder="All centers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL}>All centers</SelectItem>
                          {filterOptions.centers.map(([id, label]) => (
                            <SelectItem key={id} value={id}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FilterField>

                    <FilterField label="Date">
                      <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger className="h-10 rounded-none border-zinc-200 bg-transparent">
                          <SelectValue placeholder="All dates" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL}>All dates</SelectItem>
                          {filterOptions.dates.map((d) => (
                            <SelectItem key={d} value={d}>
                              {formatDate(d)}
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
                onClick={() => setViewMode("table")}
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
                onClick={() => setViewMode("calendar")}
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
          <Card className="rounded-none border border-zinc-200/60 bg-white shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-zinc-50/60">
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
                    {isDetailLoading ? (
                      <TableRow>
                        <TableCell colSpan={12} className="p-0">
                          <TableSkeletonRows
                            columns={12}
                            rows={
                              filteredAssignments.length > 0
                                ? filteredAssignments.length
                                : 10
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ) : filteredAssignments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} className="p-0">
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
                      filteredAssignments.map((a) => {
                        const course = a.exam?.courseOffering?.course;
                        const sem = a.exam?.courseOffering?.semester;
                        const ts = a.timeSlot;
                        const proctorAssignments = assignments.filter((assignment) =>
                          a.assignmentIds.includes(assignment.id)
                        );
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
                              "text-sm cursor-pointer transition-all duration-300 hover:bg-zinc-50/80 focus-visible:bg-zinc-50/80 focus:outline-none",
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

                                  <LockedActionTooltip isLocked={!!schedule?.isFinal}>
                                    <DropdownMenuItem
                                      className="rounded-none cursor-pointer"
                                      disabled={!!schedule?.isFinal}
                                      onClick={(e) => {
                                        if (schedule?.isFinal) return e.preventDefault();
                                        setEditAssignment(a);
                                      }}
                                    >
                                      <Pencil className="size-4 mr-2" /> Edit assignment
                                    </DropdownMenuItem>
                                  </LockedActionTooltip>

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
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
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
        onOpenChange={setGenerateOpen}
        semesters={semesters}
        semestersLoading={semestersQuery.isLoading}
        onGenerated={handleGenerated}
        existingNames={schedules.map((s) => s.name)}
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
