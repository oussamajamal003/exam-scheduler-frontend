import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { studentSchema, Student } from "../../schemas/student";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface StudentFormProps {
  initialData?: Student;
  onSubmit: (data: Student) => void;
  isLoading?: boolean;
}

export function StudentForm({ initialData, onSubmit, isLoading }: StudentFormProps) {
  const form = useForm({
    resolver: zodResolver(studentSchema),
    defaultValues: initialData || {
      universityId: "",
      firstName: "",
      lastName: "",
      email: "",
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
    });
  }, [form, initialData]);

  const hasErrors = Object.keys(form.formState.errors).length > 0;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2.5">
        <Label htmlFor="universityId" className="text-sm font-semibold text-zinc-950">
          University ID
        </Label>
        <div className="relative">
          <Input
            id="universityId"
            {...form.register("universityId")}
            className={cn(
              "h-10 rounded-xl border-zinc-200 bg-white/50 text-sm transition-all",
              form.formState.errors.universityId
                ? "border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30"
                : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
            )}
            disabled={isLoading}
            placeholder="e.g., STU2024001"
          />
          {form.formState.errors.universityId && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-destructive" />
          )}
        </div>
        {form.formState.errors.universityId && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 border border-destructive/20">
            <AlertCircle className="size-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-destructive leading-snug">
              {form.formState.errors.universityId.message}
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
              {...form.register("firstName")}
              className={cn(
                "h-10 rounded-xl border-zinc-200 bg-white/50 text-sm transition-all",
                form.formState.errors.firstName
                  ? "border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30"
                  : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
              )}
              disabled={isLoading}
              placeholder="John"
            />
            {form.formState.errors.firstName && (
              <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-destructive" />
            )}
          </div>
          {form.formState.errors.firstName && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 border border-destructive/20">
              <AlertCircle className="size-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-destructive leading-snug">
                {form.formState.errors.firstName.message}
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
              {...form.register("lastName")}
              className={cn(
                "h-10 rounded-xl border-zinc-200 bg-white/50 text-sm transition-all",
                form.formState.errors.lastName
                  ? "border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30"
                  : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
              )}
              disabled={isLoading}
              placeholder="Doe"
            />
            {form.formState.errors.lastName && (
              <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-destructive" />
            )}
          </div>
          {form.formState.errors.lastName && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 border border-destructive/20">
              <AlertCircle className="size-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-destructive leading-snug">
                {form.formState.errors.lastName.message}
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
            {...form.register("email")}
            className={cn(
              "h-10 rounded-xl border-zinc-200 bg-white/50 text-sm transition-all",
              form.formState.errors.email
                ? "border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30"
                : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
            )}
            disabled={isLoading}
            placeholder="john.doe@university.edu"
          />
          {form.formState.errors.email && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-destructive" />
          )}
        </div>
        {form.formState.errors.email && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 border border-destructive/20">
            <AlertCircle className="size-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-destructive leading-snug">
              {form.formState.errors.email.message}
            </p>
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading || hasErrors}
        className="w-full h-10 rounded-xl bg-zinc-950 text-white font-semibold shadow-sm shadow-zinc-950/10 hover:bg-zinc-900 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
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
