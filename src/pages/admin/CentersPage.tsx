import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { usePersistentFilters } from "../../hooks/common/usePersistentFilters";
import { useHighlightRow } from "../../hooks/common/useHighlightRow";
import { CenterList } from "../../features/centers/CenterList";
import { CenterForm } from "../../forms/centers/CenterForm";
import { CenterDetailDialog } from "../../features/centers/CenterDetailDialog";
import {
  useCentersPage,
  useCreateCenter,
  useDeleteCenter,
  useUpdateCenter,
} from "../../hooks/centers/useCenters";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent } from "../../components/ui/card";
import { Center, CenterFormValues } from "../../schemas/center";
import { getApiErrorMessage, getApiValidationErrors } from "../../lib/apiError";
import { PageSpinner } from "../../components/shared/PageSpinner";
import { DeleteConfirmModal } from "../../components/shared/DeleteConfirmModal";
import { BulkDeleteToolbar } from "../../components/shared/BulkTableActions";
import { StickyActionBar } from "../../components/common/StickyActionBar";
import { useDelayedLoading } from "../../hooks/common/useDelayedLoading";
import { useBulkDelete } from "../../hooks/common/useBulkDelete";
import { Building, CheckCircle2, DoorOpen, Plus, RefreshCw, Search, Users } from "lucide-react";

export function CentersPage() {
  const getCenterSubmitValidationMessages = (error: unknown) => {
    const baseErrors = getApiValidationErrors(error);
    const message = getApiErrorMessage(error, "").toLowerCase();
    if (!baseErrors.name && message.includes("center name already exists")) {
      return { ...baseErrors, name: ["Center name already exists."] };
    }
    return baseErrors;
  };

  const PAGE_SIZE = 50;
  const [searchParams, setSearchParams] = useSearchParams();
  const { filters, setFilter } = usePersistentFilters('centers', { search: '' });
  const search = filters.search;
  const [silentSearch, setSilentSearch] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const hlId = params.get('centerId') ?? params.get('id');
    const hl = params.get('_hl');
    return (hlId && hl) ? hl : '';
  });
  const setSearch = (value: string) => {
    if (value && silentSearch) setSilentSearch('');
    setFilter('search', value);
  };
  const deferredSearch = useDeferredValue(search.trim());
  const pageParam = Number(searchParams.get("page") ?? "1");
  const currentPage = Number.isFinite(pageParam) && pageParam >= 1 ? Math.floor(pageParam) : 1;
  const setPage = (next: number) => {
    const nextParams = new URLSearchParams(searchParams);
    if (next <= 1) nextParams.delete("page");
    else nextParams.set("page", String(next));
    setSearchParams(nextParams, { replace: true });
  };
  const centersQuery = useCentersPage({
    page: currentPage,
    pageSize: PAGE_SIZE,
    search: deferredSearch || silentSearch,
  });
  const centers = useMemo(() => centersQuery.data?.data ?? [], [centersQuery.data]);
  const centersMeta = centersQuery.data?.meta;
  const totalCenters = centersMeta?.total ?? centers.length;
  const totalPages = centersMeta?.totalPages ?? 1;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<Center | null>(null);
  const [deletingCenter, setDeletingCenter] = useState<Center | null>(null);
  const [viewingCenter, setViewingCenter] = useState<Center | null>(null);

  const createMutation = useCreateCenter();
  const updateMutation = useUpdateCenter();
  const deleteMutation = useDeleteCenter();
  const bulkDelete = useBulkDelete({ entityName: "center", entityNamePlural: "centers", deleteItem: (id) => deleteMutation.mutateAsync(id) });
  const submitError = createMutation.isError
    ? createMutation.error
    : updateMutation.isError
      ? updateMutation.error
      : undefined;
  const submitValidationMessages = useMemo(
    () => (submitError ? getCenterSubmitValidationMessages(submitError) : undefined),
    [submitError]
  );
  const submitErrorMessage = useMemo(() => {
    if (!submitError) return undefined;
    if (submitValidationMessages?.name?.length) {
      return submitValidationMessages.name[0];
    }
    return getApiErrorMessage(submitError, "An error occurred while saving.");
  }, [submitError, submitValidationMessages]);
  const clearSubmitErrors = () => {
    createMutation.reset();
    updateMutation.reset();
  };

  useEffect(() => {
    if (currentPage !== 1) setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredSearch]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const highlightedCenterId = searchParams.get("centerId") ?? searchParams.get("id");
  const _hlCenterParam = searchParams.get('_hl');
  useEffect(() => {
    if (highlightedCenterId && _hlCenterParam) setSilentSearch(_hlCenterParam);
    else if (!highlightedCenterId) setSilentSearch('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedCenterId, _hlCenterParam]);

  useHighlightRow("data-center-id", highlightedCenterId, centers.length);

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

  const handleSubmit = async (data: CenterFormValues) => {
    const supervisors = (data.supervisorsText ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    const payload = {
      name: data.name.trim(),
      ...(data.location && data.location.trim() ? { location: data.location.trim() } : {}),
      supervisors,
    };

    try {
      if (editingCenter?.id) {
        await updateMutation.mutateAsync({
          id: editingCenter.id,
          data: payload,
        });
        closeFormModal();
        return;
      }

      await createMutation.mutateAsync(payload);
      closeFormModal();
    } catch {
      // Mutation hooks already expose the save error state and toasts.
    }
  };

  const handleDelete = (center: Center) => {
    deleteMutation.reset();
    setDeletingCenter(center);
  };

  const closeDeleteModal = () => {
    setDeletingCenter(null);
    deleteMutation.reset();
  };

  const handleRefresh = () => {
    centersQuery.refetch();
  };

  const confirmDelete = () => {
    if (!deletingCenter?.id) return;
    deleteMutation.mutate(deletingCenter.id, { onSuccess: closeDeleteModal });
  };

  const filteredCenters = centers;

  const isSearching = search.trim() !== deferredSearch;
  const isTableLoading = isSearching || centersQuery.isFetching || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || bulkDelete.isDeleting;
  const showTableLoading = useDelayedLoading(isTableLoading);

  const stats = useMemo(() => {
    let totalRooms = 0;
    let totalSupervisors = 0;
    let active = 0;
    for (const c of centers) {
      totalRooms += c?.rooms?.length ?? c?.roomsCount ?? 0;
      totalSupervisors += c?.supervisors?.length ?? c?.supervisorsCount ?? 0;
      if (c?.isActive !== false) active += 1;
    }
    return { total: totalCenters, totalRooms, totalSupervisors, active };
  }, [centers, totalCenters]);

  const pageErrorMessage = getApiErrorMessage(centersQuery.error, "Failed to load centers.");
  const showPageLoading = useDelayedLoading(centersQuery.isLoading, 1000);

  if (showPageLoading) {
    return (
      <div className="p-6">
        <PageSpinner label="Loading centers" />
      </div>
    );
  }

  if (centersQuery.isError) {
    return (
      <div className="p-6">
        <Card className="p-6 space-y-3 rounded-none border-destructive/30 bg-destructive/5">
          <p className="text-sm text-red-600">{pageErrorMessage}</p>
          <Button onClick={() => centersQuery.refetch()}>Retry</Button>
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
            <Building className="size-5" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">Centers</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Manage exam centers, their rooms, and administrative supervisors
            </p>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <StickyActionBar className="flex flex-col gap-3 sm:flex-row">
        <Button
          onClick={openCreateModal}
          disabled={centersQuery.isFetching || isSaving}
          className="inline-flex h-10 items-center gap-2 rounded-none border border-zinc-950 bg-zinc-950 font-semibold text-white shadow-sm transition-all hover:bg-zinc-900 active:scale-95"
        >
          <Plus className="size-4" />
          Add Center
        </Button>
        <Button
          variant="outline"
          onClick={handleRefresh}
          className="h-10 rounded-none border-zinc-200 text-zinc-950 font-semibold hover:bg-zinc-50 active:scale-95 transition-all inline-flex items-center gap-2"
        >
          <RefreshCw className={`size-4 transition-transform ${centersQuery.isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <div className="relative sm:ml-auto sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or location"
            className="h-10 rounded-none border-zinc-200 bg-transparent pl-9 text-sm hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50 group-data-[stuck=true]:bg-white dark:border-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:bg-zinc-900/70 dark:focus-visible:border-zinc-700 dark:focus-visible:ring-zinc-700/70 dark:group-data-[stuck=true]:bg-zinc-950/70"
          />
        </div>
      </StickyActionBar>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Total Centers</p>
                <p className="text-3xl font-bold text-zinc-950 mt-2">{stats.total}</p>
                <p className="text-xs text-zinc-500 mt-2">All centers</p>
              </div>
              <div className="p-2 rounded-none bg-blue-50">
                <Building className="size-5 text-blue-600" />
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
                <p className="text-xs text-zinc-500 mt-2">Administrative center managers</p>
              </div>
              <div className="p-2 rounded-none bg-emerald-50">
                <Users className="size-5 text-emerald-600" />
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
        <BulkDeleteToolbar selectedCount={bulkDelete.selectedCount} totalCount={filteredCenters.length} isDeleting={bulkDelete.isDeleting || deleteMutation.isPending} onClear={bulkDelete.clearSelection} onDelete={() => bulkDelete.setIsConfirmOpen(true)} />
        <CenterList
          centers={filteredCenters}
          isLoading={showTableLoading}
          search={search}
          isDeleting={deleteMutation.isPending || bulkDelete.isDeleting}
          selectedIds={bulkDelete.selectedIds}
          onToggleSelected={bulkDelete.toggleSelected}
          onToggleAll={(checked) => bulkDelete.toggleAll(filteredCenters, checked)}
          onEditCenter={openEditModal}
          onDeleteCenter={handleDelete}
          onViewCenter={setViewingCenter}
          onAddCenter={openCreateModal}
          highlightedCenterId={highlightedCenterId}
          pagination={{
            page: currentPage,
            pageCount: totalPages,
            pageSize: PAGE_SIZE,
            totalCount: totalCenters,
            onPageChange: setPage,
          }}
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

      <DeleteConfirmModal
        open={bulkDelete.isConfirmOpen}
        title="Delete Selected Centers"
        description={`This will permanently delete ${bulkDelete.selectedCount} selected center${bulkDelete.selectedCount === 1 ? "" : "s"} and may affect linked rooms and supervisors.`}
        confirmLabel="Bulk Delete"
        isLoading={bulkDelete.isDeleting}
        onCancel={() => bulkDelete.setIsConfirmOpen(false)}
        onConfirm={bulkDelete.confirmDelete}
      />

      <Dialog open={isFormOpen} onOpenChange={(open) => (open ? setIsFormOpen(true) : closeFormModal())}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCenter ? "Edit Center" : "Add New Center"}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <CenterForm
              initialData={editingCenter ?? undefined}
              center={editingCenter}
              onSubmit={handleSubmit}
              isLoading={isSaving}
              submitErrorMessage={submitErrorMessage}
              submitValidationMessages={submitValidationMessages}
              onClearSubmitError={clearSubmitErrors}
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
