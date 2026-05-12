import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { proctorSchema, Proctor } from "../../schemas/proctor";
import { TimeSlot } from "../../schemas/timeSlot";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { ScrollArea } from "../../components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { AlertCircle, CheckCircle2, ChevronsUpDown, Clock3, Search, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { useDepartments } from "../../hooks/departments/useDepartments";
import { useCenters } from "../../hooks/centers/useCenters";
import { useTimeSlots } from "../../hooks/timeSlots/useTimeSlots";

const formatTimeSlotLabel = (slot: TimeSlot) => {
  const date = slot.date || slot.startTime;
  const day = date
    ? new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    : "Unknown day";
  const start = new Date(slot.startTime).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
  const end = new Date(slot.endTime).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });

  return `${day} • ${start} - ${end}`;
};

interface ProctorFormProps {
  initialData?: Proctor;
  onSubmit: (data: Proctor) => void;
  isLoading?: boolean;
  submitErrorMessage?: string | null;
  submitValidationMessages?: Record<string, string[]>;
}

export function ProctorForm({ 
  initialData, 
  onSubmit, 
  isLoading,
  submitErrorMessage,
  submitValidationMessages = {}
}: ProctorFormProps) {
  const [timeSlotSearch, setTimeSlotSearch] = useState("");
  const form = useForm({
    resolver: zodResolver(proctorSchema),
    defaultValues: initialData || {
      name: "",
      email: "",
      department: "",
      centerId: "",
      center: "",
      timeSlotIds: [],
    },
    mode: "onChange",
  });

  const departmentsQuery = useDepartments("");
  const centersQuery = useCenters("");
  const timeSlotsQuery = useTimeSlots();
  const departments = useMemo(() => departmentsQuery.data ?? [], [departmentsQuery.data]);
  const centers = useMemo(() => centersQuery.data ?? [], [centersQuery.data]);
  const timeSlots = useMemo(() => timeSlotsQuery.data ?? [], [timeSlotsQuery.data]);

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
      timeSlotIds: [],
    });
  }, [form, initialData]);

  const watchedName = useWatch({ control: form.control, name: "name" });
  const watchedEmail = useWatch({ control: form.control, name: "email" });
  const selectedDepartment = useWatch({ control: form.control, name: "department" });
  const selectedDepartmentId = useMemo(
    () => departments.find((department) => department.name === selectedDepartment)?.id,
    [departments, selectedDepartment]
  );
  const selectedCenterId = useWatch({ control: form.control, name: "centerId" });
  const watchedTimeSlotIds = useWatch({ control: form.control, name: "timeSlotIds" });
  const selectedTimeSlotIds = useMemo(() => watchedTimeSlotIds ?? [], [watchedTimeSlotIds]);
  const selectedCenter = useMemo(
    () => centers.find((center) => center.id === selectedCenterId) ?? null,
    [centers, selectedCenterId]
  );
  const selectedTimeSlots = useMemo(() => {
    const selectedIds = new Set(selectedTimeSlotIds);
    return timeSlots.filter((slot) => selectedIds.has(slot.id));
  }, [selectedTimeSlotIds, timeSlots]);
  const filteredTimeSlots = useMemo(() => {
    const term = timeSlotSearch.trim().toLowerCase();
    if (!term) return timeSlots;
    return timeSlots.filter((slot) => formatTimeSlotLabel(slot).toLowerCase().includes(term));
  }, [timeSlotSearch, timeSlots]);

  const toggleTimeSlot = (timeSlotId: string) => {
    const nextIds = selectedTimeSlotIds.includes(timeSlotId)
      ? selectedTimeSlotIds.filter((id) => id !== timeSlotId)
      : [...selectedTimeSlotIds, timeSlotId];

    form.setValue("timeSlotIds", nextIds, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

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
          {!form.formState.errors.name && !submitValidationMessages?.name && !!watchedName && (
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
          {!form.formState.errors.email && !submitValidationMessages?.email && !!watchedEmail && (
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
          value={selectedDepartmentId || undefined}
          onValueChange={(value) => {
            const department = departments.find((item) => item.id === value);
            form.setValue("department", department?.name ?? "", {
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
              <SelectItem key={department.id ?? department.code} value={department.id ?? department.code}>
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

      <div className="space-y-2.5">
        <Label className="text-sm font-semibold text-zinc-950">Available Time Slots</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={isLoading || timeSlotsQuery.isLoading}
              className="h-10 w-full justify-between rounded-none border-zinc-200 bg-white/50 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <span className="truncate">
                {timeSlotsQuery.isLoading
                  ? "Loading time slots..."
                  : selectedTimeSlots.length > 0
                    ? `${selectedTimeSlots.length} slot${selectedTimeSlots.length === 1 ? "" : "s"} selected`
                    : "Select available time slots"}
              </span>
              <ChevronsUpDown className="size-4 text-zinc-400" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-88 p-3" align="start">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={timeSlotSearch}
                  onChange={(event) => setTimeSlotSearch(event.target.value)}
                  placeholder="Search by date or time"
                  className="h-9 rounded-none border-zinc-200 pl-9 text-sm"
                />
              </div>
              <ScrollArea className="h-52 rounded-none border border-zinc-200/70">
                <div className="space-y-1 p-2">
                  {filteredTimeSlots.length === 0 ? (
                    <p className="px-2 py-4 text-sm text-zinc-500">No time slots match this search.</p>
                  ) : (
                    filteredTimeSlots.map((slot) => {
                      const isSelected = selectedTimeSlotIds.includes(slot.id);
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => toggleTimeSlot(slot.id)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-none border px-3 py-2 text-left text-sm transition-colors",
                            isSelected
                              ? "border-zinc-950 bg-zinc-950 text-white"
                              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                          )}
                        >
                          <span className="pr-3">{formatTimeSlotLabel(slot)}</span>
                          {isSelected ? <CheckCircle2 className="size-4 shrink-0" /> : <Clock3 className="size-4 shrink-0 text-zinc-400" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          </PopoverContent>
        </Popover>
        <p className="text-xs text-zinc-500">
          Only selected slots will be considered when assigning this proctor manually or automatically.
        </p>
        {selectedTimeSlots.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTimeSlots.map((slot) => (
              <Badge key={slot.id} variant="secondary" className="max-w-full rounded-none px-2 py-1 normal-case tracking-normal">
                <span className="truncate">{formatTimeSlotLabel(slot)}</span>
                <button
                  type="button"
                  onClick={() => toggleTimeSlot(slot.id)}
                  className="ml-1 inline-flex size-4 items-center justify-center rounded-none hover:bg-zinc-200/70"
                  aria-label={`Remove ${formatTimeSlotLabel(slot)}`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
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
            {initialData ? "Update Proctor" : "Add Proctor"}
          </span>
        )}
      </Button>
    </form>
  );
}
