import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { TimeSlot } from "../../schemas/timeSlot";
import { AlertTriangle, Clock, Edit2, Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { TableSkeletonRows } from "../../components/ui/skeleton";
import { EmptyState } from "../../components/shared/EmptyState";

interface TimeSlotListProps {
  timeSlots: TimeSlot[];
  isLoading?: boolean;
  isDeleting?: boolean;
  search?: string;
  onEditTimeSlot: (slot: TimeSlot) => void;
  onDeleteTimeSlot: (slot: TimeSlot) => void;
  onAddTimeSlot?: () => void;
}

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  // Always display in UTC so ISO-stored datetimes match the intended calendar date
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
};

const formatTime = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });
};

const computeDuration = (slot: TimeSlot): number => {
  if (typeof slot.duration === "number" && slot.duration > 0) return slot.duration;
  const diff = new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime();
  return Math.max(0, Math.round(diff / 60000));
};

const dateKey = (slot: TimeSlot) => {
  const value = slot.date ?? slot.startTime;
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const detectConflicts = (slots: TimeSlot[]): Set<string> => {
  const conflicting = new Set<string>();
  const byDate = new Map<string, TimeSlot[]>();
  for (const s of slots) {
    const key = dateKey(s);
    if (!key) continue;
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(s);
  }
  for (const list of byDate.values()) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        const aStart = new Date(a.startTime).getTime();
        const aEnd = new Date(a.endTime).getTime();
        const bStart = new Date(b.startTime).getTime();
        const bEnd = new Date(b.endTime).getTime();
        if (aStart < bEnd && aEnd > bStart) {
          conflicting.add(a.id);
          conflicting.add(b.id);
        }
      }
    }
  }
  return conflicting;
};

export function TimeSlotList({
  timeSlots,
  isLoading,
  isDeleting,
  search,
  onEditTimeSlot,
  onDeleteTimeSlot,
  onAddTimeSlot,
}: TimeSlotListProps) {
  const slotRows = Array.isArray(timeSlots) ? timeSlots : [];
  const conflictIds = detectConflicts(slotRows);

  return (
    <Card className="overflow-hidden rounded-none border border-zinc-200/80 bg-white/90 shadow-lg shadow-zinc-200/40">
      <CardHeader className="flex flex-col gap-4 border-b border-zinc-200/60 px-4 py-5 sm:px-6 sm:py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center rounded-none bg-zinc-950 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-white shadow-sm shadow-zinc-950/10">
            Scheduling Layer
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950">
            Time Slot Management
          </CardTitle>
          <p className="text-sm leading-6 text-zinc-500 max-w-2xl">
            Define exam time windows. Overlapping slots on the same date are flagged for review before assignments are made.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-none bg-linear-to-br from-zinc-50 to-zinc-100/80 px-5 py-3 border border-zinc-200/60 shadow-sm">
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">Total Slots</p>
            <p className="text-3xl font-bold tracking-tight text-zinc-950 mt-1">{slotRows.length}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="border-b border-zinc-200/60 hover:bg-transparent bg-zinc-50/40">
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">Date</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">Start Time</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">End Time</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600">Duration</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600 text-right">Assignments</TableHead>
                <TableHead className="px-4 py-4 sm:px-6 font-bold text-xs uppercase tracking-[0.12em] text-zinc-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <TableSkeletonRows columns={6} rows={8} />
                  </TableCell>
                </TableRow>
              ) : slotRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    {search?.trim() ? (
                      <EmptyState
                        icon={Clock}
                        title="No results found"
                        description={`No time slots match "${search.trim()}". Try a different search term.`}
                      />
                    ) : (
                      <EmptyState
                        icon={Clock}
                        title="No time slots yet"
                        description="Create your first time slot to begin scheduling exams."
                        action={onAddTimeSlot ? { label: "Add Time Slot", onClick: onAddTimeSlot } : undefined}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                slotRows.map((slot, idx) => {
                  const inConflict = conflictIds.has(slot.id);
                  const assignmentsCount = slot?.assignments?.length ?? slot?.assignmentsCount ?? 0;
                  return (
                    <TableRow
                      key={slot.id}
                      className={cn(
                        "border-b border-zinc-200/40 transition-all duration-200 hover:bg-zinc-50/60",
                        idx === slotRows.length - 1 && "border-b-0",
                        inConflict && "bg-amber-50/40 shadow-[inset_4px_0_0_0_#f59e0b]"
                      )}
                    >
                      <TableCell className="px-4 py-4 sm:px-6">
                        <div className="font-semibold text-zinc-950 text-sm flex items-center gap-2">
                          {formatDate(slot.date ?? slot.startTime)}
                          {inConflict && (
                            <span className="inline-flex items-center gap-1 rounded-none border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-700">
                              <AlertTriangle className="size-3" /> Conflict
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 sm:px-6 text-sm text-zinc-700 font-mono">
                        {formatTime(slot.startTime)}
                      </TableCell>
                      <TableCell className="px-4 py-4 sm:px-6 text-sm text-zinc-700 font-mono">
                        {formatTime(slot.endTime)}
                      </TableCell>
                      <TableCell className="px-4 py-4 sm:px-6 text-sm text-zinc-700">
                        {computeDuration(slot)} min
                      </TableCell>
                      <TableCell className="px-4 py-4 sm:px-6 text-right">
                        <span className="inline-flex items-center justify-center rounded-none bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-700 min-w-10">
                          {assignmentsCount}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditTimeSlot(slot)}
                            className="h-8 w-8 rounded-none text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors p-0 flex items-center justify-center"
                            title="Edit time slot"
                          >
                            <Edit2 className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isDeleting}
                            onClick={() => onDeleteTimeSlot(slot)}
                            className="h-8 w-8 rounded-none text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors p-0 flex items-center justify-center disabled:opacity-50"
                            title="Delete time slot"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
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
  );
}
