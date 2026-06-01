import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePersistentFilters } from "../../hooks/common/usePersistentFilters";
import { useHighlightRow } from "../../hooks/common/useHighlightRow";
import {
  Layers,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { PageSpinner } from "../../components/shared/PageSpinner";
import { StickyActionBar } from "../../components/common/StickyActionBar";
import { CourseOfferingList } from "../../features/courseOfferings/CourseOfferingList";
import { CourseOfferingForm } from "../../forms/courseOfferings/CourseOfferingForm";
import { DeleteConfirmModal } from "../../components/shared/DeleteConfirmModal";
import { BulkDeleteToolbar } from "../../components/shared/BulkTableActions";
import { ActiveFilterBadges } from "../../components/shared/ActiveFilterBadges";
import { SearchSelectFilter, type SearchSelectFilterOption } from "../../components/shared/SearchSelectFilter";
import { getApiErrorMessage, getApiValidationErrors } from "../../lib/apiError";
import {
  useCourseOfferingsPage,
  useCreateCourseOffering,
  useDeleteCourseOffering,
  useUpdateCourseOffering,
} from "../../hooks/courseOfferings/useCourseOfferings";
import { useDepartments } from "../../hooks/departments/useDepartments";
import { useSemesters } from "../../hooks/semesters/useSemesters";
import { useDelayedLoading } from "../../hooks/common/useDelayedLoading";
import { useBulkDelete } from "../../hooks/common/useBulkDelete";
import type {
  CourseOffering,
  CreateCourseOfferingDto,
} from "../../schemas/courseOffering";
import { normalizeCommandSearchText } from "../../lib/searchText";

const ALL_SEMESTERS = "__all_semesters__";
const normalizeFilterSearch = (value: string) => value.trim().toLowerCase();
const formatDepartmentLabel = (department: { name?: string; code?: string | null }) =>
  [department.name, department.code ? `(${department.code})` : null].filter(Boolean).join(" ");

export function CourseOfferingsPage() {
  const PAGE_SIZE = 50;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { filters, setFilter, setFilters } = usePersistentFilters('course-offerings', {
    search: '',
    semesterId: '',
    departmentId: '',
  });
  const searchTerm = filters.search;
  const [silentSearch, setSilentSearch] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return normalizeCommandSearchText(params.get('_hl'));
  });
  const setSearchTerm = (value: string) => {
    if (value && silentSearch) setSilentSearch('');
    setFilter('search', value);
  };
  const deferredSearchTerm = useDeferredValue(searchTerm.trim());
  const semesterParam = filters.semesterId;
  const departmentParam = filters.departmentId;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const semestersQuery = useSemesters();
  const departmentsQuery = useDepartments();

  const semesters = useMemo(() => semestersQuery.data ?? [], [semestersQuery.data]);
  const departments = useMemo(() => departmentsQuery.data ?? [], [departmentsQuery.data]);
  const selectedSemester = useMemo(
    () => semesters.find((semester) => semester.id === semesterParam) ?? null,
    [semesters, semesterParam]
  );
  const selectedDepartment = useMemo(
    () => departments.find((department) => department.id === departmentParam) ?? null,
    [departments, departmentParam]
  );
  const selectedSemesterId = selectedSemester?.id ?? "";
  const selectedDepartmentId = selectedDepartment?.id ?? "";
  const commandSearchText = normalizeCommandSearchText(searchParams.get('_hl'));

  // URL-synced server page (1-based)
  const pageParam = Number(searchParams.get("page") ?? "1");
  const currentPage = Number.isFinite(pageParam) && pageParam >= 1 ? Math.floor(pageParam) : 1;
  const setPage = (next: number) => {
    const nextParams = new URLSearchParams(searchParams);
    if (next <= 1) nextParams.delete("page");
    else nextParams.set("page", String(next));
    setSearchParams(nextParams, { replace: true });
  };

  const setFilterParam = (key: "semesterId" | "departmentId", value: string) => setFilter(key, value);

  const clearAdvancedFilters = () => {
    setSilentSearch('');
    setFilters({ search: '', semesterId: '', departmentId: '' });
  };

  // Reset to page 1 whenever a filter changes
  useEffect(() => {
    if (currentPage !== 1) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("page");
      setSearchParams(nextParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredSearchTerm, selectedSemesterId, selectedDepartmentId]);

  const offeringsQuery = useCourseOfferingsPage({
    page: currentPage,
    pageSize: PAGE_SIZE,
    search: commandSearchText || deferredSearchTerm || silentSearch,
    semesterId: selectedSemesterId || undefined,
    departmentId: selectedDepartmentId || undefined,
  });
  const offerings = useMemo(() => offeringsQuery.data?.data ?? [], [offeringsQuery.data]);
  const offeringsMeta = offeringsQuery.data?.meta;
  const totalOfferings = offeringsMeta?.total ?? offerings.length;
  const totalPages = offeringsMeta?.totalPages ?? 1;

  const highlightedOfferingId = searchParams.get("offeringId") ?? searchParams.get("id");
  useEffect(() => {
    if (highlightedOfferingId && commandSearchText) setSilentSearch(commandSearchText);
    else if (!highlightedOfferingId) setSilentSearch('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedOfferingId, commandSearchText]);
  useHighlightRow("data-course-offering-id", highlightedOfferingId, offerings.length);

  const [editingOffering, setEditingOffering] = useState<CourseOffering | null>(null);
  const [deletingOffering, setDeletingOffering] = useState<CourseOffering | null>(null);

  useEffect(() => {
    if (semestersQuery.isLoading) return;
    if (!semesterParam) return;
    const isValidSemester = semesters.some((semester) => semester.id === semesterParam);
    if (isValidSemester) return;
    setFilter('semesterId', '');
  }, [semesterParam, semesters, semestersQuery.isLoading]);

  useEffect(() => {
    if (departmentsQuery.isLoading) return;
    if (!departmentParam) return;
    const isValidDepartment = departments.some((department) => department.id === departmentParam);
    if (isValidDepartment) return;
    setFilter('departmentId', '');
  }, [departmentParam, departments, departmentsQuery.isLoading]);

  const createMutation = useCreateCourseOffering();
  const updateMutation = useUpdateCourseOffering();
  const deleteMutation = useDeleteCourseOffering();
  const bulkDelete = useBulkDelete({ entityName: "course offering", entityNamePlural: "course offerings", deleteItem: (id) => deleteMutation.mutateAsync(id) });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Server already filters by search + semester; current page rows are authoritative.
  const filteredOfferings = offerings;

  const getRegistrationCount = (offering: CourseOffering) => {
    return (
      offering.enrollments?.length ??
      offering.registrationsCount ??
      0
    );
  };

  // Metrics: totalOfferings comes from meta (dataset-wide). Other metrics
  // are *page-scoped* because we no longer download the entire dataset.
  const totalEnrollments = useMemo(
    () =>
      offerings.reduce(
        (sum, offering) => sum + getRegistrationCount(offering),
        0
      ),
    [offerings]
  );
  const activeOfferings = useMemo(
    () => offerings.filter((offering) => offering.status === "ACTIVE").length,
    [offerings]
  );

  const openCreateModal = () => {
    setEditingOffering(null);
    setIsFormOpen(true);
  };

  const openEditModal = (offering: CourseOffering) => {
    setEditingOffering(offering);
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingOffering(null);
    createMutation.reset();
    updateMutation.reset();
  };

  const closeDeleteModal = () => {
    setDeletingOffering(null);
    deleteMutation.reset();
  };

  const handleViewDetails = (offering: CourseOffering) => {
    navigate(`/course-offerings/${offering.id}`);
  };

  const handleRefresh = () => {
    semestersQuery.refetch();
    offeringsQuery.refetch();
  };

  const isFetching = offeringsQuery.isFetching || semestersQuery.isFetching || departmentsQuery.isFetching;
  const isSearching = searchTerm.trim() !== deferredSearchTerm;
  const isTableLoading = isSearching || isFetching || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || bulkDelete.isDeleting;
  const showTableLoading = useDelayedLoading(isTableLoading);
  const showPageLoading = useDelayedLoading(semestersQuery.isLoading || departmentsQuery.isLoading || (offeringsQuery.isLoading && !offeringsQuery.data), 1000);

  const handleSubmit = async (data: CreateCourseOfferingDto) => {
    try {
      if (editingOffering?.id) {
        await updateMutation.mutateAsync({ id: editingOffering.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      closeFormModal();
    } catch {
      // Hooks already surface a toast on error; keep modal open.
    }
  };

  const confirmDelete = () => {
    if (!deletingOffering?.id) return;
    deleteMutation.mutate(deletingOffering.id, { onSuccess: closeDeleteModal });
  };

  const isPageError = offeringsQuery.isError || semestersQuery.isError || departmentsQuery.isError;
  const pageErrorMessage = getApiErrorMessage(
    departmentsQuery.error ?? semestersQuery.error ?? offeringsQuery.error,
    "Failed to load semester-filtered course offerings."
  );

  const selectedDepartmentLabel = selectedDepartment?.name ?? selectedDepartmentId;
  const departmentOptions = useMemo<SearchSelectFilterOption[]>(
    () => departments.flatMap((department) => {
      if (!department.id) return [];
      const label = formatDepartmentLabel(department);
      return [{
        value: department.id,
        label,
        description: department.code ?? undefined,
        searchText: normalizeFilterSearch(`${label} ${department.code ?? ""}`),
      }];
    }),
    [departments]
  );
  const activeFilterBadges = [
    ...(deferredSearchTerm ? [{ key: "search", label: "Search", value: deferredSearchTerm, onRemove: () => setSearchTerm("") }] : []),
    ...(selectedSemesterId ? [{ key: "semester", label: "Semester", value: selectedSemester?.name ?? selectedSemesterId, onRemove: () => setFilterParam("semesterId", "") }] : []),
    ...(selectedDepartmentId ? [{ key: "department", label: "Department", value: selectedDepartmentLabel, onRemove: () => setFilterParam("departmentId", "") }] : []),
  ];
  const activeFilterCount = activeFilterBadges.length;

  const semestersErrorMessage = getApiErrorMessage(
    semestersQuery.error,
    "Failed to load semesters for the offering form."
  );

  const submitMutation = editingOffering ? updateMutation : createMutation;
  const submitErrorMessage = submitMutation.isError
    ? getApiErrorMessage(
        submitMutation.error,
        editingOffering ? "Failed to update offering." : "Failed to create offering."
      )
    : undefined;
  const submitValidationMessages = submitMutation.isError
    ? getApiValidationErrors(submitMutation.error)
    : {};

  if (showPageLoading) {
    return (
      <div className="p-6">
        <PageSpinner label="Loading course offerings" />
      </div>
    );
  }

  if (isPageError) {
    return (
      <div className="p-6">
        <Card className="p-6 space-y-3">
          <p className="text-sm text-red-600">{pageErrorMessage}</p>
          <Button onClick={handleRefresh}>Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-8 space-y-1">
        <div className="flex items-center gap-3">
          <div className="rounded-none bg-zinc-950 p-2.5 text-white shadow-sm">
            <Layers className="size-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
              Course Offerings
            </h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              Track semester offerings, sections, and readiness across the catalog.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <StickyActionBar className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          onClick={openCreateModal}
          disabled={isFetching || isSaving}
          className="inline-flex h-10 items-center gap-2 rounded-none border border-zinc-950 bg-zinc-950 font-semibold text-white shadow-sm transition-all hover:bg-zinc-900 active:scale-95"
        >
          <Plus className="size-4" />
          Add Offering
        </Button>
        <Button
          variant="outline"
          onClick={handleRefresh}
          className="inline-flex h-10 items-center gap-2 rounded-none border-zinc-200 font-semibold text-zinc-950 transition-all hover:bg-zinc-50 active:scale-95"
        >
          <RefreshCw className={`size-4 transition-transform ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <div className="max-w-md sm:ml-auto sm:w-full sm:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Filter by course, instructor, or program…"
              className="h-10 rounded-none border-zinc-200 bg-transparent pl-10 text-sm shadow-none transition-colors hover:bg-zinc-50 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-zinc-300 group-data-[stuck=true]:bg-white/70 dark:border-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:bg-zinc-900/70 dark:focus-visible:bg-zinc-950 dark:focus-visible:ring-zinc-700 dark:group-data-[stuck=true]:bg-zinc-950/70"
            />
          </div>
        </div>
      </StickyActionBar>

      {/* Metrics Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Total Offerings
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-950">{totalOfferings}</p>
                <p className="mt-2 text-xs text-zinc-500">{selectedSemester ? "In the selected semester" : "Across all semesters"}</p>
              </div>
              <div className="rounded-none bg-blue-50 p-2">
                <Layers className="size-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Active Sections
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-950">{activeOfferings}</p>
                <p className="mt-2 text-xs text-zinc-500">Status = ACTIVE</p>
              </div>
              <div className="rounded-none bg-emerald-50 p-2">
                <TrendingUp className="size-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Enrolled Students
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-950">{totalEnrollments}</p>
                <p className="mt-2 text-xs text-zinc-500">Across displayed offerings</p>
              </div>
              <div className="rounded-none bg-violet-50 p-2">
                <Users className="size-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm transition-shadow hover:shadow-md sm:col-span-2 lg:col-span-2">
          <CardContent className="p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              System Status
            </p>
            <p className="mt-2 text-sm text-zinc-600">
              Real-time sync enabled. Course offerings refresh against the active semester filter and pull relational course, semester, registration, and exam assignment data directly from the API layer.
            </p>
            <div className="mt-3 flex gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-xs font-medium text-green-600">Operational</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Offerings List */}
      <div className="mb-8">
        <div className="mb-4 space-y-4 rounded-none border border-zinc-200/70 bg-linear-to-r from-white via-zinc-50/70 to-zinc-100/60 px-4 py-4 shadow-sm sm:px-5 dark:border-zinc-800/80 dark:from-zinc-950 dark:via-zinc-950/90 dark:to-zinc-900/80 dark:shadow-black/20">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                <SlidersHorizontal className="size-3.5" />
                Table Filter
              </div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Showing offerings for {selectedSemester?.name ?? "all semesters"}{selectedDepartment ? ` in ${selectedDepartment.name}` : " across all departments"}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Choose a semester and department to narrow the table, or keep all filters open to show every offering.
              </p>
            </div>
            {activeFilterCount > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={clearAdvancedFilters}
                className="h-10 rounded-none border-zinc-200 bg-white font-semibold text-zinc-950 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
              >
                <X className="mr-2 size-4" />
                Clear filters
              </Button>
            ) : null}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2">
            <div className="w-full sm:max-w-sm">
              <label
                htmlFor="course-offerings-semester-filter"
                className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400"
              >
                Semester
              </label>
              <Select
                value={selectedSemesterId || ALL_SEMESTERS}
                onValueChange={(value) => {
                  setFilterParam("semesterId", value === ALL_SEMESTERS ? "" : value);
                }}
              >
                <SelectTrigger
                  id="course-offerings-semester-filter"
                  className="h-11 rounded-none border-zinc-200 bg-white text-zinc-950 shadow-sm hover:border-zinc-300 focus-visible:ring-zinc-300/50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:focus-visible:ring-zinc-700/70"
                >
                  <SelectValue placeholder={semestersQuery.isLoading ? "Loading semesters..." : "All semesters"} />
                </SelectTrigger>
                <SelectContent className="rounded-none border-zinc-200 bg-white text-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
                  <SelectItem value={ALL_SEMESTERS}>All semesters</SelectItem>
                  {semesters.map((semester) => (
                    <SelectItem key={semester.id} value={semester.id}>
                      {semester.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <SearchSelectFilter
              label="Department"
              value={selectedDepartmentId}
              placeholder="All departments"
              searchPlaceholder="Search departments"
              options={departmentOptions}
              isLoading={departmentsQuery.isLoading}
              onChange={(value) => setFilterParam("departmentId", value)}
            />
          </div>

          <ActiveFilterBadges badges={activeFilterBadges} onClearAll={clearAdvancedFilters} />
        </div>

        <BulkDeleteToolbar selectedCount={bulkDelete.selectedCount} totalCount={filteredOfferings.length} isDeleting={bulkDelete.isDeleting || deleteMutation.isPending} onClear={bulkDelete.clearSelection} onDelete={() => bulkDelete.setIsConfirmOpen(true)} />

        <CourseOfferingList
          offerings={filteredOfferings}
          isLoading={showTableLoading}
          isDeleting={deleteMutation.isPending || bulkDelete.isDeleting}
          search={searchTerm}
          selectedIds={bulkDelete.selectedIds}
          onToggleSelected={bulkDelete.toggleSelected}
          onToggleAll={(checked) => bulkDelete.toggleAll(filteredOfferings, checked)}
          onCreateOffering={openCreateModal}
          onEditOffering={openEditModal}
          onViewOffering={handleViewDetails}
          onDeleteOffering={setDeletingOffering}
          highlightedOfferingId={highlightedOfferingId}
          pagination={{
            page: currentPage,
            pageCount: totalPages,
            pageSize: PAGE_SIZE,
            totalCount: totalOfferings,
            onPageChange: setPage,
          }}
        />
      </div>

      <DeleteConfirmModal
        open={Boolean(deletingOffering)}
        title="Delete Course Offering"
        description={
          deletingOffering
            ? `This will permanently delete the offering for ${
                deletingOffering.course?.title ?? deletingOffering.course?.name ?? "this course"
              } in ${deletingOffering.semester?.name ?? "this semester"}.`
            : "This action cannot be undone."
        }
        confirmLabel="Delete Offering"
        isLoading={deleteMutation.isPending}
        errorMessage={
          deleteMutation.isError
            ? getApiErrorMessage(deleteMutation.error, "Failed to delete offering.")
            : undefined
        }
        onCancel={closeDeleteModal}
        onConfirm={confirmDelete}
      />

      <DeleteConfirmModal
        open={bulkDelete.isConfirmOpen}
        title="Delete Selected Course Offerings"
        description={`This will permanently delete ${bulkDelete.selectedCount} selected course offering${bulkDelete.selectedCount === 1 ? "" : "s"}${selectedSemester ? ` from ${selectedSemester.name}` : ""}.`}
        confirmLabel="Bulk Delete"
        isLoading={bulkDelete.isDeleting}
        onCancel={() => bulkDelete.setIsConfirmOpen(false)}
        onConfirm={bulkDelete.confirmDelete}
      />

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => (open ? setIsFormOpen(true) : closeFormModal())}
      >
        <DialogContent className="flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden sm:max-w-2xl">
          <DialogHeader className="shrink-0">
            <DialogTitle>
              {editingOffering ? "Edit Course Offering" : "Add Course Offering"}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 flex-1 overflow-y-auto pr-1">
            <CourseOfferingForm
              key={editingOffering?.id ?? "new-offering"}
              initialData={editingOffering ?? undefined}
              semesters={semesters}
              isSemestersLoading={semestersQuery.isLoading}
              semestersErrorMessage={
                semestersQuery.isError ? semestersErrorMessage : undefined
              }
              submitErrorMessage={submitErrorMessage}
              submitValidationMessages={submitValidationMessages}
              isLoading={isSaving}
              onSubmit={handleSubmit}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
