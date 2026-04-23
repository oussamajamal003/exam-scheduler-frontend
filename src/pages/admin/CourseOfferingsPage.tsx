import { useDeferredValue, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layers,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { useToast } from "../../components/ui/toast";
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
import { CourseOfferingList } from "../../features/courseOfferings/CourseOfferingList";
import { CourseOfferingForm } from "../../forms/courseOfferings/CourseOfferingForm";
import { DeleteConfirmModal } from "../../components/shared/DeleteConfirmModal";
import { getApiErrorMessage, getApiValidationMessages } from "../../lib/apiError";
import {
  useCoursesForOfferings,
  useCourseOfferings,
  useCreateCourseOffering,
  useDeleteCourseOffering,
  useUpdateCourseOffering,
} from "../../hooks/courseOfferings/useCourseOfferings";
import { useSemesters } from "../../hooks/semesters/useSemesters";
import { useQueryClient } from "@tanstack/react-query";
import type {
  CourseOffering,
  CreateCourseOfferingDto,
} from "../../schemas/courseOffering";

export function CourseOfferingsPage() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm.trim());

  const offeringsQuery = useCourseOfferings(deferredSearchTerm);
  const coursesQuery = useCoursesForOfferings();
  const semestersQuery = useSemesters();

  const offerings = useMemo(() => offeringsQuery.data ?? [], [offeringsQuery.data]);
  const courses = useMemo(() => coursesQuery.data ?? [], [coursesQuery.data]);
  const semesters = useMemo(() => semestersQuery.data ?? [], [semestersQuery.data]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOffering, setEditingOffering] = useState<CourseOffering | null>(null);
  const [deletingOffering, setDeletingOffering] = useState<CourseOffering | null>(null);

  const createMutation = useCreateCourseOffering();
  const updateMutation = useUpdateCourseOffering();
  const deleteMutation = useDeleteCourseOffering();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const filteredOfferings = useMemo(() => {
    if (!deferredSearchTerm) return offerings;
    const needle = deferredSearchTerm.toLowerCase();
    return offerings.filter((offering) => {
      const haystack = [
        offering.course?.title,
        offering.course?.code,
        offering.instructor,
        offering.course?.program?.name,
        offering.semester?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [offerings, deferredSearchTerm]);

  const getRegistrationCount = (offering: CourseOffering) => {
    return (
      (offering as CourseOffering & { registrations?: Array<unknown> }).registrations?.length ??
      offering.registrationsCount ??
      0
    );
  };

  const totalOfferings = offerings.length;
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

  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["course-offerings"] }),
      queryClient.invalidateQueries({ queryKey: ["courses"] }),
      queryClient.invalidateQueries({ queryKey: ["semesters"] }),
    ]);
    addToast({ type: "success", title: "Refreshed", description: "Course offering data has been refreshed." });
  };

  const isFetching = offeringsQuery.isFetching || coursesQuery.isFetching || semestersQuery.isFetching;

  const handleSubmit = async (data: CreateCourseOfferingDto) => {
    if (editingOffering?.id) {
      await updateMutation.mutateAsync({ id: editingOffering.id, data });
      closeFormModal();
      return;
    }
    await createMutation.mutateAsync(data);
    closeFormModal();
  };

  const confirmDelete = () => {
    if (!deletingOffering?.id) return;
    deleteMutation.mutate(deletingOffering.id, {
      onSuccess: closeDeleteModal,
    });
  };

  const isPageError = offeringsQuery.isError;
  const pageErrorMessage = getApiErrorMessage(
    offeringsQuery.error,
    "Failed to load course offerings."
  );

  const coursesErrorMessage = getApiErrorMessage(
    coursesQuery.error,
    "Failed to load courses for the offering form."
  );

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
    ? getApiValidationMessages(submitMutation.error)
    : [];

  if (offeringsQuery.isLoading) {
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
    <div className="min-h-screen bg-linear-to-br from-zinc-50 via-white to-zinc-50/50 p-4 sm:p-6 lg:p-8">
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
      <div className="mb-8 flex gap-3">
        <Button
          onClick={openCreateModal}
          className="inline-flex h-10 items-center gap-2 rounded-none bg-zinc-950 font-semibold text-white shadow-sm transition-all hover:bg-zinc-900 active:scale-95"
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
      </div>

      {/* Search */}
      <div className="mb-8 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Filter by course, instructor, semester…"
            className="h-10 rounded-none border-zinc-200 bg-white/50 pl-10 text-sm shadow-none transition-colors hover:bg-zinc-50 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-zinc-300"
          />
        </div>
      </div>

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
                <p className="mt-2 text-xs text-zinc-500">Across all semesters</p>
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
                <p className="mt-2 text-xs text-zinc-500">Across all offerings</p>
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
              Real-time sync enabled. Course offerings pull relational course, semester, registration, and exam assignment data directly from the API layer.
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
        <CourseOfferingList
          offerings={filteredOfferings}
          isLoading={offeringsQuery.isLoading}
          isDeleting={deleteMutation.isPending}
          onCreateOffering={openCreateModal}
          onEditOffering={openEditModal}
          onViewOffering={handleViewDetails}
          onDeleteOffering={setDeletingOffering}
        />
      </div>

      <DeleteConfirmModal
        open={Boolean(deletingOffering)}
        title="Delete Course Offering"
        description={
          deletingOffering
            ? `This will permanently delete the offering for ${
                deletingOffering.course?.title ?? "this course"
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

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => (open ? setIsFormOpen(true) : closeFormModal())}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingOffering ? "Edit Course Offering" : "Add Course Offering"}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <CourseOfferingForm
              key={editingOffering?.id ?? "new-offering"}
              initialData={editingOffering ?? undefined}
              courses={courses}
              semesters={semesters}
              isCoursesLoading={coursesQuery.isLoading}
              isSemestersLoading={semestersQuery.isLoading}
              coursesErrorMessage={coursesQuery.isError ? coursesErrorMessage : undefined}
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
