import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, BookOpen, GraduationCap, Layers, User } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { cn } from "../../lib/utils";
import {
  createEnrollmentSchema,
  type CreateEnrollmentDto,
  type Enrollment,
} from "../../schemas/enrollment";
import type { Student } from "../../schemas/student";
import type { CourseOffering } from "../../schemas/courseOffering";

interface EnrollmentFormProps {
  students: Student[];
  offerings: CourseOffering[];
  existingEnrollments: Enrollment[];
  isStudentsLoading?: boolean;
  isOfferingsLoading?: boolean;
  studentsErrorMessage?: string;
  offeringsErrorMessage?: string;
  submitErrorMessage?: string;
  isLoading?: boolean;
  onSubmit: (data: CreateEnrollmentDto) => Promise<void> | void;
  onCancel: () => void;
}

export function EnrollmentForm({
  students,
  offerings,
  existingEnrollments,
  isStudentsLoading,
  isOfferingsLoading,
  studentsErrorMessage,
  offeringsErrorMessage,
  submitErrorMessage,
  isLoading,
  onSubmit,
  onCancel,
}: EnrollmentFormProps) {
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

  const selectedOffering = useMemo(
    () => offerings.find((o) => o.id === selectedOfferingId) ?? null,
    [offerings, selectedOfferingId]
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
    selectedOffering?.course?.program?.name ?? "—";
  const semesterName = selectedOffering?.semester?.name ?? "—";

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
          <Select
            value={form.watch("studentId")}
            onValueChange={(value) => form.setValue("studentId", value, { shouldValidate: true })}
            disabled={isLoading || isStudentsLoading}
          >
            <SelectTrigger
              id="studentId"
              className={cn(
                "h-10 rounded-none border-zinc-200 bg-white/50 pl-9 text-sm transition-all",
                form.formState.errors.studentId
                  ? "border-destructive/60 bg-destructive/5"
                  : "hover:border-zinc-300"
              )}
            >
              <SelectValue placeholder={isStudentsLoading ? "Loading students…" : "Select a student"} />
            </SelectTrigger>
            <SelectContent>
              {students.length === 0 && !isStudentsLoading ? (
                <SelectItem value="__empty__" disabled>
                  No students available
                </SelectItem>
              ) : (
                students.map((s) => (
                  <SelectItem key={s.id} value={s.id ?? ""}>
                    {s.firstName} {s.lastName}
                    <span className="ml-1 text-xs text-zinc-400">— {s.universityId}</span>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
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

      {/* Course Offering */}
      <div className="space-y-2.5">
        <Label htmlFor="courseOfferingId" className="text-sm font-semibold text-zinc-950">
          Course Offering
        </Label>
        <div className="relative">
          <BookOpen className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-zinc-400" />
          <Select
            value={form.watch("courseOfferingId")}
            onValueChange={(value) =>
              form.setValue("courseOfferingId", value, { shouldValidate: true })
            }
            disabled={isLoading || isOfferingsLoading}
          >
            <SelectTrigger
              id="courseOfferingId"
              className={cn(
                "h-10 rounded-none border-zinc-200 bg-white/50 pl-9 text-sm transition-all",
                form.formState.errors.courseOfferingId
                  ? "border-destructive/60 bg-destructive/5"
                  : "hover:border-zinc-300"
              )}
            >
              <SelectValue
                placeholder={isOfferingsLoading ? "Loading offerings…" : "Select a course offering"}
              />
            </SelectTrigger>
            <SelectContent>
              {offerings.length === 0 && !isOfferingsLoading ? (
                <SelectItem value="__empty__" disabled>
                  No offerings available
                </SelectItem>
              ) : (
                offerings.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.course?.code ?? "—"} · {o.course?.title ?? "Untitled"}
                    <span className="ml-1 text-xs text-zinc-400">
                      — {o.semester?.name ?? "—"}
                    </span>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
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
