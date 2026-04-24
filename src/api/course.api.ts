import { axiosClient } from "./axiosclient";
import { Course, CreateCourseDto, UpdateCourseDto } from "../schemas/course";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
};

export type CourseDetailOffering = {
  id: string;
  semesterId: string;
  semesterName: string;
  registrationsCount: number;
  examsCount: number;
};

export type CourseDetail = Course & {
  description?: string | null;
  credits?: number | null;
  offerings: CourseDetailOffering[];
};

type BackendCourse = {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  credits?: number | null;
  programId?: string | null;
  program?: {
    id: string;
    name: string;
  } | null;
  courseOfferings?: Array<{
    id?: string;
    semester?: {
      id: string;
      name: string;
      isActive?: boolean;
      isCurrent?: boolean;
      startDate?: string;
    } | null;
    _count?: { registrations?: number; exams?: number };
    registrations?: unknown[];
    exams?: unknown[];
  }>;
};

const resolveSemester = (course: BackendCourse) => {
  const offerings = course.courseOfferings ?? [];
  const currentOffering = offerings.find(
    (offering) => offering.semester?.isCurrent || offering.semester?.isActive
  );
  const latestOffering = offerings[0];
  const semester = currentOffering?.semester ?? latestOffering?.semester;

  return {
    semesterId: semester?.id ?? "",
    semesterName: semester?.name ?? "Assigned through offerings",
  };
};

const mapBackendCourse = (course: BackendCourse): Course => {
  const { semesterId, semesterName } = resolveSemester(course);

  return {
    id: course.id,
    code: course.code,
    name: course.title,
    credits: course.credits ?? undefined,
    programId: course.program?.id ?? course.programId ?? "",
    programRef: course.program ?? null,
    program: course.program?.name ?? "Unassigned Program",
    semesterId,
    semester: semesterName,
    courseOfferings: course.courseOfferings ?? [],
  };
};

export const fetchCourses = async (): Promise<Course[]> => {
  const response = await axiosClient.get<ApiEnvelope<{ data: BackendCourse[], meta?: unknown }>>("/courses", {
    params: { limit: 100 },
  });
  return (response.data?.data?.data || []).map(mapBackendCourse);
};

export const fetchCourse = async (id: string): Promise<Course> => {
  const response = await axiosClient.get<ApiEnvelope<BackendCourse>>(`/courses/${id}`);
  if (!response.data?.data) throw new Error("Course not found in API response");
  return mapBackendCourse(response.data.data);
};

export const fetchCourseDetail = async (id: string): Promise<CourseDetail> => {
  const response = await axiosClient.get<ApiEnvelope<BackendCourse>>(`/courses/${id}`);
  if (!response.data?.data) throw new Error("Course not found in API response");
  const c = response.data.data;
  const base = mapBackendCourse(c);
  return {
    ...base,
    description: c.description ?? null,
    credits: c.credits ?? undefined,
    offerings: (c.courseOfferings ?? [])
      .filter((o) => o.id)
      .map((o) => ({
        id: o.id as string,
        semesterId: o.semester?.id ?? "",
        semesterName: o.semester?.name ?? "Unknown Semester",
        registrationsCount: o.registrations?.length ?? o._count?.registrations ?? 0,
        examsCount: o.exams?.length ?? o._count?.exams ?? 0,
      })),
  };
};

export const createCourse = async (course: CreateCourseDto): Promise<Course> => {
  const payload: Record<string, unknown> = {
    code: course.code,
    title: course.name,
    programId: course.programId,
  };
  if (course.credits !== undefined) payload.credits = course.credits;
  if (course.semesterId) payload.semesterId = course.semesterId;
  const response = await axiosClient.post<ApiEnvelope<BackendCourse>>("/courses", payload);
  if (!response.data?.data) throw new Error("Created course not found in API response");
  return mapBackendCourse(response.data.data);
};

export const updateCourse = async ({ id, data }: { id: string; data: UpdateCourseDto }): Promise<Course> => {
  const payload: Record<string, unknown> = {};
  if (data.code) payload.code = data.code;
  if (data.name) payload.title = data.name;
  if (data.credits !== undefined) payload.credits = data.credits;
  if (data.programId) payload.programId = data.programId;
  if (data.semesterId) payload.semesterId = data.semesterId;
  
  const response = await axiosClient.put<ApiEnvelope<BackendCourse>>(`/courses/${id}`, payload);
  if (!response.data?.data) throw new Error("Updated course not found in API response");
  return mapBackendCourse(response.data.data);
};

export const deleteCourse = async (id: string): Promise<void> => {
  await axiosClient.delete(`/courses/${id}`);
};
