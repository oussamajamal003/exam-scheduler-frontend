import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { usePersistentFilters } from "../../hooks/common/usePersistentFilters";
import { TimeSlotList } from "../../features/timeslots/TimeSlotList";
import { TimeSlotForm } from "../../forms/timeSlots/TimeSlotForm";
import {
  useCreateTimeSlot,
  useDeleteTimeSlot,
  useTimeSlotsPage,
  useUpdateTimeSlot,
} from "../../hooks/timeSlots/useTimeSlots";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent } from "../../components/ui/card";
import { TimeSlot, TimeSlotFormValues } from "../../schemas/timeSlot";
import { getApiErrorMessage, getApiValidationErrors } from "../../lib/apiError";
import { PageSpinner } from "../../components/shared/PageSpinner";
import { DeleteConfirmModal } from "../../components/shared/DeleteConfirmModal";
import { BulkDeleteToolbar } from "../../components/shared/BulkTableActions";
import { StickyActionBar } from "../../components/common/StickyActionBar";
import { useDelayedLoading } from "../../hooks/common/useDelayedLoading";
import { useBulkDelete } from "../../hooks/common/useBulkDelete";
import { CalendarCheck, ChevronLeft, ChevronRight, Clock, ListChecks, Plus, RefreshCw, Search, TrendingUp } from "lucide-react";

const todayKey = () => new Date().toISOString().slice(0, 10);

const dateKey = (slot: TimeSlot) => {
  const value = slot.date ?? slot.startTime;
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const PAGE_SIZE = 50;

export function TimeSlotsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { filters, setFilter } = usePersistentFilters('timeslots', { search: '' });
  const search = filters.search;
  const setSearch = (value: string) => setFilter('search', value);
  const deferredSearch = useDeferredValue(search.trim());

  const pageParam = Number(searchParams.get("page") ?? "1");
  const currentPage = Number.isFinite(pageParam) && pageParam >= 1 ? Math.floor(pageParam) : 1;

  const setPage = (next: number) => {
    const nextParams = new URLSearchParams(searchParams);
    if (next <= 1) nextParams.delete("page");
    else nextParams.set("page", String(next));
    setSearchParams(nextParams, { replace: true });
  };

  // Reset to page 1 whenever the search term changes
  useEffect(() => {
    if (currentPage !== 1) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("page");
      setSearchParams(nextParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredSearch]);

  const timeSlotsQuery = useTimeSlotsPage({ page: currentPage, pageSize: PAGE_SIZE, search: deferredSearch });
  const timeSlots = useMemo(() => timeSlotsQuery.data?.data ?? [], [timeSlotsQuery.data]);
  const slotsMeta = timeSlotsQuery.data?.meta;
  const totalSlots = slotsMeta?.total ?? 0;
  const totalPages = slotsMeta?.totalPages ?? 1;
  const isLoading = timeSlotsQuery.isLoading;
  const isFetching = timeSlotsQuery.isFetching;
  const isError = timeSlotsQuery.isError;
  const error = timeSlotsQuery.error;
  const refetch = timeSlotsQuery.refetch;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [deletingSlot, setDeletingSlot] = useState<TimeSlot | null>(null);

  const createMutation = useCreateTimeSlot();
  const updateMutation = useUpdateTimeSlot();
  const deleteMutation = useDeleteTimeSlot();
  const bulkDelete = useBulkDelete({ entityName: "time slot", entityNamePlural: "time slots", deleteItem: (id) => deleteMutation.mutateAsync(id) });

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
        { onSuccess: closeFormModal }
      );
      return;
    }
    createMutation.mutate(data, { onSuccess: closeFormModal });
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
    deleteMutation.mutate(deletingSlot.id, { onSuccess: closeDeleteModal });
  };

  const handleRefresh = () => {
    refetch();
  };

  const isSearching = search.trim() !== deferredSearch;
  const isTableLoading = isSearching || isFetching || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || bulkDelete.isDeleting;
  const showTableLoading = useDelayedLoading(isTableLoading);

  const stats = useMemo(() => {
    const today = todayKey();
    let used = 0;
    let todayCount = 0;
    for (const slot of timeSlots) {
      if (dateKey(slot) === today) todayCount += 1;
      if ((slot.assignmentsCount ?? 0) > 0) used += 1;
    }
    return {
      total: totalSlots,
      today: todayCount,
      used,
      available: timeSlots.length - used,
    };
  }, [timeSlots, totalSlots]);

  const pageErrorMessage = getApiErrorMessage(error, "Failed to load time slots.");
  const showPageLoading = useDelayedLoading(isLoading, 1000);

  if (showPageLoading) {
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
    <div className="p-5 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 space-y-1">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-none bg-zinc-950 text-white shadow-sm">
            <Clock className="size-5" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">Time Slots</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Define exam time windows and detect overlaps before assigning rooms and proctors
            </p>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <StickyActionBar className="flex flex-col gap-3 sm:flex-row">
        <Button
          onClick={openCreateModal}
          disabled={isFetching || isSaving}
          className="inline-flex h-10 items-center gap-2 rounded-none border border-zinc-950 bg-zinc-950 font-semibold text-white shadow-sm transition-all hover:bg-zinc-900 active:scale-95"
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
            className="h-10 rounded-none border-zinc-200 bg-transparent pl-9 text-sm hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50 group-data-[stuck=true]:bg-white dark:border-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:bg-zinc-900/70 dark:focus-visible:border-zinc-700 dark:focus-visible:ring-zinc-700/70 dark:group-data-[stuck=true]:bg-zinc-950/70"
          />
        </div>
      </StickyActionBar>

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
        <BulkDeleteToolbar selectedCount={bulkDelete.selectedCount} totalCount={timeSlots.length} isDeleting={bulkDelete.isDeleting || deleteMutation.isPending} onClear={bulkDelete.clearSelection} onDelete={() => bulkDelete.setIsConfirmOpen(true)} />
        <TimeSlotList
          timeSlots={timeSlots}
          isLoading={showTableLoading}
          isDeleting={deleteMutation.isPending || bulkDelete.isDeleting}
          search={search}
          selectedIds={bulkDelete.selectedIds}
          onToggleSelected={bulkDelete.toggleSelected}
          onToggleAll={(checked) => bulkDelete.toggleAll(timeSlots, checked)}
          onEditTimeSlot={openEditModal}
          onDeleteTimeSlot={handleDelete}
          onAddTimeSlot={openCreateModal}
        />
        {totalPages > 1 && (
          <div className="mt-3 flex items-center justify-between gap-3 border border-zinc-200/60 bg-white px-4 py-3 text-xs text-zinc-600 sm:px-6">
            <p>
              Showing{" "}
              <span className="font-semibold text-zinc-900">
                {totalSlots === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
              </span>
              –
              <span className="font-semibold text-zinc-900">
                {Math.min(totalSlots, currentPage * PAGE_SIZE)}
              </span>{" "}
              of <span className="font-semibold text-zinc-900">{totalSlots}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                className="h-8 rounded-none px-2"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="font-semibold text-zinc-900">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                className="h-8 rounded-none px-2"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
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

      <DeleteConfirmModal
        open={bulkDelete.isConfirmOpen}
        title="Delete Selected Time Slots"
        description={`This will permanently delete ${bulkDelete.selectedCount} selected time slot${bulkDelete.selectedCount === 1 ? "" : "s"} and may affect linked assignments.`}
        confirmLabel="Bulk Delete"
        isLoading={bulkDelete.isDeleting}
        onCancel={() => bulkDelete.setIsConfirmOpen(false)}
        onConfirm={bulkDelete.confirmDelete}
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
