import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BookOpenText,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  Gauge,
  GraduationCap,
  Hash,
  Home,
  Layers,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserCircle2,
  Users,
} from "lucide-react";
import { RealBarChart, type ChartDatum } from "../../components/dashboard/RealBarChart";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { PageSpinner } from "../../components/shared/PageSpinner";
import { EmptyState } from "../../components/shared/EmptyState";
import { getApiErrorMessage } from "../../lib/apiError";
import { formatUtcDate } from "../../lib/dateTime";
import { useDelayedLoading } from "../../hooks/common/useDelayedLoading";
import { useCourseOffering } from "../../hooks/courseOfferings/useCourseOfferings";
import { useDetailListPagination } from "../../hooks/common/useDetailListPagination";
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

const statusDot = (status?: string) => {
  switch (status) {
    case "SCHEDULED":
    case "COMPLETED":
      return "bg-emerald-500";
    case "IN_PROGRESS":
      return "bg-blue-500";
    case "CANCELLED":
      return "bg-red-500";
    case "DRAFT":
    default:
      return "bg-amber-500";
  }
};

const coverageWidthClass = (percent: number) => {
  if (percent >= 95) return "w-full";
  if (percent >= 80) return "w-4/5";
  if (percent >= 66) return "w-2/3";
  if (percent >= 50) return "w-1/2";
  if (percent >= 33) return "w-1/3";
  if (percent >= 20) return "w-1/5";
  if (percent > 0) return "w-[8%]";
  return "w-0";
};

const toPercent = (value: number, total: number) => {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
};

const shortDate = (value?: string | null) => formatUtcDate(value ?? null, "Date TBD");

const getExamPrimaryDate = (exam: CourseOfferingDetail["exams"][number]) =>
  exam.assignments[0]?.timeSlotStart ?? exam.assignments[0]?.timeSlotDate ?? exam.examDate ?? null;

const chartFromCounts = (counts: Map<string, number>): ChartDatum[] =>
  Array.from(counts.entries()).map(([name, value]) => ({ name, value }));

type ExamPlacementGroup = {
  key: string;
  roomName: string;
  timeLabel: string;
  scheduleName?: string;
  proctorNames: string[];
};

const groupExamPlacements = (exam: CourseOfferingDetail["exams"][number]): ExamPlacementGroup[] => {
  const groups = new Map<string, ExamPlacementGroup>();

  exam.assignments.forEach((assignment, index) => {
    const roomName = assignment.roomName ?? "Room TBD";
    const timeLabel = assignment.timeSlotLabel || shortDate(assignment.timeSlotStart ?? assignment.timeSlotDate);
    const scheduleName = assignment.scheduleName;
    const key = [roomName, timeLabel, scheduleName ?? "schedule-tbd"].join("::");
    const group = groups.get(key) ?? {
      key: assignment.id ?? `${exam.id}-${index}`,
      roomName,
      timeLabel,
      scheduleName,
      proctorNames: [],
    };
    const proctorName = assignment.proctorName ?? "Proctor TBD";
    if (!group.proctorNames.includes(proctorName)) {
      group.proctorNames.push(proctorName);
    }
    groups.set(key, group);
  });

  return Array.from(groups.values());
};

export function CourseOfferingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: offering, isLoading, isError, error } = useCourseOffering(id);
  const showPageLoading = useDelayedLoading(isLoading, 1000);
  const registrations: CourseOfferingDetail["registrations"] = offering?.registrations ?? [];
  const exams: CourseOfferingDetail["exams"] = offering?.exams ?? [];
  const totalEnrollments = registrations.length;
  const totalExams = exams.length;
  const assignedExamCount = exams.filter((exam) => exam.assignments.length > 0).length;
  const unassignedExamCount = totalExams - assignedExamCount;
  const scheduledExamCount = exams.filter((exam) => exam.status === "SCHEDULED" || exam.assignments.length > 0).length;
  const coveragePercent = toPercent(assignedExamCount, totalExams);
  const scheduledPercent = toPercent(scheduledExamCount, totalExams);
  const assignmentCount = exams.reduce((sum, exam) => sum + exam.assignments.length, 0);
  const placementCount = exams.reduce((sum, exam) => sum + groupExamPlacements(exam).length, 0);
  const seatCoveragePercent = toPercent(assignedExamCount > 0 ? totalEnrollments : 0, totalEnrollments);
  const statusCounts = new Map<string, number>();
  const durationCounts = new Map<string, number>();
  const roomCounts = new Map<string, number>();
  const proctorCounts = new Map<string, number>();

  exams.forEach((exam) => {
    const status = exam.status ?? (exam.assignments.length > 0 ? "SCHEDULED" : "DRAFT");
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);

    const durationLabel = exam.duration ? `${exam.duration} min` : "Unset";
    durationCounts.set(durationLabel, (durationCounts.get(durationLabel) ?? 0) + 1);

    groupExamPlacements(exam).forEach((placement) => {
      roomCounts.set(placement.roomName, (roomCounts.get(placement.roomName) ?? 0) + 1);
      placement.proctorNames.forEach((proctorName) => {
        proctorCounts.set(proctorName, (proctorCounts.get(proctorName) ?? 0) + 1);
      });
    });
  });

  const examStatusChartData = chartFromCounts(statusCounts);
  const examDurationChartData = chartFromCounts(durationCounts);
  const roomChartData = chartFromCounts(roomCounts).slice(0, 5);
  const proctorChartData = chartFromCounts(proctorCounts).slice(0, 5);
  const hasAssignments = exams.some((exam) => exam.assignments.length > 0);
  const isReadyForScheduling = totalEnrollments > 0;
  const registrationsPagination = useDetailListPagination(registrations, {
    pageSize: 20,
    threshold: 20,
  });
  const examsPagination = useDetailListPagination(exams, {
    pageSize: 8,
    threshold: 8,
  });

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
                  Scheduling Readiness
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-950">
                  {isReadyForScheduling ? "Ready" : "Needs Data"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {isReadyForScheduling ? "Eligible for hybrid scheduling" : "Add enrollments before scheduling"}
                </p>
              </div>
              <div
                className={cn(
                  "rounded-none p-2",
                  isReadyForScheduling ? "bg-emerald-50" : "bg-amber-50"
                )}
              >
                {isReadyForScheduling ? (
                  <ShieldCheck className="size-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="size-5 text-amber-600" />
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
              <>
                <div className="max-h-90 divide-y divide-zinc-200/60 overflow-y-auto">
                  {registrationsPagination.visibleItems.map((student, index) => (
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
                {registrationsPagination.shouldPaginate && (
                  <div className="flex items-center justify-between gap-3 border border-zinc-200/60 bg-white px-4 py-3 text-xs text-zinc-600">
                    <p>
                      Showing <span className="font-semibold text-zinc-900">{registrationsPagination.start}</span>-<span className="font-semibold text-zinc-900">{registrationsPagination.end}</span> of <span className="font-semibold text-zinc-900">{registrationsPagination.total}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={registrationsPagination.page <= 1}
                        onClick={() => registrationsPagination.setPage(registrationsPagination.page - 1)}
                        className="h-8 rounded-none px-2"
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <span className="font-semibold text-zinc-900">
                        Page {registrationsPagination.page} of {registrationsPagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={registrationsPagination.page >= registrationsPagination.totalPages}
                        onClick={() => registrationsPagination.setPage(registrationsPagination.page + 1)}
                        className="h-8 rounded-none px-2"
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* 3. Assigned exams */}
        <Card className="rounded-none border border-zinc-200/80 bg-white shadow-sm lg:col-span-2">
          <CardContent className="space-y-5 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">
                  Assigned Exams
                </p>
                <h2 className="mt-1 text-lg font-semibold text-zinc-950">
                  Exam coverage ({totalExams})
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Live API data for exam readiness, room assignment, and proctor coverage.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:w-80">
                <div className="border border-zinc-200/80 bg-zinc-50 px-3 py-2 text-center">
                  <p className="text-lg font-bold tabular-nums text-zinc-950">{totalExams}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Total</p>
                </div>
                <div className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-center">
                  <p className="text-lg font-bold tabular-nums text-emerald-700">{assignedExamCount}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Assigned</p>
                </div>
                <div className="border border-amber-200 bg-amber-50 px-3 py-2 text-center">
                  <p className="text-lg font-bold tabular-nums text-amber-700">{unassignedExamCount}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Pending</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="border border-zinc-200/80 bg-zinc-950 p-4 text-white">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/55">Assignment coverage</p>
                    <p className="mt-2 text-3xl font-bold tabular-nums">{coveragePercent}%</p>
                  </div>
                  <Gauge className="size-8 text-emerald-200" />
                </div>
                <div className="mt-4 h-2 overflow-hidden bg-white/15">
                  <div className={cn("h-full bg-emerald-300 transition-all", coverageWidthClass(coveragePercent))} />
                </div>
                <p className="mt-2 text-xs text-white/65">{assignedExamCount} of {totalExams} exams have room/proctor placement across {placementCount} placement{placementCount === 1 ? "" : "s"} and {assignmentCount} proctor assignment{assignmentCount === 1 ? "" : "s"}.</p>
              </div>

              <div className="border border-zinc-200/80 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">Schedule state</p>
                    <p className="mt-2 text-3xl font-bold tabular-nums text-zinc-950">{scheduledPercent}%</p>
                  </div>
                  <CalendarDays className="size-8 text-blue-500" />
                </div>
                <div className="mt-4 h-2 overflow-hidden bg-zinc-100">
                  <div className={cn("h-full bg-blue-500 transition-all", coverageWidthClass(scheduledPercent))} />
                </div>
                <p className="mt-2 text-xs text-zinc-500">{scheduledExamCount} exams are scheduled or have generated assignments.</p>
              </div>

              <div className="border border-zinc-200/80 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">Roster coverage</p>
                    <p className="mt-2 text-3xl font-bold tabular-nums text-zinc-950">{seatCoveragePercent}%</p>
                  </div>
                  <Users className="size-8 text-violet-500" />
                </div>
                <div className="mt-4 h-2 overflow-hidden bg-zinc-100">
                  <div className={cn("h-full bg-violet-500 transition-all", coverageWidthClass(seatCoveragePercent))} />
                </div>
                <p className="mt-2 text-xs text-zinc-500">{totalEnrollments} enrolled students tied to this offering.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <RealBarChart title="Exam Status" data={examStatusChartData} icon={BarChart3} tone="amber" emptyLabel="No exams returned from API" />
              <RealBarChart title="Duration Mix" data={examDurationChartData} icon={Clock} tone="sky" emptyLabel="No durations configured" />
              <RealBarChart title="Rooms Used" data={roomChartData} icon={Building2} tone="emerald" emptyLabel="No room assignments yet" />
              <RealBarChart title="Proctor Load" data={proctorChartData} icon={UserCircle2} tone="violet" emptyLabel="No proctor assignments yet" />
            </div>

            {totalExams === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No exams scheduled"
                description="Once exams are created for this offering they will appear here with rooms, proctors, and time slots."
              />
            ) : (
              <>
              <div className="space-y-3">
                {examsPagination.visibleItems.map((exam, examIndex) => {
                  const hasExamAssignments = exam.assignments.length > 0;
                  const placements = groupExamPlacements(exam);
                  const primaryPlacement = placements[0];
                  const examDate = getExamPrimaryDate(exam);
                  const resolvedStatus = exam.status ?? (hasExamAssignments ? "SCHEDULED" : "DRAFT");
                  return (
                    <div
                      key={exam.id}
                      className={cn(
                        "overflow-hidden border bg-white shadow-sm",
                        hasExamAssignments ? "border-emerald-200" : "border-amber-200"
                      )}
                    >
                      <div className={cn("h-1", hasExamAssignments ? "bg-emerald-500" : "bg-amber-500")} />
                      <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.45fr)]">
                        <div className="min-w-0 space-y-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-3">
                              <div className="flex size-11 shrink-0 items-center justify-center border border-zinc-200 bg-zinc-50 text-sm font-bold tabular-nums text-zinc-950">
                                {examIndex + examsPagination.start}
                              </div>
                              <div className="min-w-0">
                                <p className="flex items-center gap-2 text-sm font-bold text-zinc-950">
                                  <span className={cn("size-2 shrink-0", statusDot(resolvedStatus))} />
                                  {shortDate(examDate)}
                                </p>
                                <p className="mt-1 text-xs text-zinc-500">
                                  Duration: {exam.duration ? `${exam.duration} min` : "Not configured"} · {placements.length} placement{placements.length === 1 ? "" : "s"} · {exam.assignments.length} proctor assignment{exam.assignments.length === 1 ? "" : "s"}
                                </p>
                              </div>
                            </div>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-bold uppercase tracking-wide",
                                statusBadge(resolvedStatus)
                              )}
                            >
                              {resolvedStatus}
                            </span>
                          </div>

                          {hasExamAssignments ? (
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {placements.map((placement) => (
                                <div
                                  key={placement.key}
                                  className="border border-zinc-200/80 bg-zinc-50/70 p-3 text-xs text-zinc-700"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="flex items-center gap-1.5 font-semibold text-zinc-950">
                                        <Home className="size-3.5 text-zinc-500" />
                                        {placement.roomName}
                                      </p>
                                      <p className="mt-1.5 flex items-center gap-1.5">
                                        <Clock className="size-3.5 text-zinc-500" />
                                        {placement.timeLabel}
                                      </p>
                                    </div>
                                    <span className="shrink-0 border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                                      {placement.proctorNames.length} proctor{placement.proctorNames.length === 1 ? "" : "s"}
                                    </span>
                                  </div>
                                  <div className="mt-3 flex flex-wrap gap-1.5">
                                    {placement.proctorNames.map((proctorName) => (
                                      <span key={proctorName} className="inline-flex items-center gap-1.5 border border-violet-200 bg-violet-50 px-2 py-1 text-[11px] font-semibold text-violet-700">
                                        <UserCircle2 className="size-3" />
                                        {proctorName}
                                      </span>
                                    ))}
                                  </div>
                                  {placement.scheduleName && (
                                    <p className="mt-3 flex items-center gap-1.5 border-t border-zinc-200/80 pt-2 text-zinc-500">
                                      <Sparkles className="size-3.5" />
                                      Schedule version: {placement.scheduleName}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                              <p className="font-semibold">No room/proctor assignment yet.</p>
                              <p className="mt-1 text-xs text-amber-700/80">
                                Run the hybrid scheduler or publish a schedule version to attach room, time slot, and proctor data from the API.
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
                          <div className="border border-zinc-200 bg-zinc-50 px-3 py-2">
                            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                              <MapPin className="size-3" /> Room
                            </p>
                            <p className="mt-1 truncate text-sm font-semibold text-zinc-950">{primaryPlacement?.roomName ?? "Pending"}</p>
                          </div>
                          <div className="border border-zinc-200 bg-zinc-50 px-3 py-2">
                            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                              <UserCircle2 className="size-3" /> Proctors
                            </p>
                            <p className="mt-1 truncate text-sm font-semibold text-zinc-950">{primaryPlacement ? primaryPlacement.proctorNames.length : "Pending"}</p>
                          </div>
                          <div className="border border-zinc-200 bg-zinc-50 px-3 py-2">
                            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                              <Clock className="size-3" /> Time
                            </p>
                            <p className="mt-1 truncate text-sm font-semibold text-zinc-950">{primaryPlacement?.timeLabel ?? shortDate(examDate)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {examsPagination.shouldPaginate && (
                <div className="flex items-center justify-between gap-3 border border-zinc-200/60 bg-white px-4 py-3 text-xs text-zinc-600">
                  <p>
                    Showing <span className="font-semibold text-zinc-900">{examsPagination.start}</span>-<span className="font-semibold text-zinc-900">{examsPagination.end}</span> of <span className="font-semibold text-zinc-900">{examsPagination.total}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={examsPagination.page <= 1}
                      onClick={() => examsPagination.setPage(examsPagination.page - 1)}
                      className="h-8 rounded-none px-2"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <span className="font-semibold text-zinc-900">
                      Page {examsPagination.page} of {examsPagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={examsPagination.page >= examsPagination.totalPages}
                      onClick={() => examsPagination.setPage(examsPagination.page + 1)}
                      className="h-8 rounded-none px-2"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
              </>
            )}
          </CardContent>
        </Card>

        {/* 4. Scheduling readiness */}
        <Card className="rounded-none border border-zinc-200/80 bg-white shadow-sm lg:col-span-1">
          <CardContent className="space-y-4 p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">
                Scheduling Readiness
              </p>
              <h2 className="mt-1 text-lg font-semibold text-zinc-950">Offering readiness</h2>
            </div>

            <div
              className={cn(
                "flex items-center gap-3 rounded-none border p-4",
                isReadyForScheduling
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              )}
            >
              {isReadyForScheduling ? (
                <CheckCircle2 className="size-5 shrink-0" />
              ) : (
                <AlertTriangle className="size-5 shrink-0" />
              )}
              <div>
                <p className="text-sm font-bold uppercase tracking-wide">
                  {isReadyForScheduling ? "Ready" : "Blocked"}
                </p>
                <p className="text-xs opacity-80">
                  {isReadyForScheduling
                    ? "This offering has the enrollment data needed to participate in schedule generation."
                    : "This offering needs enrolled students before the scheduling engine can place its exam."}
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
