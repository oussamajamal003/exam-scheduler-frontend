import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { centerFormSchema, CenterFormValues } from "../../schemas/center";
import type { Center } from "../../schemas/center";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { AlertCircle, Building2, CheckCircle2, MapPin } from "lucide-react";
import { cn } from "../../lib/utils";

interface CenterFormProps {
  initialData?: Partial<Center> & { id?: string };
  center?: Center | null;
  onSubmit: (data: CenterFormValues) => void;
  isLoading?: boolean;
  submitErrorMessage?: string;
  submitValidationMessages?: Record<string, string[]>;
}

export function CenterForm({
  initialData,
  center,
  onSubmit,
  isLoading,
  submitErrorMessage,
  submitValidationMessages,
}: CenterFormProps) {
  const initialSupervisors = useMemo(
    () => initialData?.supervisors ?? center?.supervisors ?? [],
    [center?.supervisors, initialData?.supervisors]
  );
  const form = useForm<CenterFormValues>({
    resolver: zodResolver(centerFormSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      location: initialData?.location ?? "",
      supervisorsText: initialSupervisors.join(", "),
    },
    mode: "onChange",
  });

  useEffect(() => {
    form.reset({
      name: initialData?.name ?? "",
      location: initialData?.location ?? "",
      supervisorsText: initialSupervisors.join(", "),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.name, initialData?.location, initialSupervisors]);

  const hasErrors = Object.keys(form.formState.errors).length > 0;
  const nameValue = form.watch("name");
  const locationValue = form.watch("location");
  const supervisorsTextValue = form.watch("supervisorsText");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {submitErrorMessage && (
        <div className="flex items-center gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20 text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <p className="text-sm font-medium leading-snug">{submitErrorMessage}</p>
        </div>
      )}

      <div className="space-y-2.5">
        <Label htmlFor="name" className="text-sm font-semibold text-zinc-950">Center Name</Label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
          <Input
            id="name"
            {...form.register("name")}
            className={cn(
              "h-10 pl-9 rounded-none border-zinc-200 bg-white/50 text-sm transition-all",
              form.formState.errors.name || submitValidationMessages?.name
                ? "border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30"
                : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
            )}
            disabled={isLoading}
            placeholder="e.g., Main Campus Center"
          />
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

      <div className="space-y-2.5">
        <Label htmlFor="location" className="text-sm font-semibold text-zinc-950">Location</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
          <Input
            id="location"
            {...form.register("location")}
            className={cn(
              "h-10 pl-9 rounded-none border-zinc-200 bg-white/50 text-sm transition-all",
              form.formState.errors.location || submitValidationMessages?.location
                ? "border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30"
                : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
            )}
            disabled={isLoading}
            placeholder="e.g., Building A, Floor 2"
          />
          {!form.formState.errors.location && !submitValidationMessages?.location && !!locationValue && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-emerald-500" />
          )}
        </div>
        {(form.formState.errors.location || submitValidationMessages?.location) && (
          <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-destructive leading-snug">
              {form.formState.errors.location?.message || submitValidationMessages?.location?.join(", ")}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="supervisorsText" className="text-sm font-semibold text-zinc-950">Center Supervisors</Label>
        <div className="relative">
          <Input
            id="supervisorsText"
            {...form.register("supervisorsText")}
            className={cn(
              "h-10 rounded-none border-zinc-200 bg-white/50 text-sm transition-all",
              form.formState.errors.supervisorsText || submitValidationMessages?.supervisors
                ? "border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30"
                : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
            )}
            disabled={isLoading}
            placeholder="e.g., Sara Ali, John Doe"
          />
          {!form.formState.errors.supervisorsText && !submitValidationMessages?.supervisors && !!supervisorsTextValue && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-emerald-500" />
          )}
        </div>
        {(form.formState.errors.supervisorsText || submitValidationMessages?.supervisors) && (
          <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-destructive leading-snug">
              {(form.formState.errors.supervisorsText?.message ?? submitValidationMessages?.supervisors?.[0]) as string}
            </p>
          </div>
        )}
      </div>

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
            {initialData?.id ? "Update Center" : "Add Center"}
          </span>
        )}
      </Button>
    </form>
  );
}
