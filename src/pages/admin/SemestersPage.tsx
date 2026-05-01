import { useDeferredValue, useMemo, useState } from "react";
import { SemesterList } from "../../features/semesters/SemesterList";
import { computeStatus } from "../../schemas/semester";
import { SemesterForm } from "../../forms/semesters/SemesterForm";
import {
  useCreateSemester,
  useDeleteSemester,
  useSemesters,
  useUpdateSemester,
} from "../../hooks/semesters/useSemesters";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent } from "../../components/ui/card";
import { Semester, SemesterFormValues } from "../../schemas/semester";
import { getApiErrorMessage, getApiValidationErrors } from "../../lib/apiError";
import { PageSpinner } from "../../components/shared/PageSpinner";
import { DeleteConfirmModal } from "../../components/shared/DeleteConfirmModal";
import { StickyActionBar } from "../../components/common/StickyActionBar";
import { useDelayedLoading } from "../../hooks/common/useDelayedLoading";
import { Calendar, Plus, RefreshCw, Search, Sparkles, TrendingUp } from "lucide-react";

export function SemestersPage() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const { data: semesters = [], isLoading, isFetching, isError, error, refetch } = useSemesters();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [deletingSemester, setDeletingSemester] = useState<Semester | null>(null);

  const createMutation = useCreateSemester();
  const updateMutation = useUpdateSemester();
  const deleteMutation = useDeleteSemester();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const openCreateModal = () => {
    setEditingSemester(null);
    createMutation.reset();
    updateMutation.reset();
    setIsFormOpen(true);
  };

  const openEditModal = (semester: Semester) => {
    setEditingSemester(semester);
    createMutation.reset();
    updateMutation.reset();
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingSemester(null);
    createMutation.reset();
    updateMutation.reset();
  };

  const handleSubmit = (data: SemesterFormValues) => {
    if (editingSemester?.id) {
      updateMutation.mutate(
        { id: editingSemester.id, data },
        { onSuccess: closeFormModal }
      );
      return;
    }

    createMutation.mutate(data, { onSuccess: closeFormModal });
  };

  const handleDelete = (semester: Semester) => {
    deleteMutation.reset();
    setDeletingSemester(semester);
  };

  const closeDeleteModal = () => {
    setDeletingSemester(null);
    deleteMutation.reset();
  };

  const handleRefresh = () => {
    refetch();
  };

  const confirmDelete = () => {
    if (!deletingSemester?.id) return;
    deleteMutation.mutate(deletingSemester.id, { onSuccess: closeDeleteModal });
  };

  const filteredSemesters = useMemo(() => {
    const term = deferredSearch.toLowerCase();
    if (!term) return semesters;
    return semesters.filter((s) =>
      [s?.name, s?.academicYear].filter(Boolean).some((v) => String(v).toLowerCase().includes(term))
    );
  }, [deferredSearch, semesters]);

  const isSearching = search.trim() !== deferredSearch;
  const isTableLoading = isSearching || isFetching || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const showTableLoading = useDelayedLoading(isTableLoading);

  const stats = useMemo(() => {
    const counts = { active: 0, upcoming: 0, past: 0, totalOfferings: 0 };
    for (const semester of semesters) {
      const status = computeStatus(semester);
      if (status === "ACTIVE") counts.active += 1;
      else if (status === "UPCOMING") counts.upcoming += 1;
      else counts.past += 1;
      counts.totalOfferings += semester?.courseOfferings?.length ?? semester?.courseOfferingsCount ?? 0;
    }
    return counts;
  }, [semesters]);

  const pageErrorMessage = getApiErrorMessage(error, "Failed to load semesters.");
  const showPageLoading = useDelayedLoading(isLoading, 1000);

  if (showPageLoading) {
    return (
      <div className="p-6">
        <PageSpinner label="Loading semesters" />
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
      {/* Header Section */}
      <div className="mb-8 space-y-1">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-none bg-zinc-950 text-white shadow-sm">
            <Calendar className="size-5" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">Semesters</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Manage academic terms and align course offerings to the institutional calendar
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <StickyActionBar className="flex flex-col gap-3 sm:flex-row">
        <Button
          onClick={openCreateModal}
          disabled={isFetching || isSaving}
          className="inline-flex h-10 items-center gap-2 rounded-none border border-zinc-950 bg-zinc-950 font-semibold text-white shadow-sm transition-all hover:bg-zinc-900 active:scale-95"
        >
          <Plus className="size-4" />
          Add Semester
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
            placeholder="Search by name or year"
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
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Total Semesters</p>
                <p className="text-3xl font-bold text-zinc-950 mt-2">{semesters.length}</p>
                <p className="text-xs text-zinc-500 mt-2">All defined terms</p>
              </div>
              <div className="p-2 rounded-none bg-blue-50">
                <Calendar className="size-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Active Now</p>
                <p className="text-3xl font-bold text-zinc-950 mt-2">{stats.active}</p>
                <p className="text-xs text-zinc-500 mt-2">In-session terms</p>
              </div>
              <div className="p-2 rounded-none bg-emerald-50">
                <Sparkles className="size-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Upcoming</p>
                <p className="text-3xl font-bold text-zinc-950 mt-2">{stats.upcoming}</p>
                <p className="text-xs text-zinc-500 mt-2">Future planning</p>
              </div>
              <div className="p-2 rounded-none bg-blue-50">
                <Plus className="size-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Total Offerings</p>
                <p className="text-3xl font-bold text-zinc-950 mt-2">{stats.totalOfferings}</p>
                <p className="text-xs text-zinc-500 mt-2">Linked across semesters</p>
              </div>
              <div className="p-2 rounded-none bg-violet-50">
                <TrendingUp className="size-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Semesters List */}
      <div className="mb-8">
        <SemesterList
          semesters={filteredSemesters}
          isLoading={showTableLoading}
          isDeleting={deleteMutation.isPending}
          search={search}
          onEditSemester={openEditModal}
          onDeleteSemester={handleDelete}
          onAddSemester={openCreateModal}
        />
      </div>

      <DeleteConfirmModal
        open={Boolean(deletingSemester)}
        title="Delete Semester"
        description={
          deletingSemester
            ? `This will permanently delete "${deletingSemester.name}" and may affect linked course offerings.`
            : "This action cannot be undone."
        }
        confirmLabel="Delete Semester"
        isLoading={deleteMutation.isPending}
        errorMessage={
          deleteMutation.isError
            ? getApiErrorMessage(deleteMutation.error, "Failed to delete semester.")
            : undefined
        }
        onCancel={closeDeleteModal}
        onConfirm={confirmDelete}
      />

      <Dialog open={isFormOpen} onOpenChange={(open) => (open ? setIsFormOpen(true) : closeFormModal())}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSemester ? "Edit Semester" : "Add New Semester"}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <SemesterForm
              initialData={editingSemester ?? undefined}
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
