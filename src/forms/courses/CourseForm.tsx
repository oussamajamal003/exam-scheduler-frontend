import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { courseSchema, Course } from "../../schemas/course";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Program } from "../../schemas/program";
import type { Semester } from "../../schemas/semester";

interface CourseFormProps {
  initialData?: Course;
  existingCourses?: Course[];
  programs: Program[];
  semesters: Semester[];
  isProgramsLoading?: boolean;
  isSemestersLoading?: boolean;
  programsErrorMessage?: string;
  semestersErrorMessage?: string;
  submitErrorMessage?: string;
  submitValidationMessages?: Record<string, string[]>;
  onSubmit: (data: Course) => void;
  isLoading?: boolean;
}

type CourseFormValues = z.input<typeof courseSchema>;
type CourseFormOutput = z.output<typeof courseSchema>;

export function CourseForm({
  initialData,
  existingCourses = [],
  programs,
  semesters,
  isProgramsLoading,
  isSemestersLoading,
  programsErrorMessage,
  semestersErrorMessage,
  submitErrorMessage,
  submitValidationMessages,
  onSubmit,
  isLoading,
}: CourseFormProps) {
  const form = useForm<CourseFormValues, unknown, CourseFormOutput>({
    resolver: zodResolver(courseSchema),
    defaultValues: initialData || {
      code: "",
      name: "",
      credits: undefined,
      programId: "",
      program: "",
      semesterId: "",
      semester: "Assigned through offerings",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
      return;
    }

    form.reset({
      code: "",
      name: "",
      credits: undefined,
      programId: "",
      program: "",
      semesterId: "",
      semester: "Assigned through offerings",
    });
  }, [form, initialData]);

  const selectedProgramId = useWatch({ control: form.control, name: "programId" });
  const selectedSemesterId = useWatch({ control: form.control, name: "semesterId" });
  const enteredCode = useWatch({ control: form.control, name: "code" });
  const enteredName = useWatch({ control: form.control, name: "name" });
  const enteredCredits = useWatch({ control: form.control, name: "credits" });

  const selectedProgram = useMemo(
    () => programs.find((program) => program.id === selectedProgramId) ?? null,
    [programs, selectedProgramId]
  );
  const selectedSemester = useMemo(
    () => semesters.find((semester) => semester.id === selectedSemesterId) ?? null,
    [semesters, selectedSemesterId]
  );

  // Detect duplicate (code + semester) against the courses already known to the
  // page so the user gets immediate feedback before a network round-trip.
  const trimmedCode = (enteredCode ?? "").trim().toLowerCase();
  const editingId = initialData?.id;
  const duplicateCourse = useMemo(() => {
    if (!trimmedCode) return null;
    return (
      existingCourses.find(
        (c) =>
          c.id !== editingId &&
          (c.code ?? "").trim().toLowerCase() === trimmedCode &&
          (c.semesterId ?? "") === (selectedSemesterId ?? "")
      ) ?? null
    );
  }, [existingCourses, trimmedCode, selectedSemesterId, editingId]);
  const duplicateMessage = duplicateCourse
    ? selectedSemesterId
      ? `"${duplicateCourse.code}" already exists in ${
          selectedSemester?.name ?? "this semester"
        }. Pick a different semester to create another.`
      : `"${duplicateCourse.code}" already exists with no semester assigned. Pick a semester to create another.`
    : null;

  const hasErrors = Object.keys(form.formState.errors).length > 0;
  const isSubmitDisabled =
    Boolean(isLoading) ||
    hasErrors ||
    Boolean(duplicateMessage) ||
    Boolean(isProgramsLoading) ||
    Boolean(programsErrorMessage) ||
    programs.length === 0;

  const handleSubmit = (values: CourseFormOutput) => {
    if (duplicateMessage) return;
    onSubmit({
      id: initialData?.id,
      code: values.code,
      name: values.name,
      credits: values.credits,
      programId: values.programId,
      program: values.program ?? selectedProgram?.name ?? "",
      semesterId: values.semesterId,
      semester: values.semester ?? selectedSemester?.name ?? "Assigned through offerings",
    });
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
      {(programsErrorMessage || semestersErrorMessage) && (
        <div className="space-y-2">
          {programsErrorMessage && (
            <div className="rounded-none border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {programsErrorMessage}
            </div>
          )}
          {semestersErrorMessage && (
            <div className="rounded-none border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {semestersErrorMessage}
            </div>
          )}
        </div>
      )}

      {!isProgramsLoading && !programsErrorMessage && programs.length === 0 && (
        <div className="rounded-none border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
          No programs are available yet. Create a program first, then add a course.
        </div>
      )}

      {submitErrorMessage && (
        <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
          <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-destructive leading-snug">{submitErrorMessage}</p>
        </div>
      )}

      <div className="space-y-2.5">
        <Label htmlFor="code" className="text-sm font-semibold text-zinc-950">
          Course Code
        </Label>
        <div className="relative">
          <Input
            id="code"
            {...form.register("code")}
            className={cn(
              "h-10 rounded-none border-zinc-200 bg-white/50 text-sm transition-all",
              form.formState.errors.code || submitValidationMessages?.code || duplicateMessage
                ? "border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30"
                : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
            )}
            placeholder="e.g., CSCI301"
            disabled={isLoading}
          />
          {(form.formState.errors.code || submitValidationMessages?.code || duplicateMessage) && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-destructive" />
          )}
          {!form.formState.errors.code && !submitValidationMessages?.code && !duplicateMessage && !!enteredCode && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-emerald-500" />
          )}
        </div>
        {(form.formState.errors.code || submitValidationMessages?.code) && (
          <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-destructive leading-snug">
              {(form.formState.errors.code?.message ?? submitValidationMessages?.code?.[0]) as string}
            </p>
          </div>
        )}
        {!form.formState.errors.code &&
          !submitValidationMessages?.code &&
          duplicateMessage && (
            <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
              <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-destructive leading-snug">
                {duplicateMessage}
              </p>
            </div>
          )}
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="name" className="text-sm font-semibold text-zinc-950">
          Course Name
        </Label>
        <div className="relative">
          <Input
            id="name"
            {...form.register("name")}
            className={cn(
              "h-10 rounded-none border-zinc-200 bg-white/50 text-sm transition-all",
              form.formState.errors.name || submitValidationMessages?.name
                ? "border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30"
                : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
            )}
            placeholder="e.g., Data Structures"
            disabled={isLoading}
          />
          {(form.formState.errors.name || submitValidationMessages?.name) && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-destructive" />
          )}
          {!form.formState.errors.name && !submitValidationMessages?.name && !!enteredName && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-emerald-500" />
          )}
        </div>
        {(form.formState.errors.name || submitValidationMessages?.name) && (
          <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-destructive leading-snug">
              {(form.formState.errors.name?.message ?? submitValidationMessages?.name?.[0]) as string}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="credits" className="text-sm font-semibold text-zinc-950">
          Credits
        </Label>
        <div className="relative">
          <Input
            id="credits"
            type="number"
            min={0}
            step={1}
            {...form.register("credits", {
              setValueAs: (value) => (value === "" ? undefined : Number(value)),
            })}
            className={cn(
              "h-10 rounded-none border-zinc-200 bg-white/50 text-sm transition-all",
              form.formState.errors.credits || submitValidationMessages?.credits
                ? "border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30"
                : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
            )}
            placeholder="e.g., 3"
            disabled={isLoading}
          />
          {(form.formState.errors.credits || submitValidationMessages?.credits) && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-destructive" />
          )}
          {!form.formState.errors.credits && !submitValidationMessages?.credits && enteredCredits !== undefined && enteredCredits !== null && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-emerald-500" />
          )}
        </div>
        {(form.formState.errors.credits || submitValidationMessages?.credits) && (
          <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-destructive leading-snug">
              {(form.formState.errors.credits?.message ?? submitValidationMessages?.credits?.[0]) as string}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="program" className="text-sm font-semibold text-zinc-950">
          Program
        </Label>
        <Select
          value={selectedProgramId || undefined}
          onValueChange={(value) => {
            const program = programs.find((item) => item.id === value);
            form.setValue("programId", value, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });
            form.setValue("program", program?.name ?? "", {
              shouldDirty: true,
            });
          }}
          disabled={isLoading || isProgramsLoading || programs.length === 0}
        >
          <SelectTrigger
            id="program"
            className={cn(
              "h-10 w-full rounded-none border-zinc-200 bg-white/50 text-sm transition-all",
              form.formState.errors.programId || submitValidationMessages?.programId
                ? "border-destructive/60 bg-destructive/5"
                : "hover:border-zinc-300 focus-visible:border-zinc-400"
            )}
          >
            <SelectValue placeholder={isProgramsLoading ? "Loading programs..." : "Select a program"} />
          </SelectTrigger>
          <SelectContent>
            {programs.map((program) => (
              <SelectItem key={program.id} value={program.id ?? ""}>
                {`${program.name} (${program.code})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedProgram && (
          <p className="text-xs text-zinc-500">
            Linked department: {selectedProgram.departmentName ?? "Unassigned Department"}
          </p>
        )}
        {(form.formState.errors.programId || submitValidationMessages?.programId) && (
          <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-destructive leading-snug">
              {(form.formState.errors.programId?.message ?? submitValidationMessages?.programId?.[0]) as string}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="semester" className="text-sm font-semibold text-zinc-950">
          Semester
        </Label>
        <Select
          value={selectedSemesterId || undefined}
          onValueChange={(value) => {
            const semester = semesters.find((item) => item.id === value);
            form.setValue("semesterId", value, {
              shouldDirty: true,
              shouldTouch: true,
            });
            form.setValue("semester", semester?.name ?? "Assigned through offerings", {
              shouldDirty: true,
            });
          }}
          disabled={isLoading || isSemestersLoading || semesters.length === 0}
        >
          <SelectTrigger
            id="semester"
            className={cn(
              "h-10 w-full rounded-none border-zinc-200 bg-white/50 text-sm transition-all",
              submitValidationMessages?.semesterId
                ? "border-destructive/60 bg-destructive/5"
                : "hover:border-zinc-300 focus-visible:border-zinc-400"
            )}
          >
            <SelectValue placeholder={isSemestersLoading ? "Loading semesters..." : "Select a semester"} />
          </SelectTrigger>
          <SelectContent>
            {semesters.map((semester) => (
              <SelectItem key={semester.id} value={semester.id}>
                {semester.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-zinc-500">
          {selectedSemester
            ? `Selected semester: ${selectedSemester.name}. Course-to-semester assignment is currently managed through course offerings.`
            : "Course-to-semester assignment is currently managed through course offerings."}
        </p>
      </div>

      <Button
        type="submit"
        disabled={isSubmitDisabled}
        className="w-full h-10 rounded-none bg-zinc-950 text-white font-semibold shadow-sm shadow-zinc-950/10 hover:bg-zinc-900 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <div className="size-4 rounded-full border-2 border-transparent border-t-white animate-spin" />
            Saving...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <CheckCircle2 className="size-4" />
            {initialData ? "Update Course" : "Add Course"}
          </span>
        )}
      </Button>
    </form>
  );
}
