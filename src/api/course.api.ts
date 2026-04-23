import { axiosClient } from "./axiosclient";
import { Course, CreateCourseDto, UpdateCourseDto } from "../schemas/course";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
};

type BackendCourse = {
  id: string;
  code: string;
  title: string;
  programId?: string | null;
  program?: {
    id: string;
    name: string;
  } | null;
  courseOfferings?: Array<{
    semester?: {
      id: string;
      name: string;
      isActive?: boolean;
      isCurrent?: boolean;
      startDate?: string;
    } | null;
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
    programId: course.program?.id ?? course.programId ?? "",
    program: course.program?.name ?? "Unassigned Program",
    semesterId,
    semester: semesterName,
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

export const createCourse = async (course: CreateCourseDto): Promise<Course> => {
  const payload: Record<string, unknown> = {
    code: course.code,
    title: course.name,
    programId: course.programId,
  };
  if (course.semesterId) payload.semesterId = course.semesterId;
  const response = await axiosClient.post<ApiEnvelope<BackendCourse>>("/courses", payload);
  if (!response.data?.data) throw new Error("Created course not found in API response");
  return mapBackendCourse(response.data.data);
};

export const updateCourse = async ({ id, data }: { id: string; data: UpdateCourseDto }): Promise<Course> => {
  const payload: Record<string, unknown> = {};
  if (data.code) payload.code = data.code;
  if (data.name) payload.title = data.name;
  if (data.programId) payload.programId = data.programId;
  if (data.semesterId) payload.semesterId = data.semesterId;
  
  const response = await axiosClient.put<ApiEnvelope<BackendCourse>>(`/courses/${id}`, payload);
  if (!response.data?.data) throw new Error("Updated course not found in API response");
  return mapBackendCourse(response.data.data);
};

export const deleteCourse = async (id: string): Promise<void> => {
  await axiosClient.delete(`/courses/${id}`);
};
