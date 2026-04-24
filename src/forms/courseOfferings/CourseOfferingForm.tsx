import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  GraduationCap,
  Hash,
  Loader2,
  UserCircle2,
} from "lucide-react";
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
import { cn } from "../../lib/utils";
import type {
  CourseOffering,
  CreateCourseOfferingDto,
  OfferingCourse,
} from "../../schemas/courseOffering";
import type { Semester } from "../../schemas/semester";
import { useSelectedCourseForOffering } from "../../hooks/courseOfferings/useCourseOfferings";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const offeringFormSchema = z.object({
  courseId: z.string().min(1, { message: "Please select a course" }),
  semesterId: z.string().min(1, { message: "Please select a semester" }),
  instructor: z.string().optional(),
  day: z.string().optional(),
  time: z.string().optional(),
  capacity: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "CANCELLED"]).optional(),
});

type OfferingFormValues = z.infer<typeof offeringFormSchema>;

export interface CourseOfferingFormProps {
  initialData?: CourseOffering;
  courses: OfferingCourse[];
  semesters: Semester[];
  isCoursesLoading?: boolean;
  isSemestersLoading?: boolean;
  coursesErrorMessage?: string;
  semestersErrorMessage?: string;
  submitErrorMessage?: string;
  submitValidationMessages?: Record<string, string[]>;
  isLoading?: boolean;
  onSubmit: (data: CreateCourseOfferingDto) => void | Promise<void>;
}

export function CourseOfferingForm({
  initialData,
  courses,
  semesters,
  isCoursesLoading,
  isSemestersLoading,
  coursesErrorMessage,
  semestersErrorMessage,
  submitErrorMessage,
  submitValidationMessages,
  isLoading,
  onSubmit,
}: CourseOfferingFormProps) {
  const form = useForm<OfferingFormValues>({
    resolver: zodResolver(offeringFormSchema),
    defaultValues: {
      courseId: initialData?.courseId ?? "",
      semesterId: initialData?.semesterId ?? "",
      instructor: initialData?.instructor ?? "",
      day: initialData?.day ?? "",
      time: initialData?.time ?? "",
      capacity:
        initialData?.capacity !== undefined && initialData?.capacity !== null
          ? String(initialData.capacity)
          : "",
      status: initialData?.status ?? "ACTIVE",
    },
    mode: "onChange",
  });

  useEffect(() => {
    form.reset({
      courseId: initialData?.courseId ?? "",
      semesterId: initialData?.semesterId ?? "",
      instructor: initialData?.instructor ?? "",
      day: initialData?.day ?? "",
      time: initialData?.time ?? "",
      capacity:
        initialData?.capacity !== undefined && initialData?.capacity !== null
          ? String(initialData.capacity)
          : "",
      status: initialData?.status ?? "ACTIVE",
    });
  }, [form, initialData]);

  const selectedCourseId = useWatch({
    control: form.control,
    name: "courseId",
  });
  const selectedSemesterId = useWatch({
    control: form.control,
    name: "semesterId",
  });
  const selectedInstructor = useWatch({
    control: form.control,
    name: "instructor",
  });
  const selectedDay = useWatch({
    control: form.control,
    name: "day",
  });
  const selectedStatus = useWatch({
    control: form.control,
    name: "status",
  });
  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) ?? null,
    [courses, selectedCourseId]
  );
  const selectedCourseQuery = useSelectedCourseForOffering(selectedCourseId);
  const resolvedCourse = selectedCourseQuery.data ?? selectedCourse;

  const handleSubmit = (values: OfferingFormValues) => {
    const payload: CreateCourseOfferingDto = {
      courseId: values.courseId,
      semesterId: values.semesterId,
      instructor: values.instructor?.trim() || undefined,
      day: values.day?.trim() || undefined,
      time: values.time?.trim() || undefined,
      status: values.status,
    };

    if (values.capacity && values.capacity.trim()) {
      const capacityNumber = Number(values.capacity);
      if (!Number.isNaN(capacityNumber) && capacityNumber >= 0) {
        payload.capacity = capacityNumber;
      }
    }

    return onSubmit(payload);
  };

  const hasErrors = Object.keys(form.formState.errors).length > 0;
  const isSubmitDisabled =
    Boolean(isLoading) ||
    hasErrors ||
    Boolean(isCoursesLoading) ||
    Boolean(isSemestersLoading) ||
    Boolean(coursesErrorMessage) ||
    Boolean(semestersErrorMessage) ||
    courses.length === 0 ||
    semesters.length === 0;

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
      {(coursesErrorMessage || semestersErrorMessage) && (
        <div className="space-y-2">
          {coursesErrorMessage && (
            <div className="rounded-none border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {coursesErrorMessage}
            </div>
          )}
          {semestersErrorMessage && (
            <div className="rounded-none border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {semestersErrorMessage}
            </div>
          )}
        </div>
      )}

      {!isCoursesLoading && !coursesErrorMessage && courses.length === 0 && (
        <div className="rounded-none border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
          No courses are available yet. Create a course first, then add an offering.
        </div>
      )}

      {!isSemestersLoading && !semestersErrorMessage && semesters.length === 0 && (
        <div className="rounded-none border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
          No semesters are available yet. Create a semester first, then add an offering.
        </div>
      )}

      {submitErrorMessage && (
        <div className="flex items-start gap-2 rounded-none bg-destructive/10 px-3 py-2.5 border border-destructive/20">
          <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-destructive leading-snug">{submitErrorMessage}</p>
        </div>
      )}

      {/* Course */}
      <div className="space-y-2.5">
        <Label htmlFor="offering-course" className="text-sm font-semibold text-zinc-950">
          Course
        </Label>
        <Select
          value={selectedCourseId || undefined}
          onValueChange={(value) =>
            form.setValue("courseId", value, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            })
          }
          disabled={isLoading || isCoursesLoading}
        >
          <SelectTrigger
            id="offering-course"
            className={cn(
              "h-10 w-full rounded-none border-zinc-200 bg-white/50 text-sm transition-all",
              form.formState.errors.courseId || submitValidationMessages?.courseId
                ? "border-destructive/60 bg-destructive/5"
                : "hover:border-zinc-300 focus-visible:border-zinc-400"
            )}
          >
            <SelectValue placeholder={isCoursesLoading ? "Loading courses..." : "Select a course"} />
          </SelectTrigger>
          <SelectContent>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {`${course.title} (${course.code})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(form.formState.errors.courseId || submitValidationMessages?.courseId) && (
          <p className="text-xs font-medium text-destructive">
            {form.formState.errors.courseId?.message ?? submitValidationMessages?.courseId?.[0]}
          </p>
        )}
      </div>

      {/* Program (auto-derived from course, read-only) */}
      <div className="space-y-2.5">
        <Label className="text-sm font-semibold text-zinc-950">Program</Label>
        <div className="flex items-center gap-3 rounded-none border border-zinc-200 bg-zinc-50/60 px-3 py-2.5">
          <GraduationCap className="size-4 shrink-0 text-zinc-600" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-950 truncate">
              {resolvedCourse?.program?.name ?? "Auto-filled from course"}
            </p>
            <p className="text-xs text-zinc-500">
              {resolvedCourse
                ? "Program inherited from the selected course."
                : "Pick a course above to populate its program."}
            </p>
          </div>
        </div>
      </div>

      {/* Semester */}
      <div className="space-y-2.5">
        <Label htmlFor="offering-semester" className="text-sm font-semibold text-zinc-950">
          Semester
        </Label>
        <Select
          value={selectedSemesterId || undefined}
          onValueChange={(value) =>
            form.setValue("semesterId", value, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            })
          }
          disabled={isLoading || isSemestersLoading}
        >
          <SelectTrigger
            id="offering-semester"
            className={cn(
              "h-10 w-full rounded-none border-zinc-200 bg-white/50 text-sm transition-all",
              form.formState.errors.semesterId || submitValidationMessages?.semesterId
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
        {(form.formState.errors.semesterId || submitValidationMessages?.semesterId) && (
          <p className="text-xs font-medium text-destructive">
            {form.formState.errors.semesterId?.message ?? submitValidationMessages?.semesterId?.[0]}
          </p>
        )}
      </div>

      {/* Instructor */}
      <div className="space-y-2.5">
        <Label htmlFor="offering-instructor" className="text-sm font-semibold text-zinc-950">
          Instructor
        </Label>
        <div className="relative">
          <UserCircle2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <Input
            id="offering-instructor"
            {...form.register("instructor")}
            disabled={isLoading}
            placeholder="e.g., Dr. Sarah Khan"
            className={cn(
              "h-10 rounded-none border-zinc-200 bg-white/50 pl-9 pr-10 text-sm transition-all",
              "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
            )}
          />
          {selectedInstructor && (
            <CheckCircle2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-emerald-500" />
          )}
        </div>
      </div>

      {/* Day & Time */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2.5">
          <Label htmlFor="offering-day" className="text-sm font-semibold text-zinc-950">
            Day
          </Label>
          <Select
            value={selectedDay || undefined}
            onValueChange={(value) =>
              form.setValue("day", value, {
                shouldDirty: true,
                shouldTouch: true,
              })
            }
            disabled={isLoading}
          >
            <SelectTrigger
              id="offering-day"
              className="h-10 w-full rounded-none border-zinc-200 bg-white/50 text-sm hover:border-zinc-300 focus-visible:border-zinc-400"
            >
              <SelectValue placeholder="Select day" />
            </SelectTrigger>
            <SelectContent>
              {DAYS.map((day) => (
                <SelectItem key={day} value={day}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="offering-time" className="text-sm font-semibold text-zinc-950">
            Time
          </Label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              id="offering-time"
              type="time"
              {...form.register("time")}
              disabled={isLoading}
              className="h-10 rounded-none border-zinc-200 bg-white/50 pl-9 text-sm hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
            />
          </div>
        </div>
      </div>

      {/* Capacity & Status */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2.5">
          <Label htmlFor="offering-capacity" className="text-sm font-semibold text-zinc-950">
            Capacity{" "}
            <span className="text-xs font-normal text-zinc-400">(optional)</span>
          </Label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              id="offering-capacity"
              type="number"
              min={0}
              {...form.register("capacity")}
              disabled={isLoading}
              placeholder="e.g., 40"
              className="h-10 rounded-none border-zinc-200 bg-white/50 pl-9 text-sm hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
            />
          </div>
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="offering-status" className="text-sm font-semibold text-zinc-950">
            Status
          </Label>
          <Select
            value={selectedStatus || "ACTIVE"}
            onValueChange={(value) =>
              form.setValue("status", value as OfferingFormValues["status"], {
                shouldDirty: true,
                shouldTouch: true,
              })
            }
            disabled={isLoading}
          >
            <SelectTrigger
              id="offering-status"
              className="h-10 w-full rounded-none border-zinc-200 bg-white/50 text-sm hover:border-zinc-300 focus-visible:border-zinc-400"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Selected course summary */}
      {selectedCourse && (
        <div className="flex items-start gap-3 rounded-none border border-zinc-200 bg-white px-4 py-3">
          <Building2 className="mt-0.5 size-4 shrink-0 text-zinc-600" />
          <div className="min-w-0 text-xs text-zinc-600">
            <span className="font-semibold text-zinc-950">{selectedCourse.code}</span>
            <span className="mx-1">·</span>
            <span>{selectedCourse.credits ?? "—"} credits</span>
            <span className="mx-1">·</span>
            <span>{selectedCourse.program?.name ?? "Unassigned program"}</span>
          </div>
        </div>
      )}

      {hasErrors && (
        <div className="flex items-center gap-2 rounded-none border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="size-3.5" />
          <span>Please correct the highlighted fields before saving.</span>
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitDisabled}
        className="h-10 w-full rounded-none bg-zinc-950 font-semibold text-white shadow-sm shadow-zinc-950/10 transition-all hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Saving…
          </span>
        ) : (
          <span>{initialData?.id ? "Update Offering" : "Add Offering"}</span>
        )}
      </Button>
    </form>
  );
}
