import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TimeSlot, timeSlotFormSchema, TimeSlotFormValues } from "../../schemas/timeSlot";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { AlertCircle, CalendarDays, CheckCircle2, Clock } from "lucide-react";
import { cn } from "../../lib/utils";

interface TimeSlotFormProps {
  initialData?: Partial<TimeSlotFormValues> & { id?: string };
  existingSlots?: TimeSlot[];
  onSubmit: (data: TimeSlotFormValues) => void;
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

const toTimeInputValue = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(11, 16);
};

const toMinutes = (value: string): number => {
  if (!value) return -1;
  const [h, m] = value.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export function TimeSlotForm({
  initialData,
  onSubmit,
  isLoading,
  submitErrorMessage,
  submitValidationMessages,
}: TimeSlotFormProps) {
  const form = useForm<TimeSlotFormValues>({
    resolver: zodResolver(timeSlotFormSchema),
    defaultValues: {
      date: toDateInputValue(initialData?.date),
      startTime: toTimeInputValue(initialData?.startTime),
      endTime: toTimeInputValue(initialData?.endTime),
    },
    mode: "onChange",
  });

  useEffect(() => {
    form.reset({
      date: toDateInputValue(initialData?.date),
      startTime: toTimeInputValue(initialData?.startTime),
      endTime: toTimeInputValue(initialData?.endTime),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.date, initialData?.startTime, initialData?.endTime]);

  const startValue = form.watch("startTime");
  const endValue = form.watch("endTime");



  const hasErrors = Object.keys(form.formState.errors).length > 0;
  const durationMinutes =
    startValue && endValue && toMinutes(endValue) > toMinutes(startValue)
      ? toMinutes(endValue) - toMinutes(startValue)
      : 0;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {submitErrorMessage && (
        <div className="flex items-center gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20 text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <p className="text-sm font-medium leading-snug">{submitErrorMessage}</p>
        </div>
      )}

      {/* Date */}
      <div className="space-y-2.5">
        <Label htmlFor="date" className="text-sm font-semibold text-zinc-950">Date</Label>
        <div className="relative">
          <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
          <Input
            id="date"
            type="date"
            {...form.register("date", {
              onChange: () => {
                if (form.getValues("startTime")) form.trigger("startTime");
                if (form.getValues("endTime")) form.trigger("endTime");
              },
            })}
            className={cn(
              "h-10 pl-9 rounded-none border-zinc-200 bg-white/50 text-sm transition-all",
              form.formState.errors.date || submitValidationMessages?.date
                ? "border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30"
                : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
            )}
            disabled={isLoading}
          />
        </div>
        {(form.formState.errors.date || submitValidationMessages?.date) && (
          <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-destructive leading-snug">
              {form.formState.errors.date?.message || submitValidationMessages?.date?.join(", ")}
            </p>
          </div>
        )}
      </div>

      {/* Times */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2.5">
          <Label htmlFor="startTime" className="text-sm font-semibold text-zinc-950">Start Time</Label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
            <Input
              id="startTime"
              type="time"
              {...form.register("startTime", {
                onChange: () => {
                  if (form.getValues("endTime")) form.trigger("endTime");
                },
              })}
              className={cn(
                "h-10 pl-9 rounded-none border-zinc-200 bg-white/50 text-sm transition-all",
                form.formState.errors.startTime || submitValidationMessages?.startTime
                  ? "border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30"
                  : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
              )}
              disabled={isLoading}
            />
          </div>
          {(form.formState.errors.startTime || submitValidationMessages?.startTime) && (
            <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
              <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-destructive leading-snug">
                {form.formState.errors.startTime?.message || submitValidationMessages?.startTime?.join(", ")}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="endTime" className="text-sm font-semibold text-zinc-950">End Time</Label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
            <Input
              id="endTime"
              type="time"
              {...form.register("endTime")}
              min={startValue || undefined}
              className={cn(
                "h-10 pl-9 rounded-none border-zinc-200 bg-white/50 text-sm transition-all",
                form.formState.errors.endTime || submitValidationMessages?.endTime
                  ? "border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30"
                  : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
              )}
              disabled={isLoading}
            />
          </div>
          {(form.formState.errors.endTime || submitValidationMessages?.endTime) && (
            <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
              <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-destructive leading-snug">
                {form.formState.errors.endTime?.message || submitValidationMessages?.endTime?.join(", ")}
              </p>
            </div>
          )}
        </div>
      </div>

      {durationMinutes > 0 && !form.formState.errors.endTime && (
        <p className="text-xs text-zinc-500">
          Duration: <span className="font-semibold text-zinc-700">{durationMinutes} minutes</span>
        </p>
      )}

      {/* Overlaps existing option UI removed per UX request */}

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
            {initialData?.id ? "Update Time Slot" : "Add Time Slot"}
          </span>
        )}
      </Button>
    </form>
  );
}
