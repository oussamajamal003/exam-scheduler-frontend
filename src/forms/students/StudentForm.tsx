import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { studentSchema, Student } from "../../schemas/student";
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
import { useStudents } from "../../hooks/students/useStudents";

interface StudentFormProps {
  initialData?: Student;
  programs?: Program[];
  isProgramsLoading?: boolean;
  programsErrorMessage?: string;
  onSubmit: (data: Student) => void;
  isLoading?: boolean;
  submitErrorMessage?: string;
  submitValidationMessages?: Record<string, string[]>;
  onClearSubmitError?: () => void;
}

export function StudentForm({ initialData, programs = [], isProgramsLoading, programsErrorMessage, onSubmit, isLoading, submitErrorMessage, submitValidationMessages, onClearSubmitError }: StudentFormProps) {
  const { data: existingStudents = [], isLoading: isLoadingExisting } = useStudents();
  const form = useForm({
    resolver: zodResolver(studentSchema),
    defaultValues: initialData || {
      universityId: "",
      firstName: "",
      lastName: "",
      email: "",
      programId: undefined,
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
      return;
    }

    form.reset({
      universityId: "",
      firstName: "",
      lastName: "",
      email: "",
      programId: undefined,
    });
  }, [form, initialData]);

  const selectedProgramId = useWatch({ control: form.control, name: "programId" });
  const watchedUniversityId = useWatch({ control: form.control, name: "universityId" });
  const watchedFirstName = useWatch({ control: form.control, name: "firstName" });
  const watchedLastName = useWatch({ control: form.control, name: "lastName" });
  const watchedEmail = useWatch({ control: form.control, name: "email" });
  const currentStudentId = initialData?.id ?? "";
  const selectedProgram = useMemo(
    () => programs.find((p) => p.id === selectedProgramId) ?? null,
    [programs, selectedProgramId]
  );
  const normalizedEmail = (watchedEmail ?? "").trim().toLowerCase();
  const duplicateEmailStudent = useMemo(
    () => existingStudents.find((student) => {
      if (!normalizedEmail || student.id === currentStudentId) return false;
      const candidateEmail = student.user?.email ?? student.email ?? "";
      return candidateEmail.trim().toLowerCase() === normalizedEmail;
    }) ?? null,
    [currentStudentId, existingStudents, normalizedEmail]
  );
  const duplicateEmailMessage = duplicateEmailStudent
    ? "Student email already exists."
    : null;
  const hasSubmitErrors = Boolean(submitErrorMessage) || Object.keys(submitValidationMessages ?? {}).length > 0;
  const clearSubmitErrors = () => {
    if (!isLoading && hasSubmitErrors) {
      onClearSubmitError?.();
    }
  };

  const hasErrors = Object.keys(form.formState.errors).length > 0;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {submitErrorMessage && (
        <div className="flex items-center gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20 mb-4 text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <p className="text-sm font-medium leading-snug">{submitErrorMessage}</p>
        </div>
      )}

      <div className="space-y-2.5">
        <Label htmlFor="universityId" className="text-sm font-semibold text-zinc-950">
          University ID
        </Label>
        <div className="relative">
          <Input
            id="universityId"
            {...form.register("universityId", { onChange: clearSubmitErrors })}
            className={cn(
              "h-10 rounded-none border-zinc-200 bg-white/50 text-sm transition-all",
              form.formState.errors.universityId || submitValidationMessages?.universityId
                ? "border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30"
                : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
            )}
            disabled={isLoading}
            placeholder="e.g., STU2024001"
          />
          {(form.formState.errors.universityId || submitValidationMessages?.universityId) && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-destructive" />
          )}
          {!form.formState.errors.universityId && !submitValidationMessages?.universityId && !!watchedUniversityId && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-emerald-500" />
          )}
        </div>
        {(form.formState.errors.universityId || submitValidationMessages?.universityId) && (
          <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-destructive leading-snug">
              {form.formState.errors.universityId?.message || submitValidationMessages?.universityId?.join(", ")}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2.5">
          <Label htmlFor="firstName" className="text-sm font-semibold text-zinc-950">
            First Name
          </Label>
          <div className="relative">
            <Input
              id="firstName"
              {...form.register("firstName", { onChange: clearSubmitErrors })}
              className={cn(
                "h-10 rounded-none border-zinc-200 bg-white/50 text-sm transition-all",
                form.formState.errors.firstName || submitValidationMessages?.firstName
                  ? "border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30"
                  : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
              )}
              disabled={isLoading}
              placeholder="John"
            />
            {(form.formState.errors.firstName || submitValidationMessages?.firstName) && (
              <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-destructive" />
            )}
          {!form.formState.errors.firstName && !submitValidationMessages?.firstName && !!watchedFirstName && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-emerald-500" />
          )}
          </div>
          {(form.formState.errors.firstName || submitValidationMessages?.firstName) && (
            <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
              <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-destructive leading-snug">
                {form.formState.errors.firstName?.message || submitValidationMessages?.firstName?.join(", ")}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="lastName" className="text-sm font-semibold text-zinc-950">
            Last Name
          </Label>
          <div className="relative">
            <Input
              id="lastName"
              {...form.register("lastName", { onChange: clearSubmitErrors })}
              className={cn(
                "h-10 rounded-none border-zinc-200 bg-white/50 text-sm transition-all",
                form.formState.errors.lastName || submitValidationMessages?.lastName
                  ? "border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30"
                  : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
              )}
              disabled={isLoading}
              placeholder="Doe"
            />
            {(form.formState.errors.lastName || submitValidationMessages?.lastName) && (
              <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-destructive" />
            )}
          {!form.formState.errors.lastName && !submitValidationMessages?.lastName && !!watchedLastName && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-emerald-500" />
          )}
          </div>
          {(form.formState.errors.lastName || submitValidationMessages?.lastName) && (
            <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
              <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-destructive leading-snug">
                {form.formState.errors.lastName?.message || submitValidationMessages?.lastName?.join(", ")}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="email" className="text-sm font-semibold text-zinc-950">
          Email Address
        </Label>
        <div className="relative">
          <Input
            id="email"
            type="email"
            {...form.register("email", { onChange: clearSubmitErrors })}
            className={cn(
              "h-10 rounded-none border-zinc-200 bg-white/50 text-sm transition-all",
              form.formState.errors.email || submitValidationMessages?.email || duplicateEmailMessage
                ? "border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30"
                : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
            )}
            disabled={isLoading}
            placeholder="john.doe@university.edu"
          />
          {(form.formState.errors.email || submitValidationMessages?.email || duplicateEmailMessage) && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-destructive" />
          )}
          {!form.formState.errors.email && !submitValidationMessages?.email && !duplicateEmailMessage && !!watchedEmail && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-emerald-500" />
          )}
        </div>
        {(form.formState.errors.email || submitValidationMessages?.email || duplicateEmailMessage) && (
          <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-destructive leading-snug">
              {form.formState.errors.email?.message || submitValidationMessages?.email?.join(", ") || duplicateEmailMessage}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="programId" className="text-sm font-semibold text-zinc-950">
          Program
        </Label>
        <Select
          value={selectedProgramId || undefined}
          onValueChange={(value) => {
            clearSubmitErrors();
            const program = programs.find((p) => p.id === value);
            form.setValue("programId", value, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
            form.setValue("program", program?.name ?? "", { shouldDirty: true });
            form.setValue("department", program?.departmentName ?? program?.department?.name ?? "", { shouldDirty: true });
          }}
          disabled={isLoading || isProgramsLoading || programs.length === 0}
        >
          <SelectTrigger
            id="programId"
            className={cn(
              "h-10 w-full rounded-none border-zinc-200 bg-white/50 text-sm transition-all",
              "hover:border-zinc-300 focus-visible:border-zinc-400"
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
            Department: {selectedProgram.departmentName ?? selectedProgram.department?.name ?? "Unassigned Department"}
          </p>
        )}
        {programsErrorMessage && (
          <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-destructive leading-snug">{programsErrorMessage}</p>
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading || isLoadingExisting || hasErrors || Boolean(duplicateEmailMessage) || Boolean(submitValidationMessages?.email?.length)}
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
            {initialData ? "Update Student" : "Add Student"}
          </span>
        )}
      </Button>
    </form>
  );
}
