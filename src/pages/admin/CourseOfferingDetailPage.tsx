import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpenText,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  GraduationCap,
  Hash,
  Home,
  Layers,
  ShieldCheck,
  UserCircle2,
  Users,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { PageSpinner } from "../../components/shared/PageSpinner";
import { EmptyState } from "../../components/shared/EmptyState";
import { getApiErrorMessage } from "../../lib/apiError";
import { useDelayedLoading } from "../../hooks/common/useDelayedLoading";
import { useCourseOffering } from "../../hooks/courseOfferings/useCourseOfferings";
import { cn } from "../../lib/utils";
import type { CourseOfferingDetail, OfferingStatus } from "../../schemas/courseOffering";

const statusBadge = (status?: OfferingStatus | string) => {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "INACTIVE":
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
  }
};

export function CourseOfferingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: offering, isLoading, isError, error } = useCourseOffering(id);
  const showPageLoading = useDelayedLoading(isLoading, 1000);

  if (showPageLoading) {
    return (
      <div className="p-6">
        <PageSpinner label="Loading offering" />
      </div>
    );
  }

  if (isError || !offering) {
    return (
      <div className="p-6">
        <Card className="rounded-none border border-red-200 bg-red-50 text-red-900">
          <CardContent className="space-y-4 p-6">
            <p className="text-sm">
              {getApiErrorMessage(error, "Failed to load course offering.")}
            </p>
            <Button onClick={() => navigate("/course-offerings")}>Back to Offerings</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const registrations: CourseOfferingDetail["registrations"] = offering.registrations ?? [];
  const exams: CourseOfferingDetail["exams"] = offering.exams ?? [];
  const totalEnrollments = registrations.length;
  const totalExams = exams.length;
  const hasAssignments = exams.some((exam) => exam.assignments.length > 0);
  const hasConflicts = (offering.conflictsCount ?? 0) > 0;

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigate("/course-offerings")}
          className="inline-flex h-9 items-center gap-2 rounded-none border-zinc-200 text-sm font-semibold text-zinc-950 hover:bg-zinc-50"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <span
          className={cn(
            "inline-flex items-center rounded-none border px-3 py-1 text-xs font-bold uppercase tracking-wide",
            statusBadge(offering.status)
          )}
        >
          {offering.status ?? "ACTIVE"}
        </span>
      </div>

      {/* Hero */}
      <Card className="mb-6 overflow-hidden rounded-none border border-zinc-200/80 bg-white/90 shadow-lg shadow-zinc-200/40">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-none bg-zinc-950 p-3 text-white shadow-sm">
              <Layers className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                Course Offering
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
                {offering.course?.title ?? offering.course?.name ?? "Untitled course"}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-600">
                <span className="inline-flex items-center gap-1.5 rounded-none bg-zinc-100 px-2 py-1 text-xs font-bold uppercase tracking-wide text-zinc-700">
                  <Hash className="size-3" />
                  {offering.course?.code ?? "—"}
                </span>
                {offering.section && (
                  <span className="inline-flex items-center gap-1.5 rounded-none bg-zinc-100 px-2 py-1 text-xs font-bold uppercase tracking-wide text-zinc-700">
                    Section {offering.section}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 text-zinc-400" />
                  {offering.semester?.name ?? "Semester unset"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <GraduationCap className="size-3.5 text-zinc-400" />
                  {offering.program?.name ?? offering.course?.program?.name ?? "Unassigned program"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary metrics */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Credits
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-950">
                  {offering.course?.credits ?? "—"}
                </p>
              </div>
              <div className="rounded-none bg-blue-50 p-2">
                <BookOpenText className="size-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Enrolled
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-950">{totalEnrollments}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {offering.capacity ? `Capacity ${offering.capacity}` : "Capacity not set"}
                </p>
              </div>
              <div className="rounded-none bg-violet-50 p-2">
                <Users className="size-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Exams
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-950">{totalExams}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {hasAssignments ? "Assignments scheduled" : "Awaiting assignment"}
                </p>
              </div>
              <div className="rounded-none bg-amber-50 p-2">
                <ClipboardList className="size-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-zinc-200/60 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Conflicts
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-950">
                  {hasConflicts ? "!" : "OK"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {hasConflicts ? "Review schedule conflicts" : "No conflicts detected"}
                </p>
              </div>
              <div
                className={cn(
                  "rounded-none p-2",
                  hasConflicts ? "bg-red-50" : "bg-emerald-50"
                )}
              >
                {hasConflicts ? (
                  <AlertTriangle className="size-5 text-red-600" />
                ) : (
                  <ShieldCheck className="size-5 text-emerald-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 1. Course info */}
        <Card className="rounded-none border border-zinc-200/80 bg-white shadow-sm lg:col-span-1">
          <CardContent className="space-y-5 p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">
                Course Info
              </p>
              <h2 className="mt-1 text-lg font-semibold text-zinc-950">Catalog details</h2>
            </div>

            <div className="space-y-3 text-sm text-zinc-700">
              <div className="flex items-start gap-3">
                <BookOpenText className="mt-0.5 size-4 shrink-0 text-zinc-500" />
                <div>
                  <p className="font-semibold text-zinc-950">
                    {offering.course?.title ?? offering.course?.name ?? "—"}
                  </p>
                  <p className="text-xs text-zinc-500">{offering.course?.code ?? "—"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Hash className="mt-0.5 size-4 shrink-0 text-zinc-500" />
                <div>
                  <p className="font-semibold text-zinc-950">
                    {offering.course?.credits ?? "—"} credits
                  </p>
                  <p className="text-xs text-zinc-500">Course weight</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <GraduationCap className="mt-0.5 size-4 shrink-0 text-zinc-500" />
                <div>
                  <p className="font-semibold text-zinc-950">
                    {offering.program?.name ?? offering.course?.program?.name ?? "Unassigned"}
                  </p>
                  <p className="text-xs text-zinc-500">Owning program</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-zinc-500" />
                <div>
                  <p className="font-semibold text-zinc-950">
                    {offering.semester?.name ?? "—"}
                  </p>
                  <p className="text-xs text-zinc-500">Semester</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <UserCircle2 className="mt-0.5 size-4 shrink-0 text-zinc-500" />
                <div>
                  <p className="font-semibold text-zinc-950">
                    {offering.instructor ?? "Unassigned"}
                  </p>
                  <p className="text-xs text-zinc-500">Instructor</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 size-4 shrink-0 text-zinc-500" />
                <div>
                  <p className="font-semibold text-zinc-950">
                    {[offering.day, offering.time].filter(Boolean).join(" · ") || "Not scheduled"}
                  </p>
                  <p className="text-xs text-zinc-500">Weekly meeting</p>
                </div>
              </div>

              {offering.roomLabel && (
                <div className="flex items-start gap-3">
                  <Home className="mt-0.5 size-4 shrink-0 text-zinc-500" />
                  <div>
                    <p className="font-semibold text-zinc-950">{offering.roomLabel}</p>
                    <p className="text-xs text-zinc-500">Default room label</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2. Enrolled students */}
        <Card className="rounded-none border border-zinc-200/80 bg-white shadow-sm lg:col-span-2">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">
                  Enrolled Students
                </p>
                <h2 className="mt-1 text-lg font-semibold text-zinc-950">
                  Roster ({totalEnrollments})
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-none bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                <Users className="size-3.5" />
                {totalEnrollments}
              </span>
            </div>

            {totalEnrollments === 0 ? (
              <EmptyState
                icon={Users}
                title="No students enrolled yet"
                description="When students register for this offering they will appear here with their program."
              />
            ) : (
              <div className="max-h-90 divide-y divide-zinc-200/60 overflow-y-auto">
                {registrations.map((student, index) => (
                  <div
                    key={student.id ?? `${student.universityId ?? "student"}-${index}`}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-950">
                        {student.name}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {student.email ?? "No email"} · {student.programName ?? "Unassigned program"}
                      </p>
                    </div>
                    {student.universityId && (
                      <span className="rounded-none bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700">
                        {student.universityId}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. Assigned exams */}
        <Card className="rounded-none border border-zinc-200/80 bg-white shadow-sm lg:col-span-2">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">
                  Assigned Exams
                </p>
                <h2 className="mt-1 text-lg font-semibold text-zinc-950">
                  Exam coverage ({totalExams})
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-none bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                <ClipboardList className="size-3.5" />
                {totalExams}
              </span>
            </div>

            {totalExams === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No exams scheduled"
                description="Once exams are created for this offering they will appear here with rooms, supervisors, and time slots."
              />
            ) : (
              <div className="space-y-4">
                {exams.map((exam) => (
                  <div
                    key={exam.id}
                    className="rounded-none border border-zinc-200/80 bg-zinc-50/40 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-zinc-950">
                          {exam.examDate
                            ? new Date(exam.examDate).toLocaleDateString()
                            : "Date TBD"}
                        </p>
                        <p className="text-xs text-zinc-500">
                          Duration: {exam.duration ? `${exam.duration} min` : "—"}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-none border px-2.5 py-1 text-xs font-bold uppercase tracking-wide",
                          statusBadge(exam.status)
                        )}
                      >
                        {exam.status ?? "PENDING"}
                      </span>
                    </div>

                    {exam.assignments.length === 0 ? (
                      <p className="mt-3 text-xs text-zinc-500">
                        No room/supervisor assignment yet.
                      </p>
                    ) : (
                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {exam.assignments.map((assignment, index) => (
                          <div
                            key={assignment.id ?? index}
                            className="rounded-none border border-zinc-200/80 bg-white p-3 text-xs text-zinc-700"
                          >
                            <p className="flex items-center gap-1.5 font-semibold text-zinc-950">
                              <Home className="size-3.5 text-zinc-500" />
                              {assignment.roomName ?? "Room TBD"}
                            </p>
                            <p className="mt-1 flex items-center gap-1.5">
                              <UserCircle2 className="size-3.5 text-zinc-500" />
                              {assignment.supervisorName ?? "Supervisor TBD"}
                            </p>
                            <p className="mt-1 flex items-center gap-1.5">
                              <Clock className="size-3.5 text-zinc-500" />
                              {assignment.timeSlotLabel || "Time slot TBD"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 4. Conflict status */}
        <Card className="rounded-none border border-zinc-200/80 bg-white shadow-sm lg:col-span-1">
          <CardContent className="space-y-4 p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">
                Conflict Status
              </p>
              <h2 className="mt-1 text-lg font-semibold text-zinc-950">Schedule health</h2>
            </div>

            <div
              className={cn(
                "flex items-center gap-3 rounded-none border p-4",
                hasConflicts
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              )}
            >
              {hasConflicts ? (
                <AlertTriangle className="size-5 shrink-0" />
              ) : (
                <CheckCircle2 className="size-5 shrink-0" />
              )}
              <div>
                <p className="text-sm font-bold uppercase tracking-wide">
                  {hasConflicts ? "Has Conflicts" : "OK"}
                </p>
                <p className="text-xs opacity-80">
                  {hasConflicts
                    ? "Review the conflicts module to resolve overlaps."
                    : "No overlapping schedules detected for this offering."}
                </p>
              </div>
            </div>

            {offering.notes && (
              <div className="rounded-none border border-zinc-200/80 bg-zinc-50/60 p-4 text-sm text-zinc-700">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Notes
                </p>
                <p className="mt-1">{offering.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
