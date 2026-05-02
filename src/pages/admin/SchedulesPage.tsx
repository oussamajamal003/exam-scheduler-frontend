import { useEffect, useMemo, useState, type FormEvent } from "react";
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
  usePublishSchedule,
  useUnpublishSchedule,
  useSchedule,
  useSchedules,
  useUpdateSchedule,
  useValidateSchedulingInput,
} from "../../hooks/schedules/useSchedules";
import { useSemesters } from "../../hooks/semesters/useSemesters";
import { useRooms } from "../../hooks/rooms/useRooms";
import { useSupervisors } from "../../hooks/supervisors/useSupervisors";
import { useTimeSlots } from "../../hooks/timeSlots/useTimeSlots";
import {
  useDeleteAssignment,
  useUpdateAssignment,
} from "../../hooks/assignments/useAssignments";
import type {
  Schedule,
  ScheduleAssignment,
} from "../../schemas/schedule";
import type { Conflict } from "../../schemas/conflict";
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
import { ConflictBadges } from "../../components/shared/ConflictBadges";
import { PageSpinner } from "../../components/shared/PageSpinner";
import { useDelayedLoading } from "../../hooks/common/useDelayedLoading";
import { getApiErrorMessage } from "../../lib/apiError";
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
  onSelect,
  onDeleted,
  isLoading,
  onRefetch,
}: {
  schedules: Schedule[];
  activeId?: string | null;
  onSelect: (id: string) => void;
  onDeleted: (deletedId: string) => void;
  isLoading: boolean;
  onRefetch?: () => void;
}) => {
  const deleteMutation = useDeleteSchedule();
  const updateMutation = useUpdateSchedule();
  const publishMutation = usePublishSchedule();
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
                <TableHead className="h-9 text-center text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Conflicts
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
                  const assignmentsCount = s._count?.assignments ?? s.assignments?.length ?? 0;
                  const conflictsCount = s._count?.conflicts ?? s.conflicts?.length ?? 0;
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
                      <TableCell className="py-3 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center min-w-8 rounded-none border px-2 py-0.5 text-xs font-semibold tabular-nums",
                            conflictsCount > 0
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700"
                          )}
                        >
                          {conflictsCount}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!isActive && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onSelect(s.id)}
                              className="h-8 rounded-none px-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                            >
                              <Eye className="size-3.5 mr-1" />
                              View
                            </Button>
                          )}
                          {isActive && (
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
                                className="size-8 rounded-none text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 ml-1"
                              >
                                <MoreHorizontal className="size-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-none border-zinc-200 shadow-lg">
                              <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-zinc-500 font-semibold px-3 py-1.5">
                                Actions
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-zinc-100" />
                              
                              {/* Show Publish and Return to Draft dynamically */}
                              {!s.isFinal ? (
                                <DropdownMenuItem
                                  onClick={() => publishMutation.mutate(s.id, {
                                    onSuccess: () => onRefetch?.()
                                  })}
                                  className="cursor-pointer text-sm font-medium text-emerald-700 focus:text-emerald-700 focus:bg-emerald-50 px-3 py-2"
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
                  className="cursor-pointer text-sm font-medium text-zinc-700 focus:text-zinc-900 focus:bg-zinc-50 px-3 py-2"
                >
                  {unpublishMutation.isPending ? (
                    <Loader2 className="size-4 mr-2 animate-spin" />
                  ) : (
                    <Wrench className="size-4 mr-2 text-zinc-400" />
                  )}
                  Return to Draft
                </DropdownMenuItem>
              )}

                              {/* Edit & Delete always shown, but disabled with tooltip if isFinal */}
                              <LockedActionTooltip isLocked={!!s.isFinal}>
                                <DropdownMenuItem
                                  disabled={!!s.isFinal}
                                  onClick={(e) => {
                                    if (s.isFinal) return e.preventDefault();
                                    setRenameTarget(s);
                                    setNewName(s.name);
                                  }}
                                  className="cursor-pointer text-sm font-medium text-zinc-700 focus:text-zinc-900 focus:bg-zinc-50 px-3 py-2"
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
                                  className="cursor-pointer text-sm font-medium text-rose-600 focus:text-rose-600 focus:bg-rose-50 px-3 py-2"
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

type ComingSoonButtonProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tooltip: string;
  disabled?: boolean;
};

const ComingSoonButton = ({
  icon: Icon,
  label,
  tooltip,
  disabled,
}: ComingSoonButtonProps) => (
  <TooltipProvider delayDuration={150}>
    <Tooltip>
      <TooltipTrigger asChild>
        {/* Wrapper span keeps the tooltip working when the button is disabled. */}
        <span className="inline-flex">
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            aria-disabled
            className="h-10 rounded-none border-dashed border-zinc-300 text-zinc-700 font-semibold hover:bg-zinc-50 active:scale-95 transition-all inline-flex items-center gap-2"
          >
            <Icon className="size-4" />
            {label}
            <span className="ml-1 inline-flex items-center rounded-none bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Soon
            </span>
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const examStatusToneMap: Record<string, string> = {
  SCHEDULED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  COMPLETED: "border-blue-200 bg-blue-50 text-blue-700",
  CANCELLED: "border-zinc-200 bg-zinc-50 text-zinc-600",
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
  const tone = examStatusToneMap[status] ?? "border-zinc-200 bg-zinc-50 text-zinc-700";
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        variant === "pill" ? "rounded-full" : "rounded-none",
        tone
      )}
    >
      {status}
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
 
// -------------------- Generate dialog — pipeline: prepare → validate → generate --------------------

type SemesterOption = {
  id: string;
  name: string;
  year?: number | null;
  isActive?: boolean | null;
  startDate?: string | null;
  endDate?: string | null;
};

type PipelinePhase = "idle" | "preparing" | "validating" | "ready" | "failed" | "generating";

// Strip raw UUIDs from user-facing messages so they are always human-readable
const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const stripUuids = (msg: string) => msg.replace(UUID_RE, "").replace(/\s{2,}/g, " ").trim();

type CategoryMeta = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  cardClass: string;
  badgeClass: string;
  labelClass: string;
  dotClass: string;
};

const CATEGORY_META: Record<string, CategoryMeta> = {
  courseofferings: {
    label: "Course Offerings",
    icon: BookOpen,
    cardClass: "border-violet-100 bg-violet-50/40",
    badgeClass: "bg-violet-100 text-violet-700",
    labelClass: "text-violet-700",
    dotClass: "bg-violet-400",
  },
  rooms: {
    label: "Rooms",
    icon: DoorOpen,
    cardClass: "border-blue-100 bg-blue-50/40",
    badgeClass: "bg-blue-100 text-blue-700",
    labelClass: "text-blue-700",
    dotClass: "bg-blue-400",
  },
  supervisors: {
    label: "Supervisors",
    icon: UserCheck,
    cardClass: "border-amber-100 bg-amber-50/40",
    badgeClass: "bg-amber-100 text-amber-700",
    labelClass: "text-amber-700",
    dotClass: "bg-amber-400",
  },
  timeslots: {
    label: "Time Slots",
    icon: Clock,
    cardClass: "border-sky-100 bg-sky-50/40",
    badgeClass: "bg-sky-100 text-sky-700",
    labelClass: "text-sky-700",
    dotClass: "bg-sky-400",
  },
  capacity: {
    label: "Capacity",
    icon: Users,
    cardClass: "border-orange-100 bg-orange-50/40",
    badgeClass: "bg-orange-100 text-orange-700",
    labelClass: "text-orange-700",
    dotClass: "bg-orange-400",
  },
  studentoverlaprisks: {
    label: "Student Overlap Risks",
    icon: AlertTriangle,
    cardClass: "border-rose-100 bg-rose-50/40",
    badgeClass: "bg-rose-100 text-rose-700",
    labelClass: "text-rose-700",
    dotClass: "bg-rose-400",
  },
};

const CATEGORY_PRIORITY = [
  "courseofferings",
  "capacity",
  "rooms",
  "timeslots",
  "supervisors",
  "studentoverlaprisks",
];

const normalizeCatKey = (raw: string) =>
  raw.toLowerCase().replace(/[_\s-]/g, "").replace(/risk$/, "risks");

const resolveMeta = (raw: string): CategoryMeta =>
  CATEGORY_META[normalizeCatKey(raw)] ?? {
    label: raw
      .replace(/([A-Z])/g, " $1")
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim(),
    icon: AlertTriangle,
    cardClass: "border-rose-100 bg-rose-50/40",
    badgeClass: "bg-rose-100 text-rose-700",
    labelClass: "text-rose-700",
    dotClass: "bg-rose-400",
  };

type FailItem = {
  key: string;
  label: string;
  issues: string[];
  meta: CategoryMeta;
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

  const prepareMutation = usePrepareScheduling();
  const validateMutation = useValidateSchedulingInput();
  const generateMutation = useGenerateSchedule();

  const prepare = prepareMutation.data;
  const validation = validateMutation.data;

  const defaultSemesterId = useMemo(() => {
    if (semesters.length === 0) return "";
    return (semesters.find((s) => s.isActive) ?? semesters[0]).id;
  }, [semesters]);
  const effectiveSemesterId = semesterId || defaultSemesterId;

  // Reset pipeline state whenever the dialog closes
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setName("");
        setSemesterId("");
        setPhase("idle");
        setZeroAssignments(false);
        setMissingDates(false);
        prepareMutation.reset();
        validateMutation.reset();
        generateMutation.reset();
      }, 300);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSemesterChange = (next: string) => {
    setSemesterId(next);
    setPhase("idle");
    setZeroAssignments(false);
    setMissingDates(false);
    prepareMutation.reset();
    validateMutation.reset();
    generateMutation.reset();
  };

  /** Step 1+2: prepare → auto-chain validate */
  const runPreflightChecks = () => {
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
    validateMutation.reset();
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
                setPhase(result.isValid ? "ready" : "failed");
              },
              onError: () => setPhase("failed"),
            }
          );
        },
        onError: () => setPhase("failed"),
      }
    );
  };

  /** Step 3: generate */
  const handleGenerate = () => {
    if (phase !== "ready" || !effectiveSemesterId || name.trim().length < 3 || isDuplicateName) return;
    setPhase("generating");
    setZeroAssignments(false);
    generateMutation.mutate(
      { scheduleName: name.trim(), semesterId: effectiveSemesterId },
      {
        onSuccess: (result) => {
          const assignmentCount =
            (result as { assignmentsCount?: number }).assignmentsCount ??
            result?.summary?.assignedExams ??
            0;
          if (assignmentCount === 0) {
            setZeroAssignments(true);
            setPhase("ready");
          } else {
            onGenerated(result);
          }
        },
        onError: () => setPhase("ready"),
      }
    );
  };

  const isPreparing = phase === "preparing";
  const isValidating = phase === "validating";
  const isGenerating = phase === "generating";
  const isBusy = isPreparing || isValidating || isGenerating;
  const hasRun = phase !== "idle";
  const canRunChecks = Boolean(effectiveSemesterId) && !isBusy;
  const isDuplicateName = existingNames.some(
    (n) => n.trim().toLowerCase() === name.trim().toLowerCase()
  );
  const canGenerate = phase === "ready" && name.trim().length >= 3 && !isDuplicateName && !isGenerating && !zeroAssignments;

  // Build fail items: strip UUIDs, group by semantic category, sort by priority
  const failItems = useMemo<FailItem[]>(() => {
    if (!validation || validation.isValid) return [];
    const map = new Map<string, string[]>();

    const add = (rawKey: string, msgs: string[]) => {
      const key = normalizeCatKey(rawKey);
      const clean = msgs.map(stripUuids).filter(Boolean);
      if (clean.length === 0) return;
      map.set(key, [...(map.get(key) ?? []), ...clean]);
    };

    // New format: errors record keyed by category
    if (validation.errors && Object.keys(validation.errors).length > 0) {
      for (const [cat, msgs] of Object.entries(validation.errors)) {
        add(cat, msgs);
      }
    }

    // Legacy format: groups object
    if (map.size === 0 && validation.groups) {
      const legacyKeys = [
        "courseOfferings",
        "capacity",
        "rooms",
        "timeSlots",
        "supervisors",
        "studentOverlapRisks",
      ] as const;
      for (const rawKey of legacyKeys) {
        const g = (validation.groups as Record<string, { issues?: string[] }>)[rawKey];
        if (g?.issues?.length) add(rawKey, g.issues);
      }
    }

    // Enrich capacity section from offeringRegistrations details
    if (validation.details?.offeringRegistrations) {
      const capIssues: string[] = [];
      for (const r of validation.details.offeringRegistrations) {
        if (r.capacityInsufficient) {
          const course = [r.courseCode, r.courseTitle].filter(Boolean).join(" – ");
          capIssues.push(
            `${course || "Unknown course"}: ${r.registrationsCount} students exceed max room capacity of ${r.maxRoomCapacity}`
          );
        }
      }
      if (capIssues.length > 0) {
        const key = "capacity";
        map.set(key, Array.from(new Set([...(map.get(key) ?? []), ...capIssues])));
      }
    }

    // Flat fallback
    if (map.size === 0 && (validation.issues?.length ?? 0) > 0) {
      add("general", validation.issues!);
    }

    // Sort: priority categories first, then alphabetical
    const allKeys = Array.from(map.keys());
    const ordered = [
      ...CATEGORY_PRIORITY.filter((k) => allKeys.includes(k)),
      ...allKeys.filter((k) => !CATEGORY_PRIORITY.includes(k)).sort(),
    ];

    return ordered
      .map((key) => ({
        key,
        label: resolveMeta(key).label,
        issues: map.get(key) ?? [],
        meta: resolveMeta(key),
      }))
      .filter((item) => item.issues.length > 0);
  }, [validation]);

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!isBusy) onOpenChange(next); }}>
      <DialogContent className="sm:max-w-xl rounded-none p-0 gap-0 overflow-hidden">
        {/* Dialog header */}
        <DialogHeader className="px-6 py-5 border-b border-zinc-200/70 bg-zinc-50/60">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-none bg-zinc-950 text-white shadow-sm">
              <Sparkles className="size-4" />
            </span>
            <div>
              <DialogTitle className="text-base font-semibold text-zinc-950">
                Generate Schedule
              </DialogTitle>
              <p className="text-xs text-zinc-500 mt-0.5">
                Run pre-flight checks, validate inputs, then generate.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-6 max-h-[68vh] overflow-y-auto">
          {/* ── Step 1: Configure ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-[10px] font-bold text-white">
                1
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Configure
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="gen-semester" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Semester
                </Label>
                <Select
                  value={effectiveSemesterId}
                  onValueChange={handleSemesterChange}
                  disabled={semestersLoading || semesters.length === 0 || isBusy}
                >
                  <SelectTrigger id="gen-semester" className="h-10 rounded-none border-zinc-200 bg-transparent">
                    <SelectValue placeholder={semestersLoading ? "Loading…" : "Select semester"} />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}{s.year ? ` (${s.year})` : ""}{s.isActive ? " · Active" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gen-name" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Schedule Name
                </Label>
                <Input
                  id="gen-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Spring 2026 — Final Exams"
                  className="h-10 rounded-none"
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

          {/* ── Step 2: Pre-flight Checks ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-[10px] font-bold text-white">
                  2
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Pre-flight Checks
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={runPreflightChecks}
                disabled={!canRunChecks}
                className="h-8 rounded-none border-zinc-200 px-3 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                {isPreparing || isValidating ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="size-3.5" />
                )}
                {isPreparing ? "Preparing data..." : isValidating ? "Validating input..." : hasRun ? "Re-run Checks" : "Run Checks"}
              </Button>
            </div>

            {/* Idle hint */}
            {phase === "idle" && (
              <div className="flex items-center gap-2.5 rounded-none border border-dashed border-zinc-200 bg-zinc-50/60 px-4 py-3 text-xs text-zinc-500">
                <ShieldCheck className="size-4 shrink-0 text-zinc-300" />
                Select a semester above, then run pre-flight checks to validate all inputs.
              </div>
            )}

            {/* Preparing state */}
            {isPreparing && (
              <div className="flex items-center gap-3 rounded-none border border-zinc-200/60 bg-zinc-50/60 px-4 py-3">
                <Loader2 className="size-4 animate-spin text-zinc-400" />
                <span className="text-xs text-zinc-600">Preparing data…</span>
              </div>
            )}

            {/* Prepare preview — shown once prepare returns, hidden during validation/generation */}
            {prepare && !isPreparing && !isValidating && !isGenerating && (
              <div className="rounded-none border border-zinc-200/60 bg-zinc-50/40 p-4 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Ready to generate:
                </p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3">
                  {([
                    { label: "Active Offerings", value: prepare.activeCourseOfferingsCount ?? 0 },
                    { label: "Total Rooms", value: prepare.roomsCount ?? 0 },
                    { label: "Available Rooms", value: prepare.availableRoomsCount ?? 0 },
                    { label: "Supervisors", value: prepare.supervisorsCount ?? 0 },
                    { label: "Time Slots", value: prepare.timeSlotsCount ?? 0 },
                    ...(prepare.examsCount != null ? [{ label: "Exams", value: prepare.examsCount }] : []),
                  ] as { label: string; value: number }[]).map(({ label, value }) => (
                    <div key={label} className="flex items-baseline gap-1.5">
                      <span className="text-xl font-bold tabular-nums text-zinc-950">{value}</span>
                      <span className="text-[11px] leading-tight text-zinc-500">{label}</span>
                    </div>
                  ))}
                </div>
                {prepare.semester?.name && (
                  <p className="text-[11px] text-zinc-500 flex items-center gap-1.5 pt-1 border-t border-zinc-200/60">
                    <CalendarDays className="size-3 shrink-0" />
                    Semester:{" "}
                    <span className="font-semibold text-zinc-700">{prepare.semester.name}</span>
                  </p>
                )}
              </div>
            )}

            {/* Validating state */}
            {isValidating && (
              <div className="flex items-center gap-3 rounded-none border border-zinc-200/60 bg-zinc-50/60 px-4 py-3">
                <Loader2 className="size-4 animate-spin text-zinc-400" />
                <span className="text-xs text-zinc-600">Validating input…</span>
              </div>
            )}

            {/* Generating state */}
            {isGenerating && (
              <div className="flex items-center gap-3 rounded-none border border-zinc-200/60 bg-zinc-50/60 px-4 py-3">
                <Loader2 className="size-4 animate-spin text-zinc-400" />
                <span className="text-xs text-zinc-600">Generating schedule…</span>
              </div>
            )}

            {/* Validation passed — show only when ready and not generating yet */}
            {phase === "ready" && !zeroAssignments && (
              <div className="flex items-center gap-2.5 rounded-none border border-emerald-200 bg-emerald-50 px-4 py-3">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-xs font-semibold text-emerald-800">All checks passed</p>
                  {validation?.warnings && validation.warnings.length > 0 ? (
                    <ul className="mt-1 space-y-0.5">
                      {validation.warnings.map((w, i) => (
                        <li key={i} className="text-[11px] text-emerald-700 flex items-start gap-1">
                          <span className="mt-1 size-1 shrink-0 rounded-full bg-emerald-400 inline-block" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Scheduling data is valid. Enter a schedule name and click Generate.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Validation failed / API error */}
            {phase === "failed" && (
              <div className="space-y-2.5">
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
                ) : prepareMutation.isError ? (
                  <div className="flex items-start gap-2.5 rounded-none border border-rose-200 bg-rose-50 px-4 py-3">
                    <AlertTriangle className="size-4 shrink-0 text-rose-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-rose-800">Pre-flight preparation failed</p>
                      <p className="text-[11px] text-rose-700 mt-0.5">
                        {getApiErrorMessage(prepareMutation.error, "Could not prepare scheduling data. Please try again.")}
                      </p>
                    </div>
                  </div>
                ) : validateMutation.isError ? (
                  <div className="flex items-start gap-2.5 rounded-none border border-rose-200 bg-rose-50 px-4 py-3">
                    <AlertTriangle className="size-4 shrink-0 text-rose-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-rose-800">Validation request failed</p>
                      <p className="text-[11px] text-rose-700 mt-0.5">
                        {getApiErrorMessage(validateMutation.error, "Could not validate scheduling inputs. Please try again.")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 rounded-none border border-rose-200 bg-rose-50 px-4 py-3">
                    <AlertTriangle className="size-4 shrink-0 text-rose-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-rose-800">
                        Validation failed —{" "}
                        {failItems.length}{" "}
                        {failItems.length === 1 ? "category" : "categories"} with issues
                      </p>
                      <p className="text-[11px] text-rose-700 mt-0.5">
                        Resolve these issues before generating a schedule.
                      </p>
                    </div>
                  </div>
                )}

                {failItems.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {failItems.map(({ key, meta, issues }) => {
                      const CatIcon = meta.icon;
                      return (
                        <div
                          key={key}
                          className={cn("rounded-none border px-3 py-2.5 space-y-2", meta.cardClass)}
                        >
                          <div className="flex items-center gap-2">
                            <CatIcon className={cn("size-3.5 shrink-0", meta.labelClass)} />
                            <p className={cn("text-[10px] font-bold uppercase tracking-wider flex-1", meta.labelClass)}>
                              {meta.label}
                            </p>
                            <span
                              className={cn(
                                "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums",
                                meta.badgeClass
                              )}
                            >
                              {issues.length}
                            </span>
                          </div>
                          <ul className="space-y-1.5">
                            {issues.map((issue, j) => (
                              <li key={j} className="flex items-start gap-1.5 text-xs text-zinc-800">
                                <span className={cn("mt-1 size-1.5 shrink-0 rounded-full", meta.dotClass)} />
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Zero-assignments warning (after generation returns empty) */}
            {zeroAssignments && (
              <div className="flex items-start gap-2.5 rounded-none border border-amber-200 bg-amber-50 px-4 py-3">
                <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-800">No assignments were created</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    No assignments were created because all exams failed validation. Check exam data, room capacity, and time slots, then try again.
                  </p>
                </div>
              </div>
            )}

            {/* Generate error */}
            {generateMutation.isError && phase === "ready" && (
              <div className="flex items-start gap-2.5 rounded-none border border-rose-200 bg-rose-50/40 px-4 py-3">
                <AlertTriangle className="size-4 shrink-0 text-rose-600 mt-0.5" />
                <p className="text-xs text-rose-700">
                  {getApiErrorMessage(generateMutation.error, "Failed to generate schedule.")}
                </p>
              </div>
            )}
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
                Generate
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
  conflictTypesByAssignment,
  hasActiveFilters,
  onClearFilters,
  onSelectAssignment,
}: {
  assignments: ScheduleAssignment[];
  conflictTypesByAssignment: Map<string, string[]>;
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
                          const conflictTypes =
                            conflictTypesByAssignment.get(a.id) ?? [];
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
                                      status={a.exam?.status}
                                      variant="pill"
                                    />
                                  </div>
                                </div>

                                {/* Conflict / confirmed indicators */}
                                <ConflictBadges
                                  types={conflictTypes}
                                  compact
                                  max={3}
                                />

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
                                      {a.supervisor?.user?.name ?? "Not assigned"}
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

const ViewSupervisorsDialog = ({
  open,
  onOpenChange,
  assignments: supervisorAssignments,
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
          Assigned Supervisors
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-2 py-1 max-h-80 overflow-y-auto">
        {supervisorAssignments.map((a, i) => {
          const sup = a.supervisor;
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
  conflicts,
  conflictTypes,
  onOpenChange,
}: {
  assignment: ScheduleAssignment | null;
  assignments: ScheduleAssignment[];
  conflicts: Conflict[];
  conflictTypes: string[];
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

  // Filter conflicts that reference any of this assignment's identifiers (covers all grouped assignments).
  const relatedConflicts = useMemo(() => {
    if (!a) return [] as Conflict[];
    // Collect IDs from ALL assignments in this exam+slot group (not just the primary)
    const ids = new Set<string>();
    for (const g of groupedAssignments) {
      [g.examId, g.roomId, g.supervisorId, g.timeSlotId].forEach((id) => id && ids.add(id));
    }
    if (ids.size === 0) return [] as Conflict[];
    return conflicts.filter((c) =>
      [...ids].some((id) => (c.description ?? "").includes(id))
    );
  }, [a, groupedAssignments, conflicts]);

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
            <ExamStatusBadge status={a?.exam?.status} variant="pill" />
            <ConflictBadges types={conflictTypes} compact />
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
                          <span className="truncate">{item.supervisor?.user?.name ?? "No supervisor"}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-xs text-zinc-500">
                        <div className="font-semibold text-zinc-950 tabular-nums">
                          {item.room?.capacity ?? 0} seats
                        </div>
                        {item.supervisor?.user?.email && (
                          <div className="mt-1 max-w-42 truncate">{item.supervisor.user.email}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SheetSection>

            {/* Supervisor(s) */}
            <SheetSection
              icon={UserCheck}
              title={groupedAssignments.length > 1 ? `Supervisors (${groupedAssignments.length})` : "Supervisor"}
            >
              {groupedAssignments.length === 0 || !groupedAssignments[0]?.supervisor ? (
                <div className="text-sm text-zinc-500">Not assigned</div>
              ) : (
                <div className="space-y-2">
                  {groupedAssignments.map((item, idx) => {
                    const sup = item.supervisor;
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
                    <ExamStatusBadge status={a.exam?.status} variant="pill" />
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

            {/* Related Conflicts */}
            <SheetSection
              icon={AlertTriangle}
              title="Related Conflicts"
              hint={
                relatedConflicts.length === 0
                  ? "Conflict-free"
                  : `${relatedConflicts.length} ${
                      relatedConflicts.length === 1 ? "issue" : "issues"
                    }`
              }
            >
              {relatedConflicts.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-none">
                  <CheckCircle2 className="size-4" />
                  This assignment is clean — no conflicts detected.
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {relatedConflicts.map((c, idx) => (
                    <li
                      key={c.id ?? `conflict-${idx}`}
                      className="rounded-none border border-rose-200/70 bg-rose-50/60 p-3"
                    >
                      <div className="flex items-start gap-2 flex-wrap">
                        <ConflictBadges
                          types={[String(c.type ?? c.conflictType ?? "")]}
                          compact
                        />
                      </div>
                      {c.description && (
                        <div className="mt-2 text-sm text-rose-900/90">
                          {c.description}
                        </div>
                      )}
                      {c.suggestedFix && (
                        <div className="mt-1.5 text-xs text-rose-700/80">
                          <span className="font-semibold">Suggested:</span>{" "}
                          {c.suggestedFix}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </SheetSection>
          </div>
        ) : null}

        <SheetFooter className="bg-white border-t border-zinc-200/70 px-5 py-3">
          <Button
            variant="outline"
            className="rounded-none h-10 border-zinc-200 font-semibold"
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
}: {
  assignment: ScheduleAssignment | null;
  onOpenChange: (next: boolean) => void;
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
}: {
  assignment: ScheduleAssignment;
  onClose: () => void;
}) => {
  const updateMutation = useUpdateAssignment();
  const roomsQuery = useRooms();
  const supervisorsQuery = useSupervisors();
  const timeSlotsQuery = useTimeSlots();

  const [roomId, setRoomId] = useState<string>(assignment.roomId ?? "");
  const [supervisorId, setSupervisorId] = useState<string>(
    assignment.supervisorId ?? ""
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
  const supervisors = supervisorsQuery.data ?? [];
  const timeSlots = timeSlotsQuery.data ?? [];

  const trimmedDuration = duration.trim();
  const parsedDuration =
    trimmedDuration === "" ? null : Number.parseInt(trimmedDuration, 10);
  const durationInvalid =
    trimmedDuration !== "" &&
    (Number.isNaN(parsedDuration) || (parsedDuration ?? 0) <= 0);

  const dirty =
    roomId !== assignment.roomId ||
    supervisorId !== assignment.supervisorId ||
    timeSlotId !== assignment.timeSlotId ||
    parsedDuration !== (assignment.exam?.duration ?? null) ||
    (status || null) !== (assignment.exam?.status ?? null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!dirty || durationInvalid) return;

    const payload: {
      roomId?: string;
      supervisorId?: string;
      timeSlotId?: string;
      exam?: { duration?: number; status?: ExamStatusValue };
    } = {};

    if (roomId !== assignment.roomId) payload.roomId = roomId;
    if (supervisorId !== assignment.supervisorId)
      payload.supervisorId = supervisorId;
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
        <Label htmlFor="edit-supervisor">Supervisor</Label>
        <Select
          value={supervisorId}
          onValueChange={setSupervisorId}
          disabled={isPending || supervisorsQuery.isLoading}
        >
          <SelectTrigger id="edit-supervisor" className="rounded-none">
            <SelectValue placeholder="Select a supervisor" />
          </SelectTrigger>
          <SelectContent>
            {supervisors.map((s) => (
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
}: {
  assignment: ScheduleAssignment | null;
  onOpenChange: (next: boolean) => void;
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
      },
      {
        onSuccess: () => {
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
          Are you sure you want to delete the assignment for{" "}
          <span className="font-semibold text-zinc-950">
            {course?.title ?? course?.name ?? "this exam"}
          </span>
          {course?.code ? (
            <span className="text-zinc-500"> ({course.code})</span>
          ) : null}
          ? This removes only the room/supervisor/time-slot assignment. The
          exam, course, students, and registrations are preserved.
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
  const [search, setSearch] = useState("");
  const [generateOpen, setGenerateOpen] = useState(false);

  // filters
  const [semesterFilter, setSemesterFilter] = useState<string>(ALL);
  const [courseFilter, setCourseFilter] = useState<string>(ALL);
  const [supervisorFilter, setSupervisorFilter] = useState<string>(ALL);
  const [centerFilter, setCenterFilter] = useState<string>(ALL);
  const [dateFilter, setDateFilter] = useState<string>(ALL);

  // view mode (table | calendar)
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");

  const schedulesQuery = useSchedules({ limit: 100 });
  const schedules = schedulesQuery.data?.data ?? [];

  // auto-select most recent
  const effectiveId = selectedId ?? schedules[0]?.id;

  const scheduleQuery = useSchedule(effectiveId);
  const schedule: Schedule | undefined = scheduleQuery.data;

  const publishMutation = usePublishSchedule();
  const unpublishMutation = useUnpublishSchedule();
  const semestersQuery = useSemesters();
  const semesters = (semestersQuery.data ?? []) as SemesterOption[];

  const showPageLoading = useDelayedLoading(schedulesQuery.isLoading, 800);

  const assignments: ScheduleAssignment[] = useMemo(
    () => schedule?.assignments ?? [],
    [schedule]
  );

  // derived filter options from the current schedule
  const filterOptions = useMemo(() => {
    const semestersMap = new Map<string, string>();
    const coursesMap = new Map<string, string>();
    const supervisorsMap = new Map<string, string>();
    const centersMap = new Map<string, string>();
    const datesSet = new Set<string>();

    for (const a of assignments) {
      const sem = a.exam?.courseOffering?.semester;
      if (sem?.id) semestersMap.set(sem.id, sem.name ?? sem.id);
      const course = a.exam?.courseOffering?.course;
      if (course?.id) coursesMap.set(course.id, course.code ?? course.name ?? course.id);
      const sup = a.supervisor;
      if (sup?.id) supervisorsMap.set(sup.id, sup.user?.name ?? sup.user?.email ?? sup.id);
      const center = a.room?.center;
      if (center?.id) centersMap.set(center.id, center.name);
      const dKey = dateKey(a.timeSlot?.date ?? a.timeSlot?.startTime);
      if (dKey) datesSet.add(dKey);
    }

    const sortedDates = Array.from(datesSet).sort();
    return {
      semesters: Array.from(semestersMap.entries()),
      courses: Array.from(coursesMap.entries()),
      supervisors: Array.from(supervisorsMap.entries()),
      centers: Array.from(centersMap.entries()),
      dates: sortedDates,
    };
  }, [assignments]);

  // filtered + searched assignments
  const filteredAssignments = useMemo(() => {
    const term = search.trim().toLowerCase();
    return assignments.filter((a) => {
      if (semesterFilter !== ALL && a.exam?.courseOffering?.semester?.id !== semesterFilter) return false;
      if (courseFilter !== ALL && a.exam?.courseOffering?.course?.id !== courseFilter) return false;
      if (supervisorFilter !== ALL && a.supervisorId !== supervisorFilter) return false;
      if (centerFilter !== ALL && a.room?.center?.id !== centerFilter) return false;
      if (dateFilter !== ALL) {
        const k = dateKey(a.timeSlot?.date ?? a.timeSlot?.startTime);
        if (k !== dateFilter) return false;
      }
      if (!term) return true;
      const haystack = [
        a.exam?.courseOffering?.course?.code,
        a.exam?.courseOffering?.course?.name,
        a.exam?.courseOffering?.semester?.name,
        a.room?.name,
        a.room?.center?.name,
        a.supervisor?.user?.name,
        a.supervisor?.user?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [assignments, search, semesterFilter, courseFilter, supervisorFilter, centerFilter, dateFilter]);

  // Group filtered assignments by examId+timeSlotId so each unique exam/slot appears as one table row
  type GroupedRow = { key: string; primary: ScheduleAssignment; siblings: ScheduleAssignment[] };
  const groupedRows = useMemo<GroupedRow[]>(() => {
    const groups = new Map<string, ScheduleAssignment[]>();
    for (const a of filteredAssignments) {
      const key = `${a.examId}:${a.timeSlotId}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(a);
    }
    return Array.from(groups.entries()).map(([key, items]) => ({
      key,
      primary: items[0],
      siblings: items,
    }));
  }, [filteredAssignments]);

  const stats = useMemo(() => {
    const rooms = new Set<string>();
    const supervisors = new Set<string>();
    const uniqueExamSlots = new Set<string>();
    for (const a of assignments) {
      if (a.roomId) rooms.add(a.roomId);
      if (a.supervisorId) supervisors.add(a.supervisorId);
      uniqueExamSlots.add(`${a.examId}:${a.timeSlotId}`);
    }
    return {
      total: uniqueExamSlots.size,
      conflicts: schedule?.conflicts?.length ?? schedule?._count?.conflicts ?? 0,
      rooms: rooms.size,
      supervisors: supervisors.size,
    };
  }, [assignments, schedule]);

  // Per-assignment list of conflict types (one entry per matching conflict, may repeat).
  const conflictTypesByAssignment = useMemo(() => {
    const map = new Map<string, string[]>();
    const conflicts = schedule?.conflicts ?? [];
    if (conflicts.length === 0) return map;
    for (const a of assignments) {
      const tokens = [a.examId, a.roomId, a.supervisorId, a.timeSlotId].filter(
        Boolean
      ) as string[];
      const types: string[] = [];
      for (const c of conflicts) {
        const desc = c.description ?? "";
        if (tokens.some((t) => desc.includes(t))) {
          const t = String(
            (c as { type?: string; conflictType?: string }).type ??
              (c as { conflictType?: string }).conflictType ??
              ""
          );
          if (t) types.push(t);
        }
      }
      if (types.length > 0) map.set(a.id, types);
    }
    return map;
  }, [assignments, schedule]);

  // Selected assignment for the row actions
  const [viewAssignment, setViewAssignment] = useState<ScheduleAssignment | null>(null);
  const [editAssignment, setEditAssignment] = useState<ScheduleAssignment | null>(null);
  const [deleteAssignment, setDeleteAssignment] = useState<ScheduleAssignment | null>(null);
  const [viewSupervisors, setViewSupervisors] = useState<ScheduleAssignment[] | null>(null);

  const clearFilters = () => {
    setSemesterFilter(ALL);
    setCourseFilter(ALL);
    setSupervisorFilter(ALL);
    setCenterFilter(ALL);
    setDateFilter(ALL);
    setSearch("");
  };

  const activeFilterCount = [
    semesterFilter,
    courseFilter,
    supervisorFilter,
    centerFilter,
    dateFilter,
  ].filter((v) => v !== ALL).length;

  const hasActiveFilters = search.trim() !== "" || activeFilterCount > 0;

  const handleGenerated = (result: { scheduleId?: string; schedule?: { id?: string } }) => {
    setGenerateOpen(false);
    const newId = result?.scheduleId ?? result?.schedule?.id;
    if (newId) {
      setSelectedId(newId);
      // Refetch the list first, then force-refresh the newly selected schedule's details
      void schedulesQuery.refetch().then(() => void scheduleQuery.refetch());
    }
  };

  const handlePublish = () => {
    if (!schedule?.id || schedule.isFinal) return;
    publishMutation.mutate(schedule.id, {
      onSuccess: () => scheduleQuery.refetch(),
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

  const isDetailLoading = scheduleQuery.isLoading || scheduleQuery.isFetching;

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
              Generate, review and publish exam schedules across semesters, centers and supervisors.
            </p>
          </div>
        </div>
      </div>

      {/* Action bar: selector + actions + status */}
      <StickyActionBar className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex items-center gap-2 lg:min-w-70">
          <Select
            value={effectiveId ?? ""}
            onValueChange={(v) => setSelectedId(v)}
            disabled={schedules.length === 0}
          >
            <SelectTrigger className="h-10 w-full rounded-none border-zinc-200 bg-transparent">
              <SelectValue placeholder="Select schedule" />
            </SelectTrigger>
            <SelectContent>
              {schedules.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => setGenerateOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-none border border-zinc-950 bg-zinc-950 font-semibold text-white shadow-sm transition-all hover:bg-zinc-900 active:scale-95"
        >
          <Sparkles className="size-4" />
          Generate Schedule
        </Button>

        <Button
          variant="outline"
          onClick={handlePublish}
          disabled={!schedule || schedule.isFinal || publishMutation.isPending}
          className="h-10 rounded-none border-zinc-200 text-zinc-950 font-semibold hover:bg-zinc-50 active:scale-95 transition-all inline-flex items-center gap-2"
        >
          {publishMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CheckCircle2 className="size-4" />
          )}
          {schedule?.isFinal ? "Published" : "Mark as Final"}
        </Button>

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

        <ComingSoonButton
          icon={Wand2}
          label="Optimize Schedule"
          tooltip="Optimization will improve schedule quality using soft constraints. Coming soon."
          disabled={!schedule}
        />

        <ComingSoonButton
          icon={Wrench}
          label="Fix Conflicts"
          tooltip="Auto-suggest fixes for detected conflicts. Coming soon."
          disabled={!schedule}
        />

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
              <StatusBadge isFinal={schedule.isFinal} />
            </>
          )}
        </div>
      </StickyActionBar>

      <p className="-mt-1 mb-6 flex items-center gap-1.5 text-xs text-zinc-500">
        <Wand2 className="size-3.5" />
        Optimization will improve schedule quality using soft constraints.
      </p>

      {/* Schedule Versions */}
      <ScheduleVersionsTable
        schedules={schedules}
        activeId={effectiveId}
        onSelect={(id) => {
          setSelectedId(id);
          scheduleQuery.refetch();
        }}
        onDeleted={(deletedId) => {
          if (deletedId === effectiveId) {
            setSelectedId(undefined);
          }
          schedulesQuery.refetch();
        }}
        onRefetch={() => schedulesQuery.refetch()}
        isLoading={schedulesQuery.isLoading}
      />

      {/* Empty: no schedules at all */}
      {schedules.length === 0 ? (
        <Card className="rounded-none border border-zinc-200/60 bg-white shadow-sm">
          <CardContent className="p-0">
            <EmptyState
              icon={CalendarDays}
              title="No schedules yet"
              description="Generate your first schedule to start assigning exams to rooms, supervisors and time slots."
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
                  Draft&rdquo; to unlock, make changes, re-run conflict check, then republish.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {isDetailLoading && !schedule ? (
              Array.from({ length: 4 }).map((_, i) => (
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
                  label="Conflicts"
                  value={stats.conflicts}
                  hint={stats.conflicts === 0 ? "No conflicts detected" : "Detected in this schedule"}
                  icon={AlertTriangle}
                  tone="rose"
                />
                <StatCard
                  label="Rooms Used"
                  value={stats.rooms}
                  hint="Distinct rooms allocated"
                  icon={DoorOpen}
                  tone="emerald"
                />
                <StatCard
                  label="Supervisors"
                  value={stats.supervisors}
                  hint="Distinct supervisors assigned"
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
                    placeholder="Search course, room, supervisor…"
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

                    <FilterField label="Supervisor">
                      <Select value={supervisorFilter} onValueChange={setSupervisorFilter}>
                        <SelectTrigger className="h-10 rounded-none border-zinc-200 bg-transparent">
                          <SelectValue placeholder="All supervisors" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL}>All supervisors</SelectItem>
                          {filterOptions.supervisors.map(([id, label]) => (
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
          {scheduleQuery.isError && (
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
                  View generated exam assignments, rooms, supervisors, time slots, conflicts, and publication status in one relational schedule view.
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
          {viewMode === "table" ? (
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
                      <TableHead className="text-xs uppercase tracking-wide text-zinc-500">Supervisor</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide text-zinc-500 text-right">Students</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide text-zinc-500">Status</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide text-zinc-500 text-right">Duration</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide text-zinc-500">Conflict</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide text-zinc-500 text-right w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isDetailLoading ? (
                      <TableRow>
                        <TableCell colSpan={13} className="p-0">
                          <TableSkeletonRows
                            columns={13}
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
                        <TableCell colSpan={13} className="p-0">
                          <EmptyState
                            icon={ClipboardList}
                            title={hasActiveFilters ? "No matching assignments" : stats.conflicts > 0 && assignments.length === 0 ? "No assignments were created" : "No assignments yet"}
                            description={hasActiveFilters ? "Try clearing filters or selecting another schedule." : stats.conflicts > 0 && assignments.length === 0 ? "No assignments were created because all exams failed validation. Check exam data, room capacity, and time slots, then try again." : "This schedule has no assignments. Generate or regenerate to populate it."} 
                            action={
                              hasActiveFilters
                                ? { label: "Clear filters", onClick: clearFilters }
                                : undefined
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      groupedRows.map(({ key, primary: a, siblings }) => {
                        const course = a.exam?.courseOffering?.course;
                        const sem = a.exam?.courseOffering?.semester;
                        const ts = a.timeSlot;
                        const studentsCount =
                          a.exam?.courseOffering?.registrations?.length ??
                          a.exam?.courseOffering?.expectedStudents ??
                          0;
                        const duration = a.exam?.duration;
                        // Collect conflict types across all sibling assignments for this exam+slot
                        const conflictTypes = Array.from(
                          new Set(siblings.flatMap((s) => conflictTypesByAssignment.get(s.id) ?? []))
                        );
                        const courseTitle = course?.title ?? course?.name ?? "Not assigned";
                        const isMultiSupervisor = siblings.length > 1;
                        return (
                          <TableRow
                            key={key}
                            className="text-sm cursor-pointer transition-colors hover:bg-zinc-50/80 focus-visible:bg-zinc-50/80 focus:outline-none"
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
                              {isMultiSupervisor ? (
                                <div className="flex items-center gap-2">
                                  <div>
                                    <div className="font-medium text-zinc-800">
                                      {siblings.length} Supervisors
                                    </div>
                                    <div className="text-xs text-zinc-500 truncate max-w-40">
                                      {siblings
                                        .map((s) => s.supervisor?.user?.name)
                                        .filter(Boolean)
                                        .join(", ")}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 shrink-0 rounded-none px-2.5 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setViewSupervisors(siblings);
                                    }}
                                  >
                                    <Eye className="size-3 mr-1" />
                                    View
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <div className="font-medium">{a.supervisor?.user?.name ?? "Not assigned"}</div>
                                  {a.supervisor?.user?.email && (
                                    <div className="text-xs text-zinc-500">{a.supervisor.user.email}</div>
                                  )}
                                </>
                              )}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-zinc-700">{studentsCount}</TableCell>
                            <TableCell>
                              <ExamStatusBadge status={a.exam?.status} />
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-zinc-700 whitespace-nowrap">
                              {duration != null ? `${duration} min` : "—"}
                            </TableCell>
                            <TableCell>
                              <ConflictBadges types={conflictTypes} compact max={2} />
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
              assignments={filteredAssignments}
              conflictTypesByAssignment={conflictTypesByAssignment}
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
        assignments={schedule?.assignments ?? []}
        conflicts={schedule?.conflicts ?? []}
        conflictTypes={
          viewAssignment ? conflictTypesByAssignment.get(viewAssignment.id) ?? [] : []
        }
        onOpenChange={(next) => {
          if (!next) setViewAssignment(null);
        }}
      />

      <EditAssignmentDialog
        assignment={editAssignment}
        onOpenChange={(next) => {
          if (!next) setEditAssignment(null);
        }}
      />

      <DeleteAssignmentDialog
        assignment={deleteAssignment}
        onOpenChange={(next) => {
          if (!next) setDeleteAssignment(null);
        }}
      />

      <ViewSupervisorsDialog
        open={Boolean(viewSupervisors)}
        onOpenChange={(next) => {
          if (!next) setViewSupervisors(null);
        }}
        assignments={viewSupervisors ?? []}
      />
    </div>
  );
}

export default SchedulesPage;
