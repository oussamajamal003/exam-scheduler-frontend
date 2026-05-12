import { useDeferredValue, useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { PageSpinner } from "../../components/shared/PageSpinner";
import { DeleteConfirmModal } from "../../components/shared/DeleteConfirmModal";
import { StickyActionBar } from "../../components/common/StickyActionBar";
import { getApiErrorMessage, getApiValidationErrors } from "../../lib/apiError";
import { ClipboardList, Users, Plus, RefreshCw, TrendingUp, Search, Calendar, Clock } from "lucide-react";
import { EmptyState } from "../../components/shared/EmptyState";
import { useDelayedLoading } from "../../hooks/common/useDelayedLoading";
import { ScrollArea } from "../../components/ui/scroll-area";

import { ProctorList } from "../../features/proctors/ProctorList";
import { ProctorForm } from "../../forms/proctors/ProctorForm";
import { Proctor } from "../../schemas/proctor";
import { useProctors, useCreateProctor, useUpdateProctor, useDeleteProctor, useProctorWorkload } from "../../hooks/proctors/useProctors";

function formatAvailabilityLabel(slot: NonNullable<Proctor["availableTimeSlots"]>[number]) {
  const date = slot.date || slot.startTime;
  const day = date
    ? new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    : "Unknown day";
  const start = new Date(slot.startTime).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
  const end = new Date(slot.endTime).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });

  return `${day} • ${start} - ${end}`;
}

function WorkloadContent({ proctor, onClose }: { proctor: Proctor | null; onClose: () => void }) {
  const { data, isLoading, isError, error } = useProctorWorkload(proctor?.id ?? null);
  const availableTimeSlots = proctor?.availableTimeSlots ?? [];

  const fmtDate = (value?: string | null) => {
    if (!value) return null;
    try {
      return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
    } catch { return null; }
  };

  const fmtTime = (value?: string | null) => {
    if (!value) return null;
    try {
      return new Date(value).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "UTC" });
    } catch { return null; }
  };

  if (isLoading) return <PageSpinner label="Loading workload" className="min-h-32" />;
  if (isError) return (
    <div className="rounded-none border border-destructive/30 bg-destructive/5 px-3 py-3 text-sm text-destructive">
      {getApiErrorMessage(error, "Failed to load workload.")}
    </div>
  );

  // Deduplicate: same course + same start time = same exam slot
  const seen = new Set<string>();
  const uniqueAssignments = (data?.assignments ?? []).filter((a) => {
    const key = `${a.exam?.courseOffering?.course?.code ?? "?"}:${a.timeSlot?.startTime ?? "?"}:${a.timeSlot?.date ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center gap-3 rounded-none border border-zinc-200/60 bg-zinc-50 px-3 py-3 shrink-0">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">Proctor</p>
          <p className="mt-0.5 truncate text-sm font-bold text-zinc-950">{proctor?.name}</p>
          <p className="text-[11px] text-zinc-500">{proctor?.center}</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-none bg-indigo-50 px-3 py-2 shrink-0">
          <ClipboardList className="size-4 text-indigo-600" />
          <div className="text-right">
            <p className="text-xl font-black text-indigo-700 leading-none">{uniqueAssignments.length}</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-indigo-400">exams</p>
          </div>
        </div>
      </div>

      <div className="rounded-none border border-zinc-200/60 bg-white px-4 py-3 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">Availability</p>
            <p className="mt-1 text-sm font-semibold text-zinc-950">
              {availableTimeSlots.length} available slot{availableTimeSlots.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {availableTimeSlots.length === 0 ? (
            <p className="text-xs text-zinc-500">No time slots configured for this proctor.</p>
          ) : (
            availableTimeSlots.map((slot) => (
              <Badge key={slot.id} variant="secondary" className="rounded-none px-2 py-1 normal-case tracking-normal">
                {formatAvailabilityLabel(slot)}
              </Badge>
            ))
          )}
        </div>
      </div>

      {uniqueAssignments.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No assignments" description="This proctor has no exam assignments." />
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400 shrink-0 mb-2">
            Assignments ({uniqueAssignments.length})
          </p>
          <ScrollArea className="flex-1 rounded-none border border-zinc-200/40">
            <div className="space-y-2 px-4 py-3">
            {uniqueAssignments.map((a, i) => {
              const course = a.exam?.courseOffering?.course;
              const semester = a.exam?.courseOffering?.semester;
              const slot = a.timeSlot;
              const dateStr = fmtDate(slot?.date ?? slot?.startTime);
              const startStr = fmtTime(slot?.startTime);
              const endStr = fmtTime(slot?.endTime);
              return (
                <div
                  key={(a as { id?: string }).id ?? i}
                  className="rounded-none border border-zinc-200/60 bg-white px-4 py-3 space-y-1.5"
                >
                  <p className="text-sm font-semibold text-zinc-950 leading-snug">
                    {course?.code && (
                      <span className="inline-flex items-center rounded-none border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[11px] font-mono font-semibold text-zinc-700 mr-1.5">
                        {course.code}
                      </span>
                    )}
                    {course?.title ?? "Unknown Course"}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                    {semester?.name && (
                      <span className="text-zinc-400">{semester.name}</span>
                    )}
                    {dateStr && (
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3 shrink-0" />
                        {dateStr}
                      </span>
                    )}
                    {(startStr || endStr) && (
                      <span className="flex items-center gap-1">
                        <Clock className="size-3 shrink-0" />
                        {startStr}{startStr && endStr ? " – " : ""}{endStr}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </ScrollArea>
        </div>
      )}

      <div className="flex justify-end shrink-0">
        <Button variant="outline" onClick={onClose} className="rounded-none font-semibold">Close</Button>
      </div>
    </div>
  );
}

export function ProctorsPage() {
  const { data: proctors = [], isLoading, isFetching, isError, error, refetch } = useProctors();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProctor, setEditingProctor] = useState<Proctor | null>(null);
  const [workloadProctor, setWorkloadProctor] = useState<Proctor | null>(null);
  const [deletingProctor, setDeletingProctor] = useState<Proctor | null>(null);
  
  const createMutation = useCreateProctor();
  const updateMutation = useUpdateProctor();
  const deleteMutation = useDeleteProctor();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const openCreateModal = () => {
    setEditingProctor(null);
    setIsFormOpen(true);
  };

  const openEditModal = (proctor: Proctor) => {
    setEditingProctor(proctor);
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingProctor(null);
  };

  const handleSubmit = (data: Proctor) => {
    if (editingProctor?.id) {
      updateMutation.mutate(
        { id: editingProctor.id, data },
        {
          onSuccess: () => {
            closeFormModal();
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          closeFormModal();
        },
      });
    }
  };

  const confirmDelete = () => {
    if (deletingProctor?.id) {
      deleteMutation.mutate(deletingProctor.id, {
        onSuccess: () => {
          setDeletingProctor(null);
        },
      });
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  const filteredProctors = useMemo(() => {
    const term = deferredSearch.toLowerCase();
    if (!term) return proctors;
    return proctors.filter((s) =>
      [s.name, s.email, s.department, s.center]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [deferredSearch, proctors]);

  const isSearching = search.trim() !== deferredSearch;
  const isTableLoading = isSearching || isFetching || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const showPageLoading = useDelayedLoading(isLoading, 1000);
  const showTableLoading = useDelayedLoading(isTableLoading);
  const totalAvailabilityLinks = useMemo(
    () => proctors.reduce((sum, proctor) => sum + (proctor.availableTimeSlots?.length ?? 0), 0),
    [proctors]
  );

  if (showPageLoading) {
    return (
      <div className="p-6">
        <PageSpinner label="Loading proctors..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <Card className="p-6 space-y-3">
          <p className="text-sm text-red-600">{getApiErrorMessage(error, "Failed to load proctors.")}</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-8 space-y-1">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-none bg-zinc-950 text-white shadow-sm">
            <Users className="size-5" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">Proctors</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Manage examination staff and coordinate supervision duties</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <StickyActionBar className="flex flex-col gap-3 sm:flex-row">
        <Button 
          onClick={openCreateModal}
          className="inline-flex h-10 items-center gap-2 rounded-none border border-zinc-950 bg-zinc-950 font-semibold text-white shadow-sm transition-all hover:bg-zinc-900 active:scale-95"
        >
          <Plus className="size-4" />
          Add Proctor
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
            placeholder="Search by name, email or center"
            className="h-10 rounded-none border-zinc-200 bg-transparent pl-9 text-sm hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50 group-data-[stuck=true]:bg-white"
          />
        </div>
      </StickyActionBar>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Total Proctors</p>
                <p className="text-3xl font-bold text-zinc-950 mt-2">{proctors.length}</p>
                <p className="text-xs text-zinc-500 mt-2">Staff members active</p>
              </div>
              <div className="p-2 rounded-none bg-purple-50">
                <TrendingUp className="size-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Availability Links</p>
                <p className="text-3xl font-bold text-zinc-950 mt-2">{totalAvailabilityLinks}</p>
                <p className="text-xs text-zinc-500 mt-2">Configured proctor-slot pairs</p>
              </div>
              <div className="p-2 rounded-none bg-orange-50">
                <Users className="size-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-2">
          <CardContent className="p-6">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Coordination Status</p>
            <p className="text-sm text-zinc-600 mt-2">Manage examination proctors and their workloads with precision. Real-time coordination ensures seamless distribution of supervision duties across all scheduled exam sessions and testing facilities.</p>
            <div className="flex gap-2 mt-3">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs font-medium text-green-600">Fully Operational</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <ProctorList
        proctors={filteredProctors}
        isLoading={showTableLoading}
        isDeleting={deleteMutation.isPending}
        search={search}
        onAdd={openCreateModal}
        onEditProctor={openEditModal}
        onDeleteProctor={setDeletingProctor}
        onViewWorkload={setWorkloadProctor}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProctor ? "Edit Proctor" : "Add New Proctor"}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <ProctorForm 
              initialData={editingProctor ?? undefined} 
              onSubmit={handleSubmit} 
              isLoading={isSaving}
              submitErrorMessage={
                createMutation.isError ? getApiErrorMessage(createMutation.error, "Failed to create proctor.") :
                updateMutation.isError ? getApiErrorMessage(updateMutation.error, "Failed to update proctor.") :
                null
              }
              submitValidationMessages={
                createMutation.isError ? getApiValidationErrors(createMutation.error) :
                updateMutation.isError ? getApiValidationErrors(updateMutation.error) :
                {}
              }
            />
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmModal
        open={!!deletingProctor}
        onCancel={() => setDeletingProctor(null)}
        onConfirm={confirmDelete}
        title="Delete Proctor"
        description={`Are you sure you want to completely remove ${deletingProctor?.name}? This action cannot be undone and may unassign them from their workloads.`}
        isLoading={deleteMutation.isPending}
        errorMessage={deleteMutation.isError ? getApiErrorMessage(deleteMutation.error, "Failed to delete proctor.") : undefined}
      />

      <Dialog open={!!workloadProctor} onOpenChange={(open) => !open && setWorkloadProctor(null)}>
        <DialogContent className="sm:max-w-xl max-h-96 overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Proctor Workload</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto pr-2">
            <WorkloadContent proctor={workloadProctor} onClose={() => setWorkloadProctor(null)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
