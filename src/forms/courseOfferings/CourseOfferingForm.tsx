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
  instructor: z.string().min(1, { message: "Instructor name is required" }),
  days: z.array(z.string()).min(1, { message: "Please select at least one day" }),
  time: z.string().min(1, { message: "Class time is required" }),
  capacity: z
    .string()
    .min(1, { message: "Capacity is required" })
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
      message: "Capacity must be a positive number",
    }),
  status: z.enum(["ACTIVE", "INACTIVE", "CANCELLED"]).optional(),
});

const parseDays = (raw?: string | null): string[] =>
  (raw ?? "")
    .split(",")
    .map((d) => d.trim())
    .filter((d) => DAYS.includes(d));

type CourseGroup = {
  key: string;
  label: string;
  courses: OfferingCourse[];
  semesterIds: string[];
};

const normalizeCoursePart = (value?: string | number | null) =>
  String(value ?? "").trim().toLowerCase();

const getCourseSemesterId = (course: OfferingCourse) =>
  course.semesterId ?? course.semesterIds?.[0] ?? null;

const getCourseGroupKey = (course: OfferingCourse) =>
  [
    normalizeCoursePart(course.code),
    normalizeCoursePart(course.title ?? course.name),
    normalizeCoursePart(course.program?.id),
    normalizeCoursePart(course.credits),
  ].join("|");

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
      days: parseDays(initialData?.day),
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
      days: parseDays(initialData?.day),
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
  const selectedDays = useWatch({
    control: form.control,
    name: "days",
  }) ?? [];

  const toggleDay = (day: string) => {
    const current = form.getValues("days") ?? [];
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    // Preserve canonical week order
    const ordered = DAYS.filter((d) => next.includes(d));
    form.setValue("days", ordered, { shouldDirty: true, shouldTouch: true });
  };
  const selectedStatus = useWatch({
    control: form.control,
    name: "status",
  });
  const groupedCourses = useMemo(() => {
    const groups = new Map<string, CourseGroup>();

    courses.forEach((course) => {
      const key = getCourseGroupKey(course);
      const label = `${course.name ?? course.title} (${course.code})`;
      const existing = groups.get(key);
      const group = existing ?? { key, label, courses: [], semesterIds: [] };
      const semesterIds = [getCourseSemesterId(course), ...(course.semesterIds ?? [])].filter(
        (id): id is string => Boolean(id)
      );

      group.courses.push(course);
      semesterIds.forEach((id) => {
        if (!group.semesterIds.includes(id)) group.semesterIds.push(id);
      });
      groups.set(key, group);
    });

    return Array.from(groups.values());
  }, [courses]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) ?? null,
    [courses, selectedCourseId]
  );
  const selectedCourseGroup = useMemo(
    () =>
      groupedCourses.find((group) =>
        group.courses.some((course) => course.id === selectedCourseId)
      ) ?? null,
    [groupedCourses, selectedCourseId]
  );
  const selectedCourseGroupKey = selectedCourseGroup?.key ?? "";
  const resolvedCourse = selectedCourseGroup?.courses[0] ?? selectedCourse;

  // Restrict semester selector to semesters this course already has offerings in.
  // When editing, always keep the offering's current semester in the list so it
  // can still be displayed and re-selected.
  const initialSemesterId = initialData?.semesterId;
  const resolvedSemesterIds = selectedCourseGroup?.semesterIds;
  const allowedSemesterIds = useMemo(() => {
    const ids = new Set<string>(resolvedSemesterIds ?? []);
    if (initialSemesterId) ids.add(initialSemesterId);
    return ids;
  }, [resolvedSemesterIds, initialSemesterId]);

  const isCourseSelected = Boolean(selectedCourseGroupKey);
  const isCourseDetailLoading = false;
  const availableSemesters = useMemo(() => {
    if (!isCourseSelected) return semesters;
    if (allowedSemesterIds.size === 0) return [];
    return semesters.filter((s) => allowedSemesterIds.has(s.id));
  }, [isCourseSelected, allowedSemesterIds, semesters]);
  const isCourseMissingSemesters =
    isCourseSelected && !isCourseDetailLoading && availableSemesters.length === 0;
  const semesterErrorMessage = selectedSemesterId || isCourseMissingSemesters
    ? null
    : form.formState.errors.semesterId?.message ??
      submitValidationMessages?.semesterId?.[0] ??
      null;

  const selectCourseForSemester = (semesterId: string) => {
    const matchingCourse = selectedCourseGroup?.courses.find(
      (course) => getCourseSemesterId(course) === semesterId
    );
    if (matchingCourse && matchingCourse.id !== selectedCourseId) {
      form.setValue("courseId", matchingCourse.id, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  };

  // Clear the semesterId if the currently selected course doesn't include it.
  useEffect(() => {
    if (!isCourseSelected) return;
    if (isCourseDetailLoading) return;
    if (!selectedSemesterId) return;
    if (allowedSemesterIds.size === 0) return;
    if (!allowedSemesterIds.has(selectedSemesterId)) {
      form.setValue("semesterId", "", {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  }, [
    isCourseSelected,
    isCourseDetailLoading,
    selectedSemesterId,
    allowedSemesterIds,
    form,
  ]);

  const handleSubmit = (values: OfferingFormValues) => {
    const courseForSemester = selectedCourseGroup?.courses.find(
      (course) => getCourseSemesterId(course) === values.semesterId
    );
    const payload: CreateCourseOfferingDto = {
      courseId: courseForSemester?.id ?? values.courseId,
      semesterId: values.semesterId,
      instructor: values.instructor?.trim() || undefined,
      day: values.days && values.days.length > 0 ? values.days.join(", ") : undefined,
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
          value={selectedCourseGroupKey || undefined}
          onValueChange={(value) => {
            const group = groupedCourses.find((g) => g.key === value);
            const currentSemesterId = form.getValues("semesterId");
            const courseForSemester = group?.courses.find(
              (course) => getCourseSemesterId(course) === currentSemesterId
            );
            const nextCourse = courseForSemester ?? group?.courses[0];

            form.setValue("courseId", nextCourse?.id ?? "", {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });

            if (currentSemesterId && !group?.semesterIds.includes(currentSemesterId)) {
              form.setValue("semesterId", "", {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              });
            }
          }}
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
            {groupedCourses.map((group) => (
              <SelectItem key={group.key} value={group.key}>
                {group.label}
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
          onValueChange={(value) => {
            form.setValue("semesterId", value, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });
            form.clearErrors("semesterId");
            selectCourseForSemester(value);
          }}
          disabled={
            isLoading ||
            isSemestersLoading ||
            !isCourseSelected ||
            isCourseDetailLoading ||
            (isCourseSelected && availableSemesters.length === 0)
          }
        >
          <SelectTrigger
            id="offering-semester"
            className={cn(
              "h-10 w-full rounded-none border-zinc-200 bg-white/50 text-sm transition-all",
              semesterErrorMessage
                ? "border-destructive/60 bg-destructive/5"
                : "hover:border-zinc-300 focus-visible:border-zinc-400"
            )}
          >
            <SelectValue
              placeholder={
                isSemestersLoading
                  ? "Loading semesters..."
                  : isCourseDetailLoading
                  ? "Loading course semesters..."
                  : isCourseSelected && availableSemesters.length === 0
                  ? "This course has no semesters yet"
                  : !isCourseSelected
                  ? "Select a course first"
                  : "Select a semester"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {availableSemesters.map((semester) => (
              <SelectItem key={semester.id} value={semester.id}>
                {semester.isActive ? `${semester.name} (Active)` : semester.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isCourseMissingSemesters && (
            <p className="text-[11px] text-zinc-500">
              This course isn&apos;t linked to any semester yet. Pick another
              course or add it to a semester first.
            </p>
          )}
        {semesterErrorMessage && (
          <p className="text-xs font-medium text-destructive">
            {semesterErrorMessage}
          </p>
        )}
      </div>

      {/* Instructor */}
      <div className="space-y-2.5">
        <Label htmlFor="offering-instructor" className="text-sm font-semibold text-zinc-950">
          Instructor <span className="text-destructive">*</span>
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
              form.formState.errors.instructor
                ? "border-destructive/60 bg-destructive/5"
                : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
            )}
          />
          {selectedInstructor && !form.formState.errors.instructor && (
            <CheckCircle2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-emerald-500" />
          )}
        </div>
        {form.formState.errors.instructor && (
          <p className="text-xs font-medium text-destructive">
            {form.formState.errors.instructor.message}
          </p>
        )}
      </div>

      {/* Day & Time */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2.5">
          <Label htmlFor="offering-day" className="text-sm font-semibold text-zinc-950">
            Days <span className="text-destructive">*</span>
          </Label>
          <div
            id="offering-day"
            role="group"
            aria-label="Days"
            className="flex flex-wrap gap-1.5"
          >
            {DAYS.map((day) => {
              const active = selectedDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  disabled={isLoading}
                  aria-label={`${active ? "Unselect" : "Select"} ${day}`}
                  data-state={active ? "on" : "off"}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-none border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300/50",
                    active
                      ? "border-zinc-950 bg-zinc-950 text-white hover:bg-zinc-800"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50",
                    isLoading && "opacity-60 cursor-not-allowed"
                  )}
                >
                  {active && <CheckCircle2 className="size-3.5" />}
                  {day.slice(0, 3)}
                </button>
              );
            })}
          </div>
          {selectedDays.length > 0 ? (
            <p className="text-[11px] text-zinc-500">
              {selectedDays.length}{" "}
              {selectedDays.length === 1 ? "day" : "days"} selected
            </p>
          ) : form.formState.errors.days ? (
            <p className="text-xs font-medium text-destructive">
              {form.formState.errors.days.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="offering-time" className="text-sm font-semibold text-zinc-950">
            Time <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              id="offering-time"
              type="time"
              {...form.register("time")}
              disabled={isLoading}
              className={cn(
                "h-10 rounded-none border-zinc-200 bg-white/50 pl-9 text-sm",
                form.formState.errors.time
                  ? "border-destructive/60 bg-destructive/5"
                  : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
              )}
            />
          </div>
          {form.formState.errors.time && (
            <p className="text-xs font-medium text-destructive">
              {form.formState.errors.time.message}
            </p>
          )}
        </div>
      </div>

      {/* Capacity & Status */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2.5">
          <Label htmlFor="offering-capacity" className="text-sm font-semibold text-zinc-950">
            Capacity <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              id="offering-capacity"
              type="number"
              min={1}
              {...form.register("capacity")}
              disabled={isLoading}
              placeholder="e.g., 40"
              className={cn(
                "h-10 rounded-none border-zinc-200 bg-white/50 pl-9 text-sm",
                form.formState.errors.capacity
                  ? "border-destructive/60 bg-destructive/5"
                  : "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/50"
              )}
            />
          </div>
          {form.formState.errors.capacity && (
            <p className="text-xs font-medium text-destructive">
              {form.formState.errors.capacity.message}
            </p>
          )}
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
            <span>{selectedCourse.name ?? selectedCourse.title}</span>
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
