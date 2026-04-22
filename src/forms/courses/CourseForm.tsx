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

type CourseFormValues = z.input<typeof courseSchema>;

interface CourseFormProps {
  initialData?: Course;
  programs: Program[];
  semesters: Semester[];
  isProgramsLoading?: boolean;
  isSemestersLoading?: boolean;
  programsErrorMessage?: string;
  semestersErrorMessage?: string;
  submitErrorMessage?: string;
  submitValidationMessages?: string[];
  onSubmit: (data: Course) => void;
  isLoading?: boolean;
}

export function CourseForm({
  initialData,
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
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: initialData || {
      code: "",
      name: "",
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

  const selectedProgram = useMemo(
    () => programs.find((program) => program.id === selectedProgramId) ?? null,
    [programs, selectedProgramId]
  );
  const selectedSemester = useMemo(
    () => semesters.find((semester) => semester.id === selectedSemesterId) ?? null,
    [semesters, selectedSemesterId]
  );

  const isGlobalError = !!submitErrorMessage || (submitValidationMessages && submitValidationMessages.length > 0);
  const hasErrors = Object.keys(form.formState.errors).length > 0;
  const isSubmitDisabled =
    Boolean(isLoading) ||
    hasErrors ||
    Boolean(isProgramsLoading) ||
    Boolean(programsErrorMessage) ||
    programs.length === 0;

  const handleSubmit = (values: CourseFormValues) => {
    onSubmit({
      id: initialData?.id,
      code: values.code,
      name: values.name,
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

      {(submitErrorMessage || (submitValidationMessages?.length ?? 0) > 0) && (
        <div className="space-y-2 rounded-none border border-red-200 bg-red-50 px-3 py-3 text-red-900">
          {submitErrorMessage && <p className="text-sm font-semibold">{submitErrorMessage}</p>}
          {(submitValidationMessages?.length ?? 0) > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-xs">
              {submitValidationMessages?.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          )}
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
              form.formState.errors.code || isGlobalError
                ? "border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30"
                : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
            )}
            placeholder="e.g., CSCI301"
            disabled={isLoading}
          />
          {form.formState.errors.code && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-destructive" />
          )}
          {!form.formState.errors.code && !!enteredCode && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-emerald-500" />
          )}
        </div>
        {form.formState.errors.code && (
          <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-destructive leading-snug">
              {form.formState.errors.code.message as string}
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
              form.formState.errors.name || isGlobalError
                ? "border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30"
                : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
            )}
            placeholder="e.g., Data Structures"
            disabled={isLoading}
          />
          {form.formState.errors.name && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-destructive" />
          )}
          {!form.formState.errors.name && !!enteredName && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-emerald-500" />
          )}
        </div>
        {form.formState.errors.name && (
          <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-destructive leading-snug">
              {form.formState.errors.name.message as string}
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
              form.formState.errors.programId || isGlobalError
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
        {form.formState.errors.programId && (
          <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-destructive leading-snug">
              {form.formState.errors.programId.message as string}
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
              isGlobalError
                ? "border-destructive/60 bg-destructive/5"
                : "hover:border-zinc-300 focus-visible:border-zinc-400"
            )}
          >
            <SelectValue placeholder={isSemestersLoading ? "Loading semesters..." : "Select a semester"} />
          </SelectTrigger>
          <SelectContent>
            {semesters.map((semester) => (
              <SelectItem key={semester.id} value={semester.id}>
                {semester.isActive ? `${semester.name} (Active)` : semester.name}
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
