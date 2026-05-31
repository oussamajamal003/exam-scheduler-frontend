import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { usePersistentFilters } from "../../hooks/common/usePersistentFilters";
import { useHighlightRow } from "../../hooks/common/useHighlightRow";
import { StudentList } from "../../features/students/StudentList";
import { StudentForm } from "../../forms/students/StudentForm";
import { useCreateStudent, useDeleteStudent, useStudentExams, useStudentsPage, useUpdateStudent } from "../../hooks/students/useStudents";
import { usePrograms } from "../../hooks/programs/usePrograms";
import { useDepartments } from "../../hooks/departments/useDepartments";
import { useDelayedLoading } from "../../hooks/common/useDelayedLoading";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Student } from "../../schemas/student";
import { Card, CardContent } from "../../components/ui/card";
import { getApiErrorMessage, getApiValidationErrors } from "../../lib/apiError";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { PageSpinner } from "../../components/shared/PageSpinner";
import { DeleteConfirmModal } from "../../components/shared/DeleteConfirmModal";
import { BulkDeleteToolbar } from "../../components/shared/BulkTableActions";
import { StickyActionBar } from "../../components/common/StickyActionBar";
import { useToast } from "../../components/ui/toast";
import { Users, Plus, RefreshCw, TrendingUp, Search, ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { ActiveFilterBadges } from "../../components/shared/ActiveFilterBadges";
import { SearchSelectFilter, type SearchSelectFilterOption } from "../../components/shared/SearchSelectFilter";

const normalizeFilterSearch = (value: string) => value.trim().toLowerCase();
const formatDepartmentLabel = (department: { name?: string; code?: string | null }) =>
  [department.name, department.code ? `(${department.code})` : null].filter(Boolean).join(" ");

export function StudentsPage() {
  const getStudentSubmitValidationMessages = (error: unknown) => {
    const baseErrors = getApiValidationErrors(error);
    const message = getApiErrorMessage(error, "").toLowerCase();
    if (!baseErrors.email && message.includes("email already exists")) {
      return { ...baseErrors, email: ["Student email already exists."] };
    }
    return baseErrors;
  };

  const PAGE_SIZE = 50;
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { filters, setFilter, setFilters } = usePersistentFilters('students', {
    search: '',
    departmentId: '',
  });
  const search = filters.search;
  const [silentSearch, setSilentSearch] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const hlId = params.get('studentId') ?? params.get('id');
    const hl = params.get('_hl');
    return (hlId && hl) ? hl : '';
  });
  const setSearch = (value: string) => {
    if (value && silentSearch) setSilentSearch('');
    setFilter('search', value);
  };
  const deferredSearch = useDeferredValue(search.trim());
  const departmentsQuery = useDepartments();
  const departments = useMemo(() => departmentsQuery.data ?? [], [departmentsQuery.data]);
  const selectedDepartmentId = filters.departmentId;

  // URL-synced page (1-based)
  const pageParam = Number(searchParams.get("page") ?? "1");
  const currentPage = Number.isFinite(pageParam) && pageParam >= 1 ? Math.floor(pageParam) : 1;
  const setPage = (next: number) => {
    const nextParams = new URLSearchParams(searchParams);
    if (next <= 1) nextParams.delete("page");
    else nextParams.set("page", String(next));
    setSearchParams(nextParams, { replace: true });
  };

  const setFilterParam = (key: 'departmentId', value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('page');
    setSearchParams(nextParams, { replace: true });
    setFilter(key, value);
  };

  const clearAdvancedFilters = () => {
    setSilentSearch('');
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('page');
    setSearchParams(nextParams, { replace: true });
    setFilters({ search: '', departmentId: '' });
  };

  const studentsQuery = useStudentsPage({
    page: currentPage,
    pageSize: PAGE_SIZE,
    search: deferredSearch || silentSearch,
    departmentId: selectedDepartmentId || undefined,
  });
  const students = useMemo(() => studentsQuery.data?.data ?? [], [studentsQuery.data]);
  const studentsMeta = studentsQuery.data?.meta;
  const totalStudents = studentsMeta?.total ?? students.length;
  const totalPages = studentsMeta?.totalPages ?? 1;
  const isLoading = studentsQuery.isLoading;
  const isFetching = studentsQuery.isFetching;
  const isError = studentsQuery.isError;
  const error = studentsQuery.error;
  const refetch = studentsQuery.refetch;

  useEffect(() => {
    if (departmentsQuery.isLoading) return;
    if (!selectedDepartmentId) return;
    const isValidDepartment = departments.some((department) => department.id === selectedDepartmentId);
    if (isValidDepartment) return;
    setFilter('departmentId', '');
  }, [departments, departmentsQuery.isLoading, selectedDepartmentId]);

  const programsQuery = usePrograms();
  const programs = programsQuery.data ?? [];
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [examStudent, setExamStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();
  const deleteMutation = useDeleteStudent();
  const examsQuery = useStudentExams(examStudent?.id);
  const highlightedStudentId = searchParams.get("studentId") ?? searchParams.get("id");
  const _hlStudentParam = searchParams.get('_hl');
  // Sync silentSearch when CommandSearch navigates here while page is already mounted.
  useEffect(() => {
    if (highlightedStudentId && _hlStudentParam) setSilentSearch(_hlStudentParam);
    else if (!highlightedStudentId) setSilentSearch('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedStudentId, _hlStudentParam]);

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const submitError = createMutation.isError
    ? createMutation.error
    : updateMutation.isError
      ? updateMutation.error
      : undefined;
  const submitValidationMessages = useMemo(
    () => (submitError ? getStudentSubmitValidationMessages(submitError) : undefined),
    [submitError]
  );
  const submitErrorMessage = useMemo(() => {
    if (!submitError) return undefined;
    if (submitValidationMessages?.email?.length) {
      return submitValidationMessages.email[0];
    }
    return getApiErrorMessage(submitError, "An error occurred while saving.");
  }, [submitError, submitValidationMessages]);
  const clearSubmitErrors = () => {
    createMutation.reset();
    updateMutation.reset();
  };

  const openCreateModal = () => {
    setEditingStudent(null);
    setIsFormOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingStudent(null);
  };

  const handleSubmit = (data: Student) => {
    if (editingStudent?.id) {
      updateMutation.mutate(
        { id: editingStudent.id, data },
        {
          onSuccess: () => {
            closeFormModal();
          },
        }
      );
      return;
    }

    createMutation.mutate(data, {
      onSuccess: () => {
        closeFormModal();
      },
    });
  };

  const handleDelete = (student: Student) => {
    setDeletingStudent(student);
  };

  const closeDeleteModal = () => {
    setDeletingStudent(null);
    deleteMutation.reset();
  };

  const confirmDelete = () => {
    if (!deletingStudent?.id) return;

    deleteMutation.mutate(deletingStudent.id, {
      onSuccess: () => {
        closeDeleteModal();
      },
    });
  };

  const toggleSelectedStudent = (id: string, checked: boolean) => {
    setSelectedStudentIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const clearSelectedStudents = () => {
    setSelectedStudentIds(new Set());
  };

  const confirmBulkDelete = async () => {
    const ids = Array.from(selectedStudentIds);
    if (ids.length === 0) return;

    setIsBulkDeleting(true);
    const results = await Promise.allSettled(ids.map((id) => deleteMutation.mutateAsync(id)));
    const deletedIds = ids.filter((_, index) => results[index].status === "fulfilled");
    const failedCount = results.length - deletedIds.length;

    setSelectedStudentIds((current) => {
      const next = new Set(current);
      deletedIds.forEach((id) => next.delete(id));
      return next;
    });
    setIsBulkDeleting(false);

    if (failedCount === 0) {
      setIsBulkDeleteOpen(false);
      addToast({ type: "success", title: "Students deleted", description: `${deletedIds.length} selected student${deletedIds.length === 1 ? "" : "s"} removed.` });
      return;
    }

    addToast({ type: "error", title: "Bulk delete incomplete", description: `${deletedIds.length} deleted, ${failedCount} failed. Review the remaining selected rows and try again.` });
  };

  const handleRefresh = () => {
    refetch();
  };

  const exams = examsQuery.data ?? [];
  const examErrorMessage = getApiErrorMessage(examsQuery.error, "Failed to load student exams.");
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
  const selectedDepartmentLabel = departments.find((department) => department.id === selectedDepartmentId)?.name ?? selectedDepartmentId;
  const activeFilterBadges = [
    ...(deferredSearch ? [{ key: "search", label: "Search", value: deferredSearch, onRemove: () => setSearch("") }] : []),
    ...(selectedDepartmentId ? [{ key: "department", label: "Department", value: selectedDepartmentLabel, onRemove: () => setFilterParam("departmentId", "") }] : []),
  ];
  const activeFilterCount = activeFilterBadges.length;

  // Server already filters by search; current page is authoritative.
  const filteredStudents = students;

  const toggleAllVisibleStudents = (checked: boolean) => {
    setSelectedStudentIds((current) => {
      const next = new Set(current);
      filteredStudents.forEach((student) => {
        if (!student.id) return;
        if (checked) next.add(student.id);
        else next.delete(student.id);
      });
      return next;
    });
  };

  const isSearching = search.trim() !== deferredSearch;
  const isTableLoading = isSearching || isFetching || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || departmentsQuery.isFetching;
  const showPageLoading = useDelayedLoading(departmentsQuery.isLoading || (isLoading && !studentsQuery.data), 1000);
  const showTableLoading = useDelayedLoading(isTableLoading);

  useHighlightRow("data-student-id", highlightedStudentId, students.length);

  if (showPageLoading) {
    return (
      <div className="p-6">
        <PageSpinner label="Loading students" />
      </div>
    );
  }

  if (isError || departmentsQuery.isError) {
    return (
      <div className="p-6">
        <Card className="p-6 space-y-3">
          <p className="text-sm text-red-600">{getApiErrorMessage(departmentsQuery.error ?? error, "Failed to load students.")}</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </Card>
      </div>
    );
  };

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-8 space-y-1">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-none bg-zinc-950 text-white shadow-sm">
            <Users className="size-5" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">Students</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Manage and organize student records across your institution</p>
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
          Add Student
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
            placeholder="Search by name, ID or email"
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
              Showing students from {selectedDepartmentId ? selectedDepartmentLabel : "all departments"}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Choose a department to narrow the table, or keep all departments to show every student.</p>
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
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Total Students</p>
                <p className="text-3xl font-bold text-zinc-950 mt-2">{totalStudents}</p>
                <p className="text-xs text-zinc-500 mt-2">Active profiles in system</p>
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
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Actions Available</p>
                <p className="text-3xl font-bold text-zinc-950 mt-2">3</p>
                <p className="text-xs text-zinc-500 mt-2">Add, edit, and delete</p>
              </div>
              <div className="p-2 rounded-none bg-green-50">
                <Plus className="size-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-2">
          <CardContent className="p-6">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">System Status</p>
            <p className="text-sm text-zinc-600 mt-2">Real-time sync enabled. All student records are automatically updated with exam details and enrollment information. Your data is always current and secure.</p>
            <div className="flex gap-2 mt-3">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs font-medium text-green-600">Operational</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students List */}
      <div className="mb-8">
        <BulkDeleteToolbar
          selectedCount={selectedStudentIds.size}
          totalCount={filteredStudents.length}
          isDeleting={isBulkDeleting || deleteMutation.isPending}
          onClear={clearSelectedStudents}
          onDelete={() => setIsBulkDeleteOpen(true)}
        />
        <StudentList
          students={filteredStudents}
          isLoading={showTableLoading}
          isDeleting={deleteMutation.isPending || isBulkDeleting}
          search={search}
          highlightedStudentId={highlightedStudentId}
          selectedIds={selectedStudentIds}
          onToggleSelected={toggleSelectedStudent}
          onToggleAll={toggleAllVisibleStudents}
          onAdd={openCreateModal}
          onEditStudent={openEditModal}
          onViewExams={setExamStudent}
          onDeleteStudent={handleDelete}
        />
        {totalPages > 1 && (
          <div className="mt-3 flex items-center justify-between gap-3 border border-zinc-200/60 bg-white px-4 py-3 text-xs text-zinc-600 sm:px-6">
            <p>
              Showing <span className="font-semibold text-zinc-900">{totalStudents === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}</span>–
              <span className="font-semibold text-zinc-900">{Math.min(totalStudents, currentPage * PAGE_SIZE)}</span> of
              <span className="font-semibold text-zinc-900"> {totalStudents}</span>
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
              <span className="font-semibold text-zinc-900">Page {currentPage} of {totalPages}</span>
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
        open={Boolean(deletingStudent)}
        title="Delete Student"
        description={
          deletingStudent
            ? `This will permanently delete ${deletingStudent.firstName} ${deletingStudent.lastName} and remove related student records from the database.`
            : "This action cannot be undone."
        }
        confirmLabel="Delete Student"
        isLoading={deleteMutation.isPending}
        errorMessage={
          deleteMutation.isError
            ? getApiErrorMessage(deleteMutation.error, "Failed to delete student.")
            : undefined
        }
        onCancel={closeDeleteModal}
        onConfirm={confirmDelete}
      />

      <DeleteConfirmModal
        open={isBulkDeleteOpen}
        title="Delete Selected Students"
        description={`This will permanently delete ${selectedStudentIds.size} selected student${selectedStudentIds.size === 1 ? "" : "s"}. This action cannot be undone.`}
        confirmLabel="Bulk Delete"
        isLoading={isBulkDeleting}
        onCancel={() => setIsBulkDeleteOpen(false)}
        onConfirm={confirmBulkDelete}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <StudentForm
              initialData={editingStudent ?? undefined}
              programs={programs}
              isProgramsLoading={programsQuery.isLoading}
              programsErrorMessage={
                programsQuery.isError
                  ? getApiErrorMessage(programsQuery.error, "Failed to load programs.")
                  : undefined
              }
              onSubmit={handleSubmit}
              isLoading={isSaving}
              submitErrorMessage={submitErrorMessage}
              submitValidationMessages={submitValidationMessages}
              onClearSubmitError={clearSubmitErrors}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(examStudent)} onOpenChange={(open) => !open && setExamStudent(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {examStudent ? `${examStudent.firstName} ${examStudent.lastName} Exams` : "Student Exams"}
            </DialogTitle>
          </DialogHeader>

          {examsQuery.isLoading && <PageSpinner label="Loading exams" className="min-h-55" />}

          {examsQuery.isError && <div className="py-6 text-sm text-red-600">{examErrorMessage}</div>}

          {!examsQuery.isLoading && !examsQuery.isError && (
            <div className="max-h-[60vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                        No exams found for this student.
                      </TableCell>
                    </TableRow>
                  ) : (
                    exams.map((exam, index) => (
                      <TableRow key={`${exam.courseCode}-${index}`}>
                        <TableCell className="font-medium">{exam.courseName}</TableCell>
                        <TableCell>{exam.courseCode}</TableCell>
                        <TableCell>{exam.status ?? "Pending"}</TableCell>
                        <TableCell>{exam.duration ?? "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
