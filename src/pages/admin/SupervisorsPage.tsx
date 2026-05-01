import { useDeferredValue, useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent } from "../../components/ui/card";
import { PageSpinner } from "../../components/shared/PageSpinner";
import { DeleteConfirmModal } from "../../components/shared/DeleteConfirmModal";
import { StickyActionBar } from "../../components/common/StickyActionBar";
import { getApiErrorMessage, getApiValidationErrors } from "../../lib/apiError";
import { ClipboardList, Users, Plus, RefreshCw, TrendingUp, Search } from "lucide-react";
import { EmptyState } from "../../components/shared/EmptyState";
import { useDelayedLoading } from "../../hooks/common/useDelayedLoading";

import { SupervisorList } from "../../features/supervisors/SupervisorList";
import { SupervisorForm } from "../../forms/supervisors/SupervisorForm";
import { Supervisor } from "../../schemas/supervisor";
import { useSupervisors, useCreateSupervisor, useUpdateSupervisor, useDeleteSupervisor, useSupervisorWorkload } from "../../hooks/supervisors/useSupervisors";

function WorkloadContent({ supervisor, onClose }: { supervisor: Supervisor | null; onClose: () => void }) {
  const { data, isLoading, isError, error } = useSupervisorWorkload(supervisor?.id ?? null);

  if (isLoading) return <PageSpinner label="Loading workload" className="min-h-32" />;
  if (isError) return (
    <div className="rounded-none border border-destructive/30 bg-destructive/5 px-3 py-3 text-sm text-destructive">
      {getApiErrorMessage(error, "Failed to load workload.")}
    </div>
  );

  return (
    <div className="mt-2 space-y-5">
      <div className="flex items-center gap-4 rounded-none border border-zinc-200/60 bg-zinc-50 px-4 py-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Supervisor</p>
          <p className="mt-0.5 truncate text-base font-bold text-zinc-950">{supervisor?.name}</p>
          <p className="text-xs text-zinc-500">{supervisor?.center}</p>
        </div>
        <div className="flex items-center gap-2 rounded-none bg-indigo-50 px-4 py-3">
          <ClipboardList className="size-5 text-indigo-600" />
          <div className="text-right">
            <p className="text-2xl font-black text-indigo-700">{data?.workloadCount ?? 0}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-400">exams</p>
          </div>
        </div>
      </div>

      {!data || data.assignments.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No assignments" description="This supervisor has no exam assignments." />
      ) : (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">Assignments</p>
          {data.assignments.map((a, i) => {
            const course = a.exam?.courseOffering?.course;
            const semester = a.exam?.courseOffering?.semester;
            const slot = a.timeSlot;
            return (
              <div key={a.id ?? i} className="rounded-none border border-zinc-200/60 bg-white px-4 py-3">
                <p className="text-sm font-semibold text-zinc-950">
                  {course?.code ? `[${course.code}] ` : ""}{course?.title ?? "Unknown Course"}
                </p>
                <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-500">
                  {semester?.name && <span>{semester.name}</span>}
                  {slot?.date && <span>{slot.date}</span>}
                  {(slot?.startTime || slot?.endTime) && (
                    <span>{slot.startTime ?? ""}{slot.startTime && slot.endTime ? " – " : ""}{slot.endTime ?? ""}</span>
                  )}
                  {slot?.label && !slot?.date && <span>{slot.label}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose} className="rounded-none font-semibold">Close</Button>
      </div>
    </div>
  );
}

export function SupervisorsPage() {
  const { data: supervisors = [], isLoading, isFetching, isError, error, refetch } = useSupervisors();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState<Supervisor | null>(null);
  const [workloadSupervisor, setWorkloadSupervisor] = useState<Supervisor | null>(null);
  const [deletingSupervisor, setDeletingSupervisor] = useState<Supervisor | null>(null);
  
  const createMutation = useCreateSupervisor();
  const updateMutation = useUpdateSupervisor();
  const deleteMutation = useDeleteSupervisor();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const openCreateModal = () => {
    setEditingSupervisor(null);
    setIsFormOpen(true);
  };

  const openEditModal = (supervisor: Supervisor) => {
    setEditingSupervisor(supervisor);
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingSupervisor(null);
  };

  const handleSubmit = (data: Supervisor) => {
    if (editingSupervisor?.id) {
      updateMutation.mutate(
        { id: editingSupervisor.id, data },
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
    if (deletingSupervisor?.id) {
      deleteMutation.mutate(deletingSupervisor.id, {
        onSuccess: () => {
          setDeletingSupervisor(null);
        },
      });
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  const filteredSupervisors = useMemo(() => {
    const term = deferredSearch.toLowerCase();
    if (!term) return supervisors;
    return supervisors.filter((s) =>
      [s.name, s.email, s.department, s.center]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [deferredSearch, supervisors]);

  const isSearching = search.trim() !== deferredSearch;
  const isTableLoading = isSearching || isFetching || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const showPageLoading = useDelayedLoading(isLoading, 1000);
  const showTableLoading = useDelayedLoading(isTableLoading);

  if (showPageLoading) {
    return (
      <div className="p-6">
        <PageSpinner label="Loading supervisors..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <Card className="p-6 space-y-3">
          <p className="text-sm text-red-600">{getApiErrorMessage(error, "Failed to load supervisors.")}</p>
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
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">Supervisors</h1>
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
          Add Supervisor
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
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Total Supervisors</p>
                <p className="text-3xl font-bold text-zinc-950 mt-2">{supervisors.length}</p>
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
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Workload Status</p>
                <p className="text-3xl font-bold text-zinc-950 mt-2">Managed</p>
                <p className="text-xs text-zinc-500 mt-2">Distribution enabled</p>
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
            <p className="text-sm text-zinc-600 mt-2">Manage examination supervisors and their workloads with precision. Real-time coordination ensures seamless distribution of supervision duties across all scheduled exam sessions and testing facilities.</p>
            <div className="flex gap-2 mt-3">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs font-medium text-green-600">Fully Operational</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <SupervisorList
        supervisors={filteredSupervisors}
        isLoading={showTableLoading}
        isDeleting={deleteMutation.isPending}
        search={search}
        onAdd={openCreateModal}
        onEditSupervisor={openEditModal}
        onDeleteSupervisor={setDeletingSupervisor}
        onViewWorkload={setWorkloadSupervisor}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSupervisor ? "Edit Supervisor" : "Add New Supervisor"}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <SupervisorForm 
              initialData={editingSupervisor ?? undefined} 
              onSubmit={handleSubmit} 
              isLoading={isSaving}
              submitErrorMessage={
                createMutation.isError ? getApiErrorMessage(createMutation.error, "Failed to create supervisor.") :
                updateMutation.isError ? getApiErrorMessage(updateMutation.error, "Failed to update supervisor.") :
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
        open={!!deletingSupervisor}
        onCancel={() => setDeletingSupervisor(null)}
        onConfirm={confirmDelete}
        title="Delete Supervisor"
        description={`Are you sure you want to completely remove ${deletingSupervisor?.name}? This action cannot be undone and may unassign them from their workloads.`}
        isLoading={deleteMutation.isPending}
        errorMessage={deleteMutation.isError ? getApiErrorMessage(deleteMutation.error, "Failed to delete supervisor.") : undefined}
      />

      <Dialog open={!!workloadSupervisor} onOpenChange={(open) => !open && setWorkloadSupervisor(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Supervisor Workload</DialogTitle>
          </DialogHeader>
          <WorkloadContent supervisor={workloadSupervisor} onClose={() => setWorkloadSupervisor(null)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
