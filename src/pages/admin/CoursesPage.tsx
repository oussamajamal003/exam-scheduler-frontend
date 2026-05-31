import { useDeferredValue, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { usePersistentFilters } from "../../hooks/common/usePersistentFilters";
import { useHighlightRow } from "../../hooks/common/useHighlightRow";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent } from "../../components/ui/card";
import { PageSpinner } from "../../components/shared/PageSpinner";
import { DeleteConfirmModal } from "../../components/shared/DeleteConfirmModal";
import { BulkDeleteToolbar } from "../../components/shared/BulkTableActions";
import { StickyActionBar } from "../../components/common/StickyActionBar";
import { ActiveFilterBadges } from "../../components/shared/ActiveFilterBadges";
import { SearchSelectFilter, type SearchSelectFilterOption } from "../../components/shared/SearchSelectFilter";
import { getApiErrorMessage, getApiValidationErrors } from "../../lib/apiError";
import { BookOpen, Plus, RefreshCw, TrendingUp, Search, SlidersHorizontal, X } from "lucide-react";

import { CourseList } from "../../features/courses/CourseList";
import { CourseForm } from "../../forms/courses/CourseForm";
import { CourseDetailDialog } from "../../features/courses/CourseDetailDialog";
import { Course } from "../../schemas/course";
import { useCourses, useCreateCourse, useUpdateCourse, useDeleteCourse } from "../../hooks/courses/useCourses";
import { usePrograms } from "../../hooks/programs/usePrograms";
import { useDepartments } from "../../hooks/departments/useDepartments";
import { useSemesters } from "../../hooks/semesters/useSemesters";
import { useDelayedLoading } from "../../hooks/common/useDelayedLoading";
import { useBulkDelete } from "../../hooks/common/useBulkDelete";

const normalizeFilterSearch = (value: string) => value.trim().toLowerCase();
const formatDepartmentLabel = (department: { name?: string; code?: string | null }) =>
  [department.name, department.code ? `(${department.code})` : null].filter(Boolean).join(" ");

export function CoursesPage() {
  const { filters, setFilter, setFilters } = usePersistentFilters('courses', {
    search: '',
    departmentId: '',
  });
  const search = filters.search;
  const setSearch = (value: string) => setFilter('search', value);
  const selectedDepartmentId = filters.departmentId;
  const deferredSearch = useDeferredValue(search.trim());
  const departmentsQuery = useDepartments();
  const departments = useMemo(() => departmentsQuery.data ?? [], [departmentsQuery.data]);
  const { data: courses = [], isLoading, isFetching, isError, error, refetch } = useCourses({ departmentId: selectedDepartmentId || undefined });
  const programsQuery = usePrograms();
  const semestersQuery = useSemesters();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [searchParams] = useSearchParams();
  const highlightedCourseId = searchParams.get("courseId") ?? searchParams.get("id");

  useHighlightRow("data-course-id", highlightedCourseId, courses.length);

  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourse();
  const deleteMutation = useDeleteCourse();
  const bulkDelete = useBulkDelete({ entityName: "course", entityNamePlural: "courses", deleteItem: (id) => deleteMutation.mutateAsync(id) });

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const programs = programsQuery.data ?? [];
  const semesters = semestersQuery.data ?? [];

  const submitError = editingCourse ? updateMutation.error : createMutation.error;
  const isSubmitError = editingCourse ? updateMutation.isError : createMutation.isError;
  const submitErrorMessage = isSubmitError 
    ? getApiErrorMessage(submitError, `Failed to ${editingCourse ? "update" : "create"} course.`) 
    : undefined;
  const submitValidationMessages = isSubmitError 
    ? getApiValidationErrors(submitError) 
    : undefined;

  const selectedDepartment = useMemo(
    () => departments.find((department) => department.id === selectedDepartmentId) ?? null,
    [departments, selectedDepartmentId]
  );

  const setFilterParam = (key: 'departmentId', value: string) => setFilter(key, value);

  const clearAdvancedFilters = () => {
    setFilters({ search: '', departmentId: '' });
  };

  const openCreateModal = () => {
    setEditingCourse(null);
    setIsFormOpen(true);
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingCourse(null);
  };

  const handleSubmit = (data: Course) => {
    if (editingCourse?.id) {
      updateMutation.mutate(
        { id: editingCourse.id, data },
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
    if (deletingCourse?.id) {
      deleteMutation.mutate(deletingCourse.id, {
        onSuccess: () => {
          setDeletingCourse(null);
        },
      });
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  const filteredCourses = useMemo(() => {
    const term = deferredSearch.toLowerCase();
    if (!term) return courses;
    return courses.filter((c) =>
      [c.name, c.code, c.program, c.semester]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [deferredSearch, courses]);

  const activeFilterBadges = [
    ...(deferredSearch ? [{ key: "search", label: "Search", value: deferredSearch, onRemove: () => setSearch("") }] : []),
    ...(selectedDepartmentId ? [{ key: "department", label: "Department", value: selectedDepartment?.name ?? selectedDepartmentId, onRemove: () => setFilterParam("departmentId", "") }] : []),
  ];
  const activeFilterCount = activeFilterBadges.length;
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

  const isSearching = search.trim() !== deferredSearch;
  const isTableLoading = isSearching || isFetching || departmentsQuery.isFetching || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || bulkDelete.isDeleting;
  const showTableLoading = useDelayedLoading(isTableLoading);
  const showPageLoading = useDelayedLoading(departmentsQuery.isLoading || (isLoading && !courses.length), 1000);

  useEffect(() => {
    if (departmentsQuery.isLoading) return;
    if (!selectedDepartmentId) return;
    if (selectedDepartment) return;
    setFilter('departmentId', '');
  }, [departmentsQuery.isLoading, selectedDepartment, selectedDepartmentId]);

  if (showPageLoading) {
    return (
      <div className="p-6">
        <PageSpinner label="Loading courses..." />
      </div>
    );
  }

  if (isError || departmentsQuery.isError) {
    return (
      <div className="p-6">
        <Card className="p-6 space-y-3">
          <p className="text-sm text-red-600">{getApiErrorMessage(departmentsQuery.error ?? error, "Failed to load courses.")}</p>
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
            <BookOpen className="size-5" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">Courses</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Manage and organize courses for exam scheduling and enrollment</p>
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
          Add Course
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
            placeholder="Search by title, code or dept."
            className="h-10 rounded-none border-zinc-200 bg-transparent pl-9 text-sm hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50 group-data-[stuck=true]:bg-white dark:border-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:bg-zinc-900/70 dark:focus-visible:border-zinc-700 dark:focus-visible:ring-zinc-700/70 dark:group-data-[stuck=true]:bg-zinc-950/70"
          />
        </div>
      </StickyActionBar>

      <div className="mb-4 space-y-4 rounded-none border border-zinc-200/70 bg-linear-to-r from-white via-zinc-50/70 to-zinc-100/60 px-4 py-4 shadow-sm sm:px-5 dark:border-zinc-800/80 dark:from-zinc-950 dark:via-zinc-950/90 dark:to-zinc-900/80 dark:shadow-black/20">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              <SlidersHorizontal className="size-3.5" />
              Table Filter
            </div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Showing courses for {selectedDepartment?.name ?? "all departments"}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Choose a department to narrow the table, or keep all departments to show every course.</p>
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

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Total Courses</p>
                <p className="text-3xl font-bold text-zinc-950 mt-2">{courses.length}</p>
                <p className="text-xs text-zinc-500 mt-2">Active course offerings</p>
              </div>
              <div className="p-2 rounded-none bg-blue-50">
                <TrendingUp className="size-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Exam Integration</p>
                <p className="text-3xl font-bold text-zinc-950 mt-2">Enabled</p>
                <p className="text-xs text-zinc-500 mt-2">Automated exam generation</p>
              </div>
              <div className="p-2 rounded-none bg-green-50">
                <BookOpen className="size-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-2">
          <CardContent className="p-6">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Curriculum Status</p>
            <p className="text-sm text-zinc-600 mt-2">Manage courses and seamlessly generate exams for scheduled sessions. Real-time synchronization ensures all course data is current and ready for exam creation and student enrollment.</p>
            <div className="flex gap-2 mt-3">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs font-medium text-green-600">All Systems Active</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {(programsQuery.isError || semestersQuery.isError) && (
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          {programsQuery.isError && (
            <Card className="rounded-none border border-red-200 bg-red-50 text-red-900">
              <CardContent className="p-4 sm:p-5">
                <p className="text-sm font-semibold">Programs Load Error</p>
                <p className="mt-2 text-sm">
                  {getApiErrorMessage(programsQuery.error, "Failed to load programs for the course form.")}
                </p>
              </CardContent>
            </Card>
          )}
          {semestersQuery.isError && (
            <Card className="rounded-none border border-amber-200 bg-amber-50 text-amber-900">
              <CardContent className="p-4 sm:p-5">
                <p className="text-sm font-semibold">Semesters Load Warning</p>
                <p className="mt-2 text-sm">
                  {getApiErrorMessage(semestersQuery.error, "Failed to load semesters for the course form.")}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="mb-8">
        <BulkDeleteToolbar selectedCount={bulkDelete.selectedCount} totalCount={filteredCourses.length} isDeleting={bulkDelete.isDeleting || deleteMutation.isPending} onClear={bulkDelete.clearSelection} onDelete={() => bulkDelete.setIsConfirmOpen(true)} />
        <CourseList
          courses={filteredCourses}
          isLoading={showTableLoading}
          isDeleting={deleteMutation.isPending || bulkDelete.isDeleting}
          search={search}
          selectedIds={bulkDelete.selectedIds}
          onToggleSelected={bulkDelete.toggleSelected}
          onToggleAll={(checked) => bulkDelete.toggleAll(filteredCourses, checked)}
          onAdd={openCreateModal}
          onEditCourse={openEditModal}
          onDeleteCourse={setDeletingCourse}
          onViewDetails={setDetailCourse}
          highlightedCourseId={highlightedCourseId}
        />
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Edit Course" : "Add New Course"}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <CourseForm 
              initialData={editingCourse ?? undefined} 
              existingCourses={courses}
              programs={programs}
              semesters={semesters}
              isProgramsLoading={programsQuery.isLoading}
              isSemestersLoading={semestersQuery.isLoading}
              programsErrorMessage={
                programsQuery.isError
                  ? getApiErrorMessage(programsQuery.error, "Failed to load programs for the course form.")
                  : undefined
              }
              semestersErrorMessage={
                semestersQuery.isError
                  ? getApiErrorMessage(semestersQuery.error, "Failed to load semesters for the course form.")
                  : undefined
              }
              submitErrorMessage={submitErrorMessage}
              submitValidationMessages={submitValidationMessages}
              onSubmit={handleSubmit} 
              isLoading={isSaving} 
            />
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmModal
        open={!!deletingCourse}
        onCancel={() => setDeletingCourse(null)}
        onConfirm={confirmDelete}
        title="Delete Course"
        description={`Are you sure you want to delete ${deletingCourse?.code}? Exams and enrollments associated with this may be affected.`}
        isLoading={deleteMutation.isPending}
        errorMessage={deleteMutation.isError ? getApiErrorMessage(deleteMutation.error, "Failed to delete course.") : undefined}
      />

      <DeleteConfirmModal
        open={bulkDelete.isConfirmOpen}
        onCancel={() => bulkDelete.setIsConfirmOpen(false)}
        onConfirm={bulkDelete.confirmDelete}
        title="Delete Selected Courses"
        description={`This will permanently delete ${bulkDelete.selectedCount} selected course${bulkDelete.selectedCount === 1 ? "" : "s"}. Related exams and enrollments may be affected.`}
        confirmLabel="Bulk Delete"
        isLoading={bulkDelete.isDeleting}
      />

      <CourseDetailDialog course={detailCourse} open={!!detailCourse} onClose={() => setDetailCourse(null)} />
    </div>
  );
}
