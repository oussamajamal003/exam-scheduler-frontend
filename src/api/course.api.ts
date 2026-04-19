import { axiosClient } from "./axiosclient";
import { Course, CreateCourseDto, UpdateCourseDto } from "../schemas/course";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
};

const mapBackendCourse = (course: any): Course => ({
  id: course.id,
  code: course.code,
  name: course.title,
  program: course.program?.name || "Default Program",
  semester: "Current Semester",
});

export const fetchCourses = async (): Promise<Course[]> => {
  const response = await axiosClient.get<ApiEnvelope<{ data: any[], meta?: unknown }>>("/courses");
  return (response.data?.data?.data || []).map(mapBackendCourse);
};

export const fetchCourse = async (id: string): Promise<Course> => {
  const response = await axiosClient.get<ApiEnvelope<any>>(`/courses/${id}`);
  if (!response.data?.data) throw new Error("Course not found in API response");
  return mapBackendCourse(response.data.data);
};

export const createCourse = async (course: CreateCourseDto): Promise<Course> => {
  // Map client schema to backend schema
  const payload = {
    code: course.code,
    title: course.name,
  };
  const response = await axiosClient.post<ApiEnvelope<any>>("/courses", payload);
  if (!response.data?.data) throw new Error("Created course not found in API response");
  return mapBackendCourse(response.data.data);
};

export const updateCourse = async ({ id, data }: { id: string; data: UpdateCourseDto }): Promise<Course> => {
  const payload: any = {};
  if (data.code) payload.code = data.code;
  if (data.name) payload.title = data.name;
  
  const response = await axiosClient.put<ApiEnvelope<any>>(`/courses/${id}`, payload);
  if (!response.data?.data) throw new Error("Updated course not found in API response");
  return mapBackendCourse(response.data.data);
};

export const deleteCourse = async (id: string): Promise<void> => {
  await axiosClient.delete(`/courses/${id}`);
};
