import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { usePersistentFilters } from "../../hooks/common/usePersistentFilters";
import { useHighlightRow } from "../../hooks/common/useHighlightRow";
import {
  Check,
  ChevronDown,
  ClipboardList,
  GraduationCap,
  Layers,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Upload,
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
import { Label } from "../../components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { PageSpinner } from "../../components/shared/PageSpinner";
import { DeleteConfirmModal } from "../../components/shared/DeleteConfirmModal";
import { ActiveFilterBadges } from "../../components/shared/ActiveFilterBadges";
import { BulkDeleteToolbar } from "../../components/shared/BulkTableActions";
import { StickyActionBar } from "../../components/common/StickyActionBar";
import { EnrollmentList } from "../../features/enrollments/EnrollmentList";
import { EnrollmentBulkImport } from "../../features/enrollments/EnrollmentBulkImport";
import { EnrollmentForm } from "../../forms/enrollments/EnrollmentForm";
import { getApiErrorMessage } from "../../lib/apiError";
import {
  useBulkImportEnrollments,
  useCreateEnrollment,
  useDeleteEnrollment,
  useEnrollmentFilterOptions,
  useEnrollmentsPage,
} from "../../hooks/enrollments/useEnrollments";
import { useStudents } from "../../hooks/students/useStudents";
import { useCourseOfferings } from "../../hooks/courseOfferings/useCourseOfferings";
import { useSemesters } from "../../hooks/semesters/useSemesters";
import { useDelayedLoading } from "../../hooks/common/useDelayedLoading";
import { useBulkDelete } from "../../hooks/common/useBulkDelete";
import { cn } from "../../lib/utils";
import type { CreateEnrollmentDto, Enrollment, EnrollmentCourseOffering, EnrollmentDepartment, EnrollmentStudent } from "../../schemas/enrollment";

type EnrollmentFilterOption = {
  value: string;
  label: string;
  description?: string;
  searchText: string;
};

const ALL_SEMESTERS = "__all_semesters__";

const normalizeFilterSearch = (value: string) => value.trim().toLowerCase();

const formatOfferingLabel = (offering: EnrollmentCourseOffering) => {
  const title = offering.course?.title ?? offering.course?.name ?? "Untitled course";
  const semester = offering.semester?.name ?? "Semester TBD";
  const section = offering.section ? `Section ${offering.section}` : "Default section";
  return `${title} • ${semester} • ${section}`;
};

const formatStudentLabel = (student: EnrollmentStudent) =>
  student.fullName ?? student.user?.name ?? student.universityId ?? "Unknown student";

const formatDepartmentLabel = (department: EnrollmentDepartment) =>
  [department.name, department.code ? `(${department.code})` : null].filter(Boolean).join(" ");

function EnrollmentSearchFilter({
  label,
  value,
  placeholder,
  searchPlaceholder,
  options,
  isLoading,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  searchPlaceholder: string;
  options: EnrollmentFilterOption[];
  isLoading?: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = options.find((option) => option.value === value) ?? null;
  const term = normalizeFilterSearch(search);
  const visibleOptions = useMemo(
    () => term ? options.filter((option) => option.searchText.includes(term)) : options,
    [options, term]
  );

  return (
    <div className="min-w-0 space-y-1.5">
      <Label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "min-h-11 h-auto w-full justify-between rounded-none border-zinc-200 bg-white px-3 py-2 text-left text-sm font-semibold text-zinc-950 shadow-sm hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-zinc-700 dark:hover:bg-zinc-900",
              selected && "border-zinc-950 dark:border-zinc-400"
            )}
          >
            <span className={cn("min-w-0 flex-1 whitespace-normal wrap-break-word leading-4", !selected && "text-zinc-500 dark:text-zinc-400")}>
              {selected?.label ?? placeholder}
            </span>
            <ChevronDown className="ml-2 size-4 shrink-0 text-zinc-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[--radix-popover-trigger-width] min-w-72 rounded-none border-zinc-200 p-0 dark:border-zinc-800">
          <div className="border-b border-zinc-200 p-2 dark:border-zinc-800">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 rounded-none border-zinc-200 pl-8 text-sm shadow-none dark:border-zinc-800"
              />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto p-1">
            {selected ? (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setSearch("");
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-none px-2 py-2 text-left text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                <X className="size-4 shrink-0" />
                Clear {label.toLowerCase()}
              </button>
            ) : null}
            {isLoading ? (
              <div className="px-2 py-3 text-sm text-zinc-500">Loading options...</div>
            ) : visibleOptions.length === 0 ? (
              <div className="px-2 py-3 text-sm text-zinc-500">No matching options</div>
            ) : (
              visibleOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setSearch("");
                      setOpen(false);
                    }}
                    className="flex w-full items-start gap-2 rounded-none px-2 py-2 text-left text-sm transition-colors hover:bg-zinc-100 focus:bg-zinc-100 dark:hover:bg-zinc-900 dark:focus:bg-zinc-900"
                  >
                    <Check className={cn("mt-0.5 size-4 shrink-0", isSelected ? "opacity-100" : "opacity-0")} />
                    <span className="min-w-0 flex-1 whitespace-normal wrap-break-word leading-4">
                      <span className="font-semibold text-zinc-950 dark:text-zinc-100">{option.label}</span>
                      {option.description ? <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">{option.description}</span> : null}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function EnrollmentsPage() {
  const PAGE_SIZE = 50;
  const [searchParams, setSearchParams] = useSearchParams();

  const { filters, setFilter, setFilters } = usePersistentFilters('enrollments', {
    search: '',
    semesterId: '',
    departmentId: '',
    courseOfferingId: '',
    studentId: '',
  });
  const searchTerm = filters.search;
  const [silentSearch, setSilentSearch] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const hlId = params.get('enrollmentId') ?? params.get('id');
    const hl = params.get('_hl');
    return (hlId && hl) ? hl : '';
  });
  const setSearchTerm = (value: string) => {
    if (value && silentSearch) setSilentSearch('');
    setFilter('search', value);
  };
  const deferredSearch = useDeferredValue(searchTerm.trim());
  const semesterParam = filters.semesterId;
  const selectedDepartmentId = filters.departmentId;
  const selectedCourseOfferingId = filters.courseOfferingId;
  const selectedStudentId = filters.studentId;

  const semestersQuery = useSemesters();
  const semesters = useMemo(() => semestersQuery.data ?? [], [semestersQuery.data]);
  const selectedSemester = useMemo(
    () => semesters.find((semester) => semester.id === semesterParam) ?? null,
    [semesters, semesterParam]
  );
  const selectedSemesterId = selectedSemester?.id ?? "";

  // URL-synced page (1-based)
  const pageParam = Number(searchParams.get("page") ?? "1");
  const currentPage = Number.isFinite(pageParam) && pageParam >= 1 ? Math.floor(pageParam) : 1;
  const setPage = (next: number) => {
    const nextParams = new URLSearchParams(searchParams);
    if (next <= 1) nextParams.delete("page");
    else nextParams.set("page", String(next));
    setSearchParams(nextParams, { replace: true });
  };

  const setFilterParam = (key: 'departmentId' | 'courseOfferingId' | 'studentId', value: string) => setFilter(key, value);

  const clearAdvancedFilters = () => {
    setSilentSearch('');
    setFilters({ search: '', semesterId: '', departmentId: '', courseOfferingId: '', studentId: '' });
  };

  // Reset page to 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('page');
      setSearchParams(nextParams, { replace: true });
    }
    // intentionally only run when these inputs change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSemesterId, selectedDepartmentId, selectedCourseOfferingId, selectedStudentId]);

  const enrollmentsQuery = useEnrollmentsPage({
    page: currentPage,
    pageSize: PAGE_SIZE,
    search: deferredSearch || silentSearch,
    semesterId: selectedSemesterId || undefined,
    departmentId: selectedDepartmentId || undefined,
    courseOfferingId: selectedCourseOfferingId || undefined,
    studentId: selectedStudentId || undefined,
  });
  const filterOptionsQuery = useEnrollmentFilterOptions({
    semesterId: selectedSemesterId || undefined,
  });
  // Full lookup maps are only needed for CSV import. The Add form uses paged
  // async selectors so opening it does not download/render thousands of rows.
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [deleting, setDeleting] = useState<Enrollment | null>(null);
  const studentsQuery = useStudents({ enabled: isBulkOpen });
  const offeringsQuery = useCourseOfferings({
    semesterId: selectedSemesterId || undefined,
    enabled: isBulkOpen,
  });

  useEffect(() => {
    if (semestersQuery.isLoading) return;
    if (!semesterParam) return;
    const isValidSemester = semesters.some((semester) => semester.id === semesterParam);
    if (isValidSemester) return;
    setFilters({ semesterId: '', departmentId: '', courseOfferingId: '', studentId: '' });
  }, [semesterParam, semesters, semestersQuery.isLoading]);

  const enrollments = useMemo(
    () => enrollmentsQuery.data?.data ?? [],
    [enrollmentsQuery.data]
  );
  const enrollmentsMeta = enrollmentsQuery.data?.meta;
  const totalEnrollments = enrollmentsMeta?.total ?? enrollments.length;
  const totalPages = enrollmentsMeta?.totalPages ?? 1;

  const highlightedEnrollmentId = searchParams.get("enrollmentId") ?? searchParams.get("id");
  const _hlEnrollmentParam = searchParams.get('_hl');
  useEffect(() => {
    if (highlightedEnrollmentId && _hlEnrollmentParam) setSilentSearch(_hlEnrollmentParam);
    else if (!highlightedEnrollmentId) setSilentSearch('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedEnrollmentId, _hlEnrollmentParam]);
  useHighlightRow("data-enrollment-id", highlightedEnrollmentId, enrollments.length);

  const students = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data]);
  const offerings = useMemo(() => offeringsQuery.data ?? [], [offeringsQuery.data]);
  const filterOptions = filterOptionsQuery.data;

  const departmentOptions = useMemo<EnrollmentFilterOption[]>(
    () => (filterOptions?.departments ?? []).map((department) => {
      const label = formatDepartmentLabel(department);
      return {
        value: department.id,
        label,
        description: department.code,
        searchText: normalizeFilterSearch(`${label} ${department.code ?? ""}`),
      };
    }),
    [filterOptions?.departments]
  );
  const courseOfferingOptions = useMemo<EnrollmentFilterOption[]>(
    () => (filterOptions?.courseOfferings ?? []).map((offering) => {
      const label = formatOfferingLabel(offering);
      const description = [offering.course?.code, offering.course?.program?.name].filter(Boolean).join(" • ");
      return {
        value: offering.id,
        label,
        description,
        searchText: normalizeFilterSearch(`${label} ${description} ${offering.instructor ?? ""}`),
      };
    }),
    [filterOptions?.courseOfferings]
  );
  const studentOptions = useMemo<EnrollmentFilterOption[]>(
    () => (filterOptions?.students ?? []).map((student) => {
      const label = formatStudentLabel(student);
      const description = [student.universityId, student.user?.email].filter(Boolean).join(" • ");
      return {
        value: student.id,
        label,
        description,
        searchText: normalizeFilterSearch(`${label} ${description} ${student.program?.name ?? ""}`),
      };
    }),
    [filterOptions?.students]
  );

  useEffect(() => {
    if (!filterOptions) return;
    let changed = false;
    const updates: Partial<{ departmentId: string; courseOfferingId: string; studentId: string }> = {};
    if (selectedDepartmentId && !departmentOptions.some((option) => option.value === selectedDepartmentId)) {
      updates.departmentId = '';
      changed = true;
    }
    if (selectedCourseOfferingId && !courseOfferingOptions.some((option) => option.value === selectedCourseOfferingId)) {
      updates.courseOfferingId = '';
      changed = true;
    }
    if (selectedStudentId && !studentOptions.some((option) => option.value === selectedStudentId)) {
      updates.studentId = '';
      changed = true;
    }
    if (changed) {
      setFilters(updates);
    }
  }, [courseOfferingOptions, departmentOptions, filterOptions, selectedCourseOfferingId, selectedDepartmentId, selectedStudentId, studentOptions]);

  const createMutation = useCreateEnrollment();
  const deleteMutation = useDeleteEnrollment();
  const bulkMutation = useBulkImportEnrollments();
  const bulkDelete = useBulkDelete({ entityName: "enrollment", entityNamePlural: "enrollments", deleteItem: (id) => deleteMutation.mutateAsync(id) });

  const isPageLoading =
    semestersQuery.isLoading || enrollmentsQuery.isLoading;

  // NOTE: Metrics now show *page* counts rather than dataset-wide aggregates
  // because we fetch per-page. Use the meta total for the headline number.
  const uniqueStudents = useMemo(
    () => new Set(enrollments.map((e) => e.student?.id).filter(Boolean)).size,
    [enrollments]
  );
  const uniqueOfferings = useMemo(
    () => new Set(enrollments.map((e) => e.courseOffering?.id).filter(Boolean)).size,
    [enrollments]
  );
  const activeEnrollments = useMemo(
    () =>
      enrollments.filter((e) => (e.status ?? "ACTIVE").toUpperCase() === "ACTIVE")
        .length,
    [enrollments]
  );

  const closeForm = () => {
    setIsFormOpen(false);
    createMutation.reset();
  };

  const closeBulk = () => {
    setIsBulkOpen(false);
    bulkMutation.reset();
  };

  const closeDelete = () => {
    setDeleting(null);
    deleteMutation.reset();
  };

  const handleRefresh = () => {
    semestersQuery.refetch();
    enrollmentsQuery.refetch();
    filterOptionsQuery.refetch();
  };

  const isFetching = enrollmentsQuery.isFetching || semestersQuery.isFetching || filterOptionsQuery.isFetching;
  const isSearching = searchTerm.trim() !== deferredSearch;
  const isTableLoading = isSearching || isFetching || createMutation.isPending || deleteMutation.isPending || bulkMutation.isPending || bulkDelete.isDeleting;
  const showTableLoading = useDelayedLoading(isTableLoading);
  const showPageLoading = useDelayedLoading(semestersQuery.isLoading || enrollmentsQuery.isLoading, 1000);

  const handleCreate = async (data: CreateEnrollmentDto) => {
    try {
      await createMutation.mutateAsync(data);
      closeForm();
    } catch {
      // Hooks already surface a toast on error; keep modal open.
    }
  };

  const handleBulk = async (rows: CreateEnrollmentDto[]) => {
    try {
      await bulkMutation.mutateAsync(rows);
      closeBulk();
    } catch {
      // Hooks already surface a toast on error; keep modal open.
    }
  };

  const confirmDelete = () => {
    if (!deleting?.id) return;
    deleteMutation.mutate(deleting.id, { onSuccess: closeDelete });
  };

  const selectedDepartmentLabel = departmentOptions.find((option) => option.value === selectedDepartmentId)?.label ?? selectedDepartmentId;
  const selectedOfferingLabel = courseOfferingOptions.find((option) => option.value === selectedCourseOfferingId)?.label ?? selectedCourseOfferingId;
  const selectedStudentLabel = studentOptions.find((option) => option.value === selectedStudentId)?.label ?? selectedStudentId;
  const activeFilterBadges = [
    ...(deferredSearch ? [{ key: "search", label: "Search", value: deferredSearch, onRemove: () => setSearchTerm("") }] : []),
    ...(selectedDepartmentId ? [{ key: "department", label: "Department", value: selectedDepartmentLabel, onRemove: () => setFilterParam("departmentId", "") }] : []),
    ...(selectedCourseOfferingId ? [{ key: "offering", label: "Course Offering", value: selectedOfferingLabel, onRemove: () => setFilterParam("courseOfferingId", "") }] : []),
    ...(selectedStudentId ? [{ key: "student", label: "Student", value: selectedStudentLabel, onRemove: () => setFilterParam("studentId", "") }] : []),
  ];
  const activeFilterCount = activeFilterBadges.length;

  if (showPageLoading) {
    return (
      <div className="p-6">
        <PageSpinner label="Loading enrollments" />
      </div>
    );
  }

  if (enrollmentsQuery.isError) {
    return (
      <div className="p-6">
        <Card className="space-y-3 p-6">
          <p className="text-sm text-red-600">
            {getApiErrorMessage(enrollmentsQuery.error, "Failed to load enrollments.")}
          </p>
          <Button onClick={handleRefresh}>Retry</Button>
        </Card>
      </div>
    );
  }

  const submitErrorMessage = createMutation.isError
    ? getApiErrorMessage(createMutation.error, "Failed to create enrollment.")
    : undefined;

  const importErrorMessage = bulkMutation.isError
    ? getApiErrorMessage(bulkMutation.error, "Bulk import failed.")
    : undefined;

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 space-y-1">
        <div className="flex items-center gap-3">
          <div className="rounded-none bg-zinc-950 p-2.5 text-white shadow-sm">
            <ClipboardList className="size-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
              Enrollments
            </h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              Manage student–course offering registrations across all programs and semesters.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <StickyActionBar className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          onClick={() => setIsFormOpen(true)}
          disabled={isPageLoading || createMutation.isPending}
          className="inline-flex h-10 items-center gap-2 rounded-none border border-zinc-950 bg-zinc-950 font-semibold text-white shadow-sm transition-all hover:bg-zinc-900 active:scale-95"
        >
          <Plus className="size-4" />
          Add Enrollment
        </Button>
        <Button
          variant="outline"
          onClick={() => setIsBulkOpen(true)}
          disabled={isPageLoading || bulkMutation.isPending}
          className="inline-flex h-10 items-center gap-2 rounded-none border-zinc-200 font-semibold text-zinc-950 transition-all hover:bg-zinc-50 active:scale-95"
        >
          <Upload className="size-4" />
          Bulk Import (CSV)
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
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search selected semester by student, ID, email, course…"
              className="h-10 rounded-none border-zinc-200 bg-transparent pl-10 text-sm shadow-none transition-colors hover:bg-zinc-50 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-zinc-300 group-data-[stuck=true]:bg-white/70 dark:border-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:bg-zinc-900/70 dark:focus-visible:bg-zinc-950 dark:focus-visible:ring-zinc-700 dark:group-data-[stuck=true]:bg-zinc-950/70"
            />
          </div>
        </div>
      </StickyActionBar>

      {/* Metrics */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Total Enrollments
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-950">{totalEnrollments}</p>
                <p className="mt-2 text-xs text-zinc-500">All registrations</p>
              </div>
              <div className="rounded-none bg-blue-50 p-2">
                <ClipboardList className="size-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Active
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-950">{activeEnrollments}</p>
                <p className="mt-2 text-xs text-zinc-500">Status = ACTIVE</p>
              </div>
              <div className="rounded-none bg-emerald-50 p-2">
                <Users className="size-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Unique Students
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-950">{uniqueStudents}</p>
                <p className="mt-2 text-xs text-zinc-500">Distinct enrollees</p>
              </div>
              <div className="rounded-none bg-violet-50 p-2">
                <GraduationCap className="size-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Offerings In Use
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-950">{uniqueOfferings}</p>
                <p className="mt-2 text-xs text-zinc-500">Distinct course offerings</p>
              </div>
              <div className="rounded-none bg-amber-50 p-2">
                <Layers className="size-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="mb-8">
        <div className="mb-4 space-y-4 rounded-none border border-zinc-200/70 bg-linear-to-r from-white via-zinc-50/70 to-zinc-100/60 px-4 py-4 shadow-sm sm:px-5 dark:border-zinc-800/80 dark:from-zinc-950 dark:via-zinc-950/90 dark:to-zinc-900/80 dark:shadow-black/20">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                <SlidersHorizontal className="size-3.5" />
                Table Filter
              </div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Showing {totalEnrollments} enrollment{totalEnrollments === 1 ? "" : "s"} for {selectedSemester?.name ?? "all semesters"}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Choose a semester to narrow the table, or keep all semesters to search across every term.
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

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="min-w-0 space-y-1.5">
            <label
              htmlFor="enrollments-semester-filter"
              className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400"
            >
              Semester
            </label>
            <Select
              value={selectedSemesterId || ALL_SEMESTERS}
              onValueChange={(value) => {
                if (value === ALL_SEMESTERS) {
                  setFilters({ semesterId: '', departmentId: '', courseOfferingId: '', studentId: '' });
                } else {
                  setFilters({ semesterId: value, departmentId: '', courseOfferingId: '', studentId: '' });
                }
              }}
            >
              <SelectTrigger
                id="enrollments-semester-filter"
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

            <EnrollmentSearchFilter
              label="Department"
              value={selectedDepartmentId}
              placeholder="All departments"
              searchPlaceholder="Search departments"
              options={departmentOptions}
              isLoading={filterOptionsQuery.isLoading}
              onChange={(value) => setFilterParam("departmentId", value)}
            />
            <EnrollmentSearchFilter
              label="Course Offering"
              value={selectedCourseOfferingId}
              placeholder="All course offerings"
              searchPlaceholder="Search offerings by course, code, section"
              options={courseOfferingOptions}
              isLoading={filterOptionsQuery.isLoading}
              onChange={(value) => setFilterParam("courseOfferingId", value)}
            />
            <EnrollmentSearchFilter
              label="Student"
              value={selectedStudentId}
              placeholder="All students"
              searchPlaceholder="Search students by name, ID, email"
              options={studentOptions}
              isLoading={filterOptionsQuery.isLoading}
              onChange={(value) => setFilterParam("studentId", value)}
            />
          </div>

          <ActiveFilterBadges badges={activeFilterBadges} onClearAll={clearAdvancedFilters} />
        </div>

        <BulkDeleteToolbar selectedCount={bulkDelete.selectedCount} totalCount={enrollments.length} isDeleting={bulkDelete.isDeleting || deleteMutation.isPending} onClear={bulkDelete.clearSelection} onDelete={() => bulkDelete.setIsConfirmOpen(true)} />
        <EnrollmentList
          enrollments={enrollments}
          isLoading={showTableLoading}
          isDeleting={deleteMutation.isPending || bulkDelete.isDeleting}
          search={searchTerm}
          selectedIds={bulkDelete.selectedIds}
          onToggleSelected={bulkDelete.toggleSelected}
          onToggleAll={(checked) => bulkDelete.toggleAll(enrollments, checked)}
          onCreate={() => setIsFormOpen(true)}
          onDelete={setDeleting}
          highlightedEnrollmentId={highlightedEnrollmentId}
          pagination={{
            page: currentPage,
            pageCount: totalPages,
            pageSize: PAGE_SIZE,
            totalCount: totalEnrollments,
            onPageChange: setPage,
          }}
        />
      </div>

      {/* Add modal */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => (open ? setIsFormOpen(true) : closeForm())}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Enrollment</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <EnrollmentForm
              existingEnrollments={enrollments}
              submitErrorMessage={submitErrorMessage}
              isLoading={createMutation.isPending}
              onSubmit={handleCreate}
              onCancel={closeForm}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk import modal */}
      <Dialog
        open={isBulkOpen}
        onOpenChange={(open) => (open ? setIsBulkOpen(true) : closeBulk())}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Bulk Import Enrollments</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <EnrollmentBulkImport
              students={students}
              offerings={offerings}
              existingEnrollments={enrollments}
              isImporting={bulkMutation.isPending}
              importErrorMessage={importErrorMessage}
              onImport={handleBulk}
              onClose={closeBulk}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <DeleteConfirmModal
        open={Boolean(deleting)}
        title="Remove Enrollment"
        description={
          deleting
            ? `Remove ${deleting.student?.fullName ?? deleting.student?.user?.name ?? "this student"} from ${
              deleting.courseOffering?.course?.title ?? deleting.courseOffering?.course?.name ?? "this offering"
              }?`
            : "This action cannot be undone."
        }
        confirmLabel="Remove Enrollment"
        isLoading={deleteMutation.isPending}
        errorMessage={
          deleteMutation.isError
            ? getApiErrorMessage(deleteMutation.error, "Failed to remove enrollment.")
            : undefined
        }
        onCancel={closeDelete}
        onConfirm={confirmDelete}
      />

      <DeleteConfirmModal
        open={bulkDelete.isConfirmOpen}
        title="Remove Selected Enrollments"
        description={`This will permanently remove ${bulkDelete.selectedCount} selected enrollment${bulkDelete.selectedCount === 1 ? "" : "s"}.`}
        confirmLabel="Bulk Delete"
        isLoading={bulkDelete.isDeleting}
        onCancel={() => bulkDelete.setIsConfirmOpen(false)}
        onConfirm={bulkDelete.confirmDelete}
      />
    </div>
  );
}
