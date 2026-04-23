import { useMemo, useState } from "react";
import { CenterList } from "../../features/centers/CenterList";
import { CenterForm } from "../../forms/centers/CenterForm";
import { CenterDetailDialog } from "../../features/centers/CenterDetailDialog";
import {
  useCenters,
  useCreateCenter,
  useDeleteCenter,
  useUpdateCenter,
} from "../../hooks/centers/useCenters";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent } from "../../components/ui/card";
import { Center, CenterFormValues } from "../../schemas/center";
import { getApiErrorMessage, getApiValidationErrors } from "../../lib/apiError";
import { PageSpinner } from "../../components/shared/PageSpinner";
import { DeleteConfirmModal } from "../../components/shared/DeleteConfirmModal";
import { Building2, CheckCircle2, DoorOpen, Plus, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { useToast } from "../../components/ui/toast";

export function CentersPage() {
  const [search, setSearch] = useState("");
  const { data: centers = [], isLoading, isFetching, isError, error, refetch } = useCenters();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<Center | null>(null);
  const [deletingCenter, setDeletingCenter] = useState<Center | null>(null);
  const [viewingCenter, setViewingCenter] = useState<Center | null>(null);

  const createMutation = useCreateCenter();
  const updateMutation = useUpdateCenter();
  const deleteMutation = useDeleteCenter();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const openCreateModal = () => {
    setEditingCenter(null);
    createMutation.reset();
    updateMutation.reset();
    setIsFormOpen(true);
  };

  const openEditModal = (center: Center) => {
    setEditingCenter(center);
    createMutation.reset();
    updateMutation.reset();
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingCenter(null);
    createMutation.reset();
    updateMutation.reset();
  };

  const handleSubmit = (data: CenterFormValues) => {
    const payload = {
      name: data.name.trim(),
      ...(data.location && data.location.trim() ? { location: data.location.trim() } : {}),
    };

    if (editingCenter?.id) {
      updateMutation.mutate(
        { id: editingCenter.id, data: payload },
        { onSuccess: () => closeFormModal() }
      );
      return;
    }
    createMutation.mutate(payload, { onSuccess: () => closeFormModal() });
  };

  const handleDelete = (center: Center) => {
    deleteMutation.reset();
    setDeletingCenter(center);
  };

  const closeDeleteModal = () => {
    setDeletingCenter(null);
    deleteMutation.reset();
  };

  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["centers"] });
    addToast({ type: "success", title: "Refreshed", description: "Center data has been refreshed." });
  };

  const confirmDelete = () => {
    if (!deletingCenter?.id) return;
    deleteMutation.mutate(deletingCenter.id, { onSuccess: () => closeDeleteModal() });
  };

  const filteredCenters = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return centers;
    return centers.filter((c) =>
      [c?.name, c?.location, c?.code].filter(Boolean).some((v) => String(v).toLowerCase().includes(term))
    );
  }, [search, centers]);

  const stats = useMemo(() => {
    let totalRooms = 0;
    let totalSupervisors = 0;
    let active = 0;
    for (const c of centers) {
      totalRooms += c?.roomsCount ?? 0;
      totalSupervisors += c?.supervisorsCount ?? 0;
      if (c?.isActive !== false) active += 1;
    }
    return { total: centers.length, totalRooms, totalSupervisors, active };
  }, [centers]);

  const pageErrorMessage = getApiErrorMessage(error, "Failed to load centers.");

  if (isLoading) {
    return (
      <div className="p-6">
        <PageSpinner label="Loading centers" />
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
            <Building2 className="size-5" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">Centers</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Manage exam centers, their rooms, and supervisor assignments across the institution
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
          Add Center
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
            placeholder="Search by name or location"
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
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Total Centers</p>
                <p className="text-3xl font-bold text-zinc-950 mt-2">{stats.total}</p>
                <p className="text-xs text-zinc-500 mt-2">All centers</p>
              </div>
              <div className="p-2 rounded-none bg-blue-50">
                <Building2 className="size-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Total Rooms</p>
                <p className="text-3xl font-bold text-zinc-950 mt-2">{stats.totalRooms}</p>
                <p className="text-xs text-zinc-500 mt-2">Across all centers</p>
              </div>
              <div className="p-2 rounded-none bg-emerald-50">
                <DoorOpen className="size-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Supervisors</p>
                <p className="text-3xl font-bold text-zinc-950 mt-2">{stats.totalSupervisors}</p>
                <p className="text-xs text-zinc-500 mt-2">Assigned to centers</p>
              </div>
              <div className="p-2 rounded-none bg-violet-50">
                <ShieldCheck className="size-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Active</p>
                <p className="text-3xl font-bold text-zinc-950 mt-2">{stats.active}</p>
                <p className="text-xs text-zinc-500 mt-2">Currently operational</p>
              </div>
              <div className="p-2 rounded-none bg-amber-50">
                <CheckCircle2 className="size-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <div className="mb-8">
        <CenterList
          centers={filteredCenters}
          isLoading={isSaving || deleteMutation.isPending}
          isDeleting={deleteMutation.isPending}
          onEditCenter={openEditModal}
          onDeleteCenter={handleDelete}
          onViewCenter={setViewingCenter}
          onAddCenter={openCreateModal}
        />
      </div>

      <DeleteConfirmModal
        open={Boolean(deletingCenter)}
        title="Delete Center"
        description={
          deletingCenter
            ? `This will permanently delete "${deletingCenter.name}" and may affect linked rooms and supervisors.`
            : "This action cannot be undone."
        }
        confirmLabel="Delete Center"
        isLoading={deleteMutation.isPending}
        errorMessage={
          deleteMutation.isError
            ? getApiErrorMessage(deleteMutation.error, "Failed to delete center.")
            : undefined
        }
        onCancel={closeDeleteModal}
        onConfirm={confirmDelete}
      />

      <Dialog open={isFormOpen} onOpenChange={(open) => (open ? setIsFormOpen(true) : closeFormModal())}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCenter ? "Edit Center" : "Add New Center"}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <CenterForm
              initialData={editingCenter ?? undefined}
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

      <CenterDetailDialog
        center={viewingCenter}
        open={Boolean(viewingCenter)}
        onClose={() => setViewingCenter(null)}
      />
    </div>
  );
}
