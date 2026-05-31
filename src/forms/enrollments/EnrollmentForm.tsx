import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, BookOpen, GraduationCap, Layers, User } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { AsyncSearchSelect } from "../../components/ui/async-search-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { cn } from "../../lib/utils";
import { getApiErrorMessage } from "../../lib/apiError";
import { useCourseOfferingsPage } from "../../hooks/courseOfferings/useCourseOfferings";
import { useSemesters } from "../../hooks/semesters/useSemesters";
import { useStudentsPage } from "../../hooks/students/useStudents";
import {
  createEnrollmentSchema,
  type CreateEnrollmentDto,
  type Enrollment,
} from "../../schemas/enrollment";
import type { Student } from "../../schemas/student";
import type { CourseOffering } from "../../schemas/courseOffering";

interface EnrollmentFormProps {
  existingEnrollments: Enrollment[];
  submitErrorMessage?: string;
  isLoading?: boolean;
  onSubmit: (data: CreateEnrollmentDto) => Promise<void> | void;
  onCancel: () => void;
}

const ALL_SEMESTERS = "__all_semesters__";

export function EnrollmentForm({
  existingEnrollments,
  submitErrorMessage,
  isLoading,
  onSubmit,
  onCancel,
}: EnrollmentFormProps) {
  const [studentSearch, setStudentSearch] = useState("");
  const [offeringSearch, setOfferingSearch] = useState("");
  const [offeringSemesterId, setOfferingSemesterId] = useState(ALL_SEMESTERS);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedOfferingOption, setSelectedOfferingOption] = useState<CourseOffering | null>(null);
  const deferredStudentSearch = useDeferredValue(studentSearch.trim());
  const deferredOfferingSearch = useDeferredValue(offeringSearch.trim());
  const selectedOfferingSemesterId = offeringSemesterId === ALL_SEMESTERS ? undefined : offeringSemesterId;

  const semestersQuery = useSemesters();
  const studentsQuery = useStudentsPage({
    pageSize: 30,
    search: deferredStudentSearch,
  });
  const offeringsQuery = useCourseOfferingsPage({
    pageSize: 200,
    search: deferredOfferingSearch,
    semesterId: selectedOfferingSemesterId,
  });

  const form = useForm({
    resolver: zodResolver(createEnrollmentSchema),
    defaultValues: {
      studentId: "",
      courseOfferingId: "",
      status: "ACTIVE",
    },
    mode: "onChange",
  });

  const selectedStudentId = form.watch("studentId");
  const selectedOfferingId = form.watch("courseOfferingId");

  const semesters = useMemo(() => semestersQuery.data ?? [], [semestersQuery.data]);
  const students = useMemo(() => studentsQuery.data?.data ?? [], [studentsQuery.data]);
  const offerings = useMemo(() => offeringsQuery.data?.data ?? [], [offeringsQuery.data]);
  const studentOptions = useMemo(() => {
    if (!selectedStudent?.id || students.some((student) => student.id === selectedStudent.id)) {
      return students;
    }
    return [selectedStudent, ...students];
  }, [selectedStudent, students]);
  const offeringOptions = useMemo(() => {
    if (!selectedOfferingOption?.id || offerings.some((offering) => offering.id === selectedOfferingOption.id)) {
      return offerings;
    }
    return [selectedOfferingOption, ...offerings];
  }, [selectedOfferingOption, offerings]);

  const selectedOffering = useMemo(
    () => selectedOfferingOption ?? offeringOptions.find((o) => o.id === selectedOfferingId) ?? null,
    [offeringOptions, selectedOfferingId, selectedOfferingOption]
  );

  const duplicate = useMemo(() => {
    if (!selectedStudentId || !selectedOfferingId) return false;
    return existingEnrollments.some(
      (e) =>
        e.student?.id === selectedStudentId &&
        e.courseOffering?.id === selectedOfferingId
    );
  }, [existingEnrollments, selectedStudentId, selectedOfferingId]);

  useEffect(() => {
    setSelectedOfferingOption(null);
    setOfferingSearch("");
    form.setValue("courseOfferingId", "", { shouldValidate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOfferingSemesterId]);

  useEffect(() => {
    if (duplicate) {
      form.setError("courseOfferingId", {
        type: "manual",
        message: "This student is already enrolled in this course offering.",
      });
    } else {
      const current = form.formState.errors.courseOfferingId;
      if (current?.type === "manual") {
        form.clearErrors("courseOfferingId");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duplicate]);

  const handleSubmit = form.handleSubmit(async (data) => {
    if (duplicate) return;
    await onSubmit({
      studentId: data.studentId,
      courseOfferingId: data.courseOfferingId,
      status: data.status ?? "ACTIVE",
    });
  });

  const programName =
    selectedOffering?.program?.name ?? selectedOffering?.course?.program?.name ?? "—";
  const semesterName = selectedOffering?.semester?.name ?? "—";
  const studentsErrorMessage = studentsQuery.isError
    ? getApiErrorMessage(studentsQuery.error, "Failed to load students.")
    : undefined;
  const offeringsErrorMessage = offeringsQuery.isError
    ? getApiErrorMessage(offeringsQuery.error, "Failed to load offerings.")
    : undefined;
  const selectedStudentLabel = selectedStudent
    ? `${selectedStudent.firstName} ${selectedStudent.lastName}`.trim() || selectedStudent.email
    : undefined;
  const selectedOfferingLabel = selectedOffering
    ? `${selectedOffering.course?.code ?? "—"} · ${selectedOffering.course?.title ?? selectedOffering.course?.name ?? "Untitled"}`
    : undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {submitErrorMessage && (
        <div className="flex items-start gap-2 rounded-none border border-destructive/20 bg-destructive/10 px-3 py-2.5">
          <AlertCircle className="size-4 shrink-0 text-destructive" />
          <p className="text-sm font-medium text-destructive">{submitErrorMessage}</p>
        </div>
      )}

      {/* Student */}
      <div className="space-y-2.5">
        <Label htmlFor="studentId" className="text-sm font-semibold text-zinc-950">
          Student
        </Label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-zinc-400" />
          <AsyncSearchSelect
            value={form.watch("studentId")}
            selectedLabel={selectedStudentLabel}
            placeholder={studentsQuery.isLoading ? "Loading students…" : "Select a student"}
            searchPlaceholder="Search students by name, email, or ID"
            options={studentOptions}
            searchValue={studentSearch}
            onSearchChange={setStudentSearch}
            onValueChange={(value, student) => {
              setSelectedStudent(student);
              form.setValue("studentId", value, { shouldValidate: true });
            }}
            getOptionValue={(student) => student.id ?? ""}
            getOptionLabel={(student) => `${student.firstName} ${student.lastName}`.trim() || student.email}
            renderOption={(student) => (
              <>
                {student.firstName} {student.lastName}
                <span className="ml-1 text-xs text-zinc-400">— {student.universityId}</span>
              </>
            )}
            disabled={isLoading || studentsQuery.isLoading}
            isLoading={studentsQuery.isFetching}
            errorMessage={form.formState.errors.studentId?.message}
            emptyMessage="No students available"
            className={cn("pl-9", form.formState.errors.studentId ? "border-destructive/60 bg-destructive/5" : "")}
          />
        </div>
        {studentsErrorMessage && (
          <p className="text-xs font-medium text-destructive">{studentsErrorMessage}</p>
        )}
        {form.formState.errors.studentId && (
          <p className="text-xs font-medium text-destructive">
            {form.formState.errors.studentId.message}
          </p>
        )}
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="offeringSemester" className="text-sm font-semibold text-zinc-950">
          Offering Semester
        </Label>
        <Select
          value={offeringSemesterId}
          onValueChange={setOfferingSemesterId}
          disabled={isLoading || semestersQuery.isLoading}
        >
          <SelectTrigger
            id="offeringSemester"
            className="h-10 w-full rounded-none border-zinc-200 bg-white/50 text-sm transition-all hover:border-zinc-300 focus-visible:border-zinc-400"
          >
            <SelectValue placeholder={semestersQuery.isLoading ? "Loading semesters..." : "All semesters"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SEMESTERS}>All semesters</SelectItem>
            {semesters.map((semester) => (
              <SelectItem key={semester.id} value={semester.id}>
                {semester.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-zinc-500">
          Select a semester to narrow course offerings, or keep all semesters to show every offering.
        </p>
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="courseOfferingId" className="text-sm font-semibold text-zinc-950">
          Course Offering
        </Label>
        <div className="relative">
          <BookOpen className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-zinc-400" />
          <AsyncSearchSelect
            value={form.watch("courseOfferingId")}
            selectedLabel={selectedOfferingLabel}
            placeholder={offeringsQuery.isPending ? "Loading offerings…" : "Select a course offering"}
            searchPlaceholder="Search offerings by course, instructor, or program"
            options={offeringOptions}
            searchValue={offeringSearch}
            onSearchChange={setOfferingSearch}
            onValueChange={(value, offering) => {
              setSelectedOfferingOption(offering);
              form.setValue("courseOfferingId", value, { shouldValidate: true })
            }}
            getOptionValue={(offering) => offering.id}
            getOptionLabel={(offering) => `${offering.course?.code ?? "—"} · ${offering.course?.title ?? offering.course?.name ?? "Untitled"}`}
            renderOption={(offering) => (
              <>
                {offering.course?.code ?? "—"} · {offering.course?.title ?? offering.course?.name ?? "Untitled"}
                <span className="ml-1 text-xs text-zinc-400">— {offering.semester?.name ?? "—"}</span>
              </>
            )}
            disabled={isLoading || offeringsQuery.isPending}
            isLoading={offeringsQuery.isFetching}
            errorMessage={form.formState.errors.courseOfferingId?.message}
            emptyMessage={selectedOfferingSemesterId ? "No offerings available for this semester" : "No offerings available"}
            className={cn("pl-9", form.formState.errors.courseOfferingId ? "border-destructive/60 bg-destructive/5" : "")}
          />
        </div>
        {offeringsErrorMessage && (
          <p className="text-xs font-medium text-destructive">{offeringsErrorMessage}</p>
        )}
        {form.formState.errors.courseOfferingId && (
          <p className="text-xs font-medium text-destructive">
            {form.formState.errors.courseOfferingId.message}
          </p>
        )}
      </div>

      {/* Auto-filled context */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-none border border-zinc-200/80 bg-zinc-50/60 p-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
            <GraduationCap className="size-3.5" />
            Program
          </div>
          <p className="mt-1.5 truncate text-sm font-semibold text-zinc-950">{programName}</p>
        </div>
        <div className="rounded-none border border-zinc-200/80 bg-zinc-50/60 p-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
            <Layers className="size-3.5" />
            Semester
          </div>
          <p className="mt-1.5 truncate text-sm font-semibold text-zinc-950">{semesterName}</p>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="h-10 rounded-none"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || duplicate}
          className="h-10 rounded-none bg-zinc-950 font-semibold text-white hover:bg-zinc-900"
        >
          {isLoading ? "Saving…" : "Add Enrollment"}
        </Button>
      </div>
    </form>
  );
}
