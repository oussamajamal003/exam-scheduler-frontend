import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supervisorSchema, Supervisor } from "../../schemas/supervisor";
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
import { useDepartments } from "../../hooks/departments/useDepartments";
import { useCenters } from "../../hooks/centers/useCenters";

interface SupervisorFormProps {
  initialData?: Supervisor;
  onSubmit: (data: Supervisor) => void;
  isLoading?: boolean;
  submitErrorMessage?: string | null;
  submitValidationMessages?: Record<string, string[]>;
}

export function SupervisorForm({ 
  initialData, 
  onSubmit, 
  isLoading,
  submitErrorMessage,
  submitValidationMessages = {}
}: SupervisorFormProps) {
  const form = useForm({
    resolver: zodResolver(supervisorSchema),
    defaultValues: initialData || {
      name: "",
      email: "",
      department: "",
      centerId: "",
      center: "",
    },
    mode: "onChange",
  });

  const departmentsQuery = useDepartments("");
  const centersQuery = useCenters("");
  const departments = departmentsQuery.data ?? [];
  const centers = centersQuery.data ?? [];

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
      return;
    }

    form.reset({
      name: "",
      email: "",
      department: "",
      centerId: "",
      center: "",
    });
  }, [form, initialData]);

  const selectedDepartment = form.watch("department");
  const selectedCenterId = form.watch("centerId");
  const selectedCenter = useMemo(
    () => centers.find((center) => center.id === selectedCenterId) ?? null,
    [centers, selectedCenterId]
  );

  useEffect(() => {
    if (!selectedDepartment || departmentsQuery.isLoading) {
      return;
    }

    const departmentStillExists = departments.some(
      (department) => department.name === selectedDepartment
    );

    if (!departmentStillExists) {
      form.setValue("department", "", {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  }, [departments, departmentsQuery.isLoading, form, selectedDepartment]);

  const hasFieldErrors = Object.keys(form.formState.errors).length > 0;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {submitErrorMessage && (
        <div className="flex items-start gap-2.5 rounded-none bg-destructive/10 px-4 py-3 border border-destructive/20">
          <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-destructive leading-snug">{submitErrorMessage}</p>
        </div>
      )}

      <div className="space-y-2.5">
        <Label htmlFor="name" className="text-sm font-semibold text-zinc-950">
          Name
        </Label>
        <div className="relative">
          <Input
            id="name"
            {...form.register("name")}
            className={cn(
              "h-10 rounded-none border-zinc-200 bg-white/50 text-sm transition-all",
              (form.formState.errors.name || submitValidationMessages?.name)
                ? "border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30"
                : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
            )}
            placeholder="e.g., Mohamed Ali"
            disabled={isLoading}
          />
          {(form.formState.errors.name || submitValidationMessages?.name) && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-destructive" />
          )}
          {!form.formState.errors.name && !submitValidationMessages?.name && !!form.watch("name") && (
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
        <Label htmlFor="email" className="text-sm font-semibold text-zinc-950">
          Email
        </Label>
        <div className="relative">
          <Input
            id="email"
            type="email"
            {...form.register("email")}
            className={cn(
              "h-10 rounded-none border-zinc-200 bg-white/50 text-sm transition-all",
              (form.formState.errors.email || submitValidationMessages?.email)
                ? "border-destructive/60 bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/30"
                : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
            )}
            placeholder="e.g., m.ali@university.edu"
            disabled={isLoading}
          />
          {(form.formState.errors.email || submitValidationMessages?.email) && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-destructive" />
          )}
          {!form.formState.errors.email && !submitValidationMessages?.email && !!form.watch("email") && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-emerald-500" />
          )}
        </div>
        {(form.formState.errors.email || submitValidationMessages?.email) && (
          <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-destructive leading-snug">
              {(form.formState.errors.email?.message ?? submitValidationMessages?.email?.[0]) as string}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="department" className="text-sm font-semibold text-zinc-950">
          Department
        </Label>
        <Select
          value={selectedDepartment || undefined}
          onValueChange={(value) => {
            form.setValue("department", value, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });
          }}
          disabled={isLoading || departmentsQuery.isLoading || departments.length === 0}
        >
          <SelectTrigger
            id="department"
            className={cn(
              "h-10 w-full rounded-none border-zinc-200 bg-white/50 text-sm transition-all",
              (form.formState.errors.department || submitValidationMessages?.department)
                ? "border-destructive/60 bg-destructive/5"
                : "hover:border-zinc-300 focus-visible:border-zinc-400"
            )}
          >
            <SelectValue
              placeholder={
                departmentsQuery.isLoading
                  ? "Loading departments..."
                  : departments.length === 0
                    ? "No departments available"
                    : "Select a department"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {departments.map((department) => (
              <SelectItem key={department.id} value={department.name}>
                {`${department.name} (${department.code})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(form.formState.errors.department || submitValidationMessages?.department) && (
          <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-destructive leading-snug">
              {(form.formState.errors.department?.message ?? submitValidationMessages?.department?.[0]) as string}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="center" className="text-sm font-semibold text-zinc-950">
          Center
        </Label>
        <Select
          value={selectedCenterId || undefined}
          onValueChange={(value) => {
            const center = centers.find((item) => item.id === value);
            form.setValue("centerId", value, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });
            form.setValue("center", center?.name ?? "", {
              shouldDirty: true,
            });
          }}
          disabled={isLoading || centersQuery.isLoading || centers.length === 0}
        >
          <SelectTrigger
            id="center"
            className={cn(
              "h-10 w-full rounded-none border-zinc-200 bg-white/50 text-sm transition-all",
              (form.formState.errors.centerId || submitValidationMessages?.centerId)
                ? "border-destructive/60 bg-destructive/5"
                : "hover:border-zinc-300 focus-visible:border-zinc-400"
            )}
          >
            <SelectValue
              placeholder={
                centersQuery.isLoading
                  ? "Loading centers..."
                  : centers.length === 0
                    ? "No centers available"
                    : "Select a center"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {centers.map((center) => (
              <SelectItem key={center.id} value={center.id}>
                {center.location ? `${center.name} (${center.location})` : center.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedCenter && (
          <p className="text-xs text-zinc-500">
            Selected center: {selectedCenter.name}
            {selectedCenter.location ? `, ${selectedCenter.location}` : ""}
          </p>
        )}
        {(form.formState.errors.centerId || submitValidationMessages?.centerId) && (
          <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-destructive leading-snug">
              {(form.formState.errors.centerId?.message ?? submitValidationMessages?.centerId?.[0]) as string}
            </p>
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading || hasFieldErrors}
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
            {initialData ? "Update Supervisor" : "Add Supervisor"}
          </span>
        )}
      </Button>
    </form>
  );
}
