import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { semesterFormSchema, SemesterFormValues } from "../../schemas/semester";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { AlertCircle, CalendarDays, CheckCircle2, Zap } from "lucide-react";
import { cn } from "../../lib/utils";

interface SemesterFormProps {
  initialData?: Partial<SemesterFormValues>;
  onSubmit: (data: SemesterFormValues) => void;
  isLoading?: boolean;
  submitErrorMessage?: string;
  submitValidationMessages?: Record<string, string[]>;
}

const toDateInputValue = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

export function SemesterForm({
  initialData,
  onSubmit,
  isLoading,
  submitErrorMessage,
  submitValidationMessages,
}: SemesterFormProps) {
  const form = useForm<SemesterFormValues>({
    resolver: zodResolver(semesterFormSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      startDate: toDateInputValue(initialData?.startDate),
      endDate: toDateInputValue(initialData?.endDate),
      isActive: initialData?.isActive ?? false,
    },
    mode: "onChange",
  });

  useEffect(() => {
    form.reset({
      name: initialData?.name ?? "",
      startDate: toDateInputValue(initialData?.startDate),
      endDate: toDateInputValue(initialData?.endDate),
      isActive: initialData?.isActive ?? false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.name, initialData?.startDate, initialData?.endDate, initialData?.isActive]);

  const hasErrors = Object.keys(form.formState.errors).length > 0;
  const nameValue = form.watch("name");
  const startValue = form.watch("startDate");
  const endValue = form.watch("endDate");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {submitErrorMessage && (
        <div className="flex items-center gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20 text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <p className="text-sm font-medium leading-snug">{submitErrorMessage}</p>
        </div>
      )}

      {/* Name */}
      <div className="space-y-2.5">
        <Label htmlFor="name" className="text-sm font-semibold text-zinc-950">
          Semester Name
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
            disabled={isLoading}
            placeholder="e.g., Fall 2026"
          />
          {(form.formState.errors.name || submitValidationMessages?.name) && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-destructive" />
          )}
          {!form.formState.errors.name && !submitValidationMessages?.name && !!nameValue && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-emerald-500" />
          )}
        </div>
        {(form.formState.errors.name || submitValidationMessages?.name) && (
          <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-destructive leading-snug">
              {form.formState.errors.name?.message || submitValidationMessages?.name?.join(", ")}
            </p>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="space-y-2.5">
        <Label htmlFor="status" className="text-sm font-semibold text-zinc-950">
          Status
        </Label>
        <Select
          value={form.watch("isActive") ? "active" : "upcoming"}
          onValueChange={(val) => form.setValue("isActive", val === "active", { shouldDirty: true })}
          disabled={isLoading}
        >
          <SelectTrigger id="status" className="h-10 rounded-none border-zinc-200 bg-white/50 text-sm">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="active">
              <span className="flex items-center gap-2">
                <Zap className="size-3.5 text-emerald-600" />
                Active
              </span>
            </SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
          </SelectContent>
        </Select>
        {form.watch("isActive") && (
          <p className="text-[11px] text-amber-600 leading-snug">
            Setting this semester as active will deactivate the currently active semester.
          </p>
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">        <div className="space-y-2.5">
          <Label htmlFor="startDate" className="text-sm font-semibold text-zinc-950">
            Start Date
          </Label>
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
            <Input
              id="startDate"
              type="date"
              {...form.register("startDate", {
                onChange: () => {
                  if (form.getValues("endDate")) {
                    form.trigger("endDate");
                  }
                },
              })}
              className={cn(
                "h-10 pl-9 rounded-none border-zinc-200 bg-white/50 text-sm transition-all",
                form.formState.errors.startDate || submitValidationMessages?.startDate
                  ? "border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30"
                  : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
              )}
              disabled={isLoading}
            />
          </div>
          {(form.formState.errors.startDate || submitValidationMessages?.startDate) && (
            <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
              <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-destructive leading-snug">
                {form.formState.errors.startDate?.message || submitValidationMessages?.startDate?.join(", ")}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="endDate" className="text-sm font-semibold text-zinc-950">
            End Date
          </Label>
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
            <Input
              id="endDate"
              type="date"
              {...form.register("endDate")}
              min={startValue || undefined}
              className={cn(
                "h-10 pl-9 rounded-none border-zinc-200 bg-white/50 text-sm transition-all",
                form.formState.errors.endDate || submitValidationMessages?.endDate
                  ? "border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30"
                  : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
              )}
              disabled={isLoading}
            />
          </div>
          {(form.formState.errors.endDate || submitValidationMessages?.endDate) && (
            <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
              <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-destructive leading-snug">
                {form.formState.errors.endDate?.message || submitValidationMessages?.endDate?.join(", ")}
              </p>
            </div>
          )}
        </div>
      </div>

      {startValue && endValue && !form.formState.errors.endDate && (
        <p className="text-xs text-zinc-500">
          Duration:{" "}
          <span className="font-semibold text-zinc-700">
            {Math.max(
              0,
              Math.round(
                (new Date(endValue).getTime() - new Date(startValue).getTime()) / (1000 * 60 * 60 * 24)
              )
            )}{" "}
            days
          </span>
        </p>
      )}

      <Button
        type="submit"
        disabled={isLoading || hasErrors}
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
            {initialData?.name ? "Update Semester" : "Add Semester"}
          </span>
        )}
      </Button>
    </form>
  );
}
