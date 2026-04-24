import { useDeferredValue, useMemo, useState } from "react";
import {
  ClipboardList,
  GraduationCap,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Upload,
  Users,
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
import { PageSpinner } from "../../components/shared/PageSpinner";
import { DeleteConfirmModal } from "../../components/shared/DeleteConfirmModal";
import { StickyActionBar } from "../../components/common/StickyActionBar";
import { EnrollmentList } from "../../features/enrollments/EnrollmentList";
import { EnrollmentBulkImport } from "../../features/enrollments/EnrollmentBulkImport";
import { EnrollmentForm } from "../../forms/enrollments/EnrollmentForm";
import { getApiErrorMessage } from "../../lib/apiError";
import {
  useBulkImportEnrollments,
  useCreateEnrollment,
  useDeleteEnrollment,
  useEnrollments,
} from "../../hooks/enrollments/useEnrollments";
import { useStudents } from "../../hooks/students/useStudents";
import { useCourseOfferings } from "../../hooks/courseOfferings/useCourseOfferings";
import { useDelayedLoading } from "../../hooks/common/useDelayedLoading";
import type { CreateEnrollmentDto, Enrollment } from "../../schemas/enrollment";

export function EnrollmentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearch = useDeferredValue(searchTerm.trim());

  const enrollmentsQuery = useEnrollments();
  const studentsQuery = useStudents();
  const offeringsQuery = useCourseOfferings();

  const enrollments = useMemo(
    () => enrollmentsQuery.data ?? [],
    [enrollmentsQuery.data]
  );
  const students = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data]);
  const offerings = useMemo(() => offeringsQuery.data ?? [], [offeringsQuery.data]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [deleting, setDeleting] = useState<Enrollment | null>(null);

  const createMutation = useCreateEnrollment();
  const deleteMutation = useDeleteEnrollment();
  const bulkMutation = useBulkImportEnrollments();

  const isPageLoading =
    enrollmentsQuery.isLoading || studentsQuery.isLoading || offeringsQuery.isLoading;

  const filtered = useMemo(() => {
    if (!deferredSearch) return enrollments;
    const needle = deferredSearch.toLowerCase();
    return enrollments.filter((e) => {
      const haystack = [
        e.student?.fullName,
        e.student?.user?.name,
        e.student?.user?.email,
        e.student?.universityId,
        e.courseOffering?.course?.name,
        e.courseOffering?.course?.title,
        e.courseOffering?.course?.code,
        e.program?.name,
        e.courseOffering?.program?.name,
        e.courseOffering?.course?.program?.name,
        e.semester?.name,
        e.courseOffering?.semester?.name,
        e.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [enrollments, deferredSearch]);

  // Metrics
  const totalEnrollments = enrollments.length;
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
    enrollmentsQuery.refetch();
  };

  const isFetching = enrollmentsQuery.isFetching || studentsQuery.isFetching || offeringsQuery.isFetching;
  const isSearching = searchTerm.trim() !== deferredSearch;
  const isTableLoading = isSearching || isFetching || createMutation.isPending || deleteMutation.isPending || bulkMutation.isPending;
  const showTableLoading = useDelayedLoading(isTableLoading);
  const showPageLoading = useDelayedLoading(enrollmentsQuery.isLoading, 1000);

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
          className="inline-flex h-10 items-center gap-2 rounded-none border border-zinc-200 bg-transparent font-semibold text-zinc-950 shadow-none transition-all hover:bg-zinc-50 active:scale-95 group-data-[stuck=true]:border-zinc-950 group-data-[stuck=true]:bg-zinc-950 group-data-[stuck=true]:text-white group-data-[stuck=true]:shadow-sm group-data-[stuck=true]:hover:bg-zinc-900"
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
              placeholder="Filter by student, course, program, semester…"
              className="h-10 rounded-none border-zinc-200 bg-transparent pl-10 text-sm shadow-none transition-colors hover:bg-zinc-50 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-zinc-300 group-data-[stuck=true]:bg-white/50"
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
        <EnrollmentList
          enrollments={filtered}
          isLoading={showTableLoading}
          isDeleting={deleteMutation.isPending}
          search={searchTerm}
          onCreate={() => setIsFormOpen(true)}
          onDelete={setDeleting}
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
              students={students}
              offerings={offerings}
              existingEnrollments={enrollments}
              isStudentsLoading={studentsQuery.isLoading}
              isOfferingsLoading={offeringsQuery.isLoading}
              studentsErrorMessage={
                studentsQuery.isError
                  ? getApiErrorMessage(studentsQuery.error, "Failed to load students.")
                  : undefined
              }
              offeringsErrorMessage={
                offeringsQuery.isError
                  ? getApiErrorMessage(offeringsQuery.error, "Failed to load offerings.")
                  : undefined
              }
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
    </div>
  );
}
