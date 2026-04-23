import { useMemo, useState } from "react";
import { TimeSlotList } from "../../features/timeslots/TimeSlotList";
import { TimeSlotForm } from "../../forms/timeSlots/TimeSlotForm";
import {
  useCreateTimeSlot,
  useDeleteTimeSlot,
  useTimeSlots,
  useUpdateTimeSlot,
} from "../../hooks/timeSlots/useTimeSlots";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent } from "../../components/ui/card";
import { TimeSlot, TimeSlotFormValues } from "../../schemas/timeSlot";
import { getApiErrorMessage, getApiValidationErrors } from "../../lib/apiError";
import { PageSpinner } from "../../components/shared/PageSpinner";
import { DeleteConfirmModal } from "../../components/shared/DeleteConfirmModal";
import { CalendarCheck, Clock, ListChecks, Plus, RefreshCw, Search, TrendingUp } from "lucide-react";
import { useToast } from "../../components/ui/toast";

const todayKey = () => new Date().toISOString().slice(0, 10);

const dateKey = (slot: TimeSlot) => {
  const value = slot.date ?? slot.startTime;
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const formatDateForSearch = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).toLowerCase();
};

const formatTimeForSearch = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });
};

export function TimeSlotsPage() {
  const [search, setSearch] = useState("");
  const { data: timeSlots = [], isLoading, isFetching, isError, error, refetch } = useTimeSlots();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [deletingSlot, setDeletingSlot] = useState<TimeSlot | null>(null);

  const createMutation = useCreateTimeSlot();
  const updateMutation = useUpdateTimeSlot();
  const deleteMutation = useDeleteTimeSlot();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const openCreateModal = () => {
    setEditingSlot(null);
    createMutation.reset();
    updateMutation.reset();
    setIsFormOpen(true);
  };

  const openEditModal = (slot: TimeSlot) => {
    setEditingSlot(slot);
    createMutation.reset();
    updateMutation.reset();
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingSlot(null);
    createMutation.reset();
    updateMutation.reset();
  };

  const handleSubmit = (data: TimeSlotFormValues) => {
    if (editingSlot?.id) {
      updateMutation.mutate(
        { id: editingSlot.id, data },
        { onSuccess: () => closeFormModal() }
      );
      return;
    }
    createMutation.mutate(data, { onSuccess: () => closeFormModal() });
  };

  const handleDelete = (slot: TimeSlot) => {
    deleteMutation.reset();
    setDeletingSlot(slot);
  };

  const closeDeleteModal = () => {
    setDeletingSlot(null);
    deleteMutation.reset();
  };

  const confirmDelete = () => {
    if (!deletingSlot?.id) return;
    deleteMutation.mutate(deletingSlot.id, { onSuccess: () => closeDeleteModal() });
  };

  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["timeSlots"] });
    addToast({ type: "success", title: "Refreshed", description: "Time slot data has been refreshed." });
  };

  const filteredSlots = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return timeSlots;
    return timeSlots.filter((s) => {
      const haystack = [
        formatDateForSearch(s.date ?? s.startTime),
        dateKey(s),
        formatTimeForSearch(s.startTime),
        formatTimeForSearch(s.endTime),
      ].filter(Boolean).join(" ");
      return haystack.includes(term);
    });
  }, [search, timeSlots]);

  const stats = useMemo(() => {
    const today = todayKey();
    let used = 0;
    let todayCount = 0;
    for (const slot of timeSlots) {
      if (dateKey(slot) === today) todayCount += 1;
      if ((slot.assignmentsCount ?? 0) > 0) used += 1;
    }
    return {
      total: timeSlots.length,
      today: todayCount,
      used,
      available: timeSlots.length - used,
    };
  }, [timeSlots]);

  const pageErrorMessage = getApiErrorMessage(error, "Failed to load time slots.");

  if (isLoading) {
    return (
      <div className="p-6">
        <PageSpinner label="Loading time slots" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <Card className="p-6 space-y-3 rounded-none border-destructive/30 bg-destructive/5">
          <p className="text-sm text-red-600">{pageErrorMessage}</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50/50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 space-y-1">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-none bg-zinc-950 text-white shadow-sm">
            <Clock className="size-5" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">Time Slots</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Define exam time windows and detect overlaps before assigning rooms and supervisors
            </p>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <Button
          onClick={openCreateModal}
          className="h-10 rounded-none bg-zinc-950 text-white font-semibold shadow-sm hover:bg-zinc-900 active:scale-95 transition-all inline-flex items-center gap-2"
        >
          <Plus className="size-4" />
          Add Time Slot
        </Button>
        <Button
          variant="outline"
          onClick={handleRefresh}
          className="h-10 rounded-none border-zinc-200 text-zinc-950 font-semibold hover:bg-zinc-50 active:scale-95 transition-all inline-flex items-center gap-2"
        >
          <RefreshCw className={`size-4 transition-transform ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <div className="relative sm:ml-auto sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by date or time"
            className="h-10 pl-9 rounded-none border-zinc-200 bg-white text-sm hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
          />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Total Slots</p>
                <p className="text-3xl font-bold text-zinc-950 mt-2">{stats.total}</p>
                <p className="text-xs text-zinc-500 mt-2">Across all dates</p>
              </div>
              <div className="p-2 rounded-none bg-blue-50">
                <Clock className="size-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Today</p>
                <p className="text-3xl font-bold text-zinc-950 mt-2">{stats.today}</p>
                <p className="text-xs text-zinc-500 mt-2">Scheduled today</p>
              </div>
              <div className="p-2 rounded-none bg-emerald-50">
                <CalendarCheck className="size-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Used</p>
                <p className="text-3xl font-bold text-zinc-950 mt-2">{stats.used}</p>
                <p className="text-xs text-zinc-500 mt-2">Have assignments</p>
              </div>
              <div className="p-2 rounded-none bg-violet-50">
                <ListChecks className="size-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Available</p>
                <p className="text-3xl font-bold text-zinc-950 mt-2">{stats.available}</p>
                <p className="text-xs text-zinc-500 mt-2">Open for use</p>
              </div>
              <div className="p-2 rounded-none bg-amber-50">
                <TrendingUp className="size-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <div className="mb-8">
        <TimeSlotList
          timeSlots={filteredSlots}
          isLoading={isSaving || deleteMutation.isPending}
          isDeleting={deleteMutation.isPending}
          onEditTimeSlot={openEditModal}
          onDeleteTimeSlot={handleDelete}
          onAddTimeSlot={openCreateModal}
        />
      </div>

      <DeleteConfirmModal
        open={Boolean(deletingSlot)}
        title="Delete Time Slot"
        description={
          deletingSlot
            ? "This will permanently delete the time slot and may affect linked assignments."
            : "This action cannot be undone."
        }
        confirmLabel="Delete Time Slot"
        isLoading={deleteMutation.isPending}
        errorMessage={
          deleteMutation.isError
            ? getApiErrorMessage(deleteMutation.error, "Failed to delete time slot.")
            : undefined
        }
        onCancel={closeDeleteModal}
        onConfirm={confirmDelete}
      />

      <Dialog open={isFormOpen} onOpenChange={(open) => (open ? setIsFormOpen(true) : closeFormModal())}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSlot ? "Edit Time Slot" : "Add New Time Slot"}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <TimeSlotForm
              initialData={editingSlot ?? undefined}
              existingSlots={timeSlots}
              onSubmit={handleSubmit}
              isLoading={isSaving}
              submitErrorMessage={
                createMutation.isError || updateMutation.isError
                  ? getApiErrorMessage(
                      createMutation.error || updateMutation.error,
                      "An error occurred while saving."
                    )
                  : undefined
              }
              submitValidationMessages={
                createMutation.isError || updateMutation.isError
                  ? getApiValidationErrors(createMutation.error || updateMutation.error)
                  : undefined
              }
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
