import { axiosClient } from "./axiosclient";
import { Student, CreateStudentDto, UpdateStudentDto } from "../schemas/student";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
};

type PaginatedStudentsPayload = {
  data: BackendStudent[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

type BackendStudent = {
  id: string;
  universityId: string;
  user?: {
    name?: string;
    email?: string;
  };
};

export type StudentExam = {
  courseName: string;
  courseCode: string;
  status?: string;
  duration?: number | null;
  assignments?: Array<{
    id?: string;
    schedule?: unknown;
    timeSlot?: unknown;
    room?: unknown;
  }>;
};

const mapBackendStudent = (student: BackendStudent): Student => {
  const name = student.user?.name?.trim() ?? "";
  const [firstName, ...lastNameParts] = name.split(" ").filter(Boolean);

  return {
    id: student.id,
    universityId: student.universityId,
    firstName: firstName ?? "",
    lastName: lastNameParts.join(" ") || "",
    email: student.user?.email ?? "",
  };
};

export const getStudents = async (): Promise<Student[]> => {
  const response = await axiosClient.get<ApiEnvelope<PaginatedStudentsPayload>>("/students");
  return (response.data?.data?.data ?? []).map(mapBackendStudent);
};

export const getStudent = async (id: string): Promise<Student> => {
  const response = await axiosClient.get<ApiEnvelope<BackendStudent>>(`/students/${id}`);
  if (!response.data?.data) {
    throw new Error("Student payload is missing in API response");
  }
  return mapBackendStudent(response.data.data);
};

export const createStudent = async (data: CreateStudentDto): Promise<Student> => {
  const payload = {
    universityId: data.universityId,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    ...(data.programId ? { programId: data.programId } : {}),
  };

  const response = await axiosClient.post<ApiEnvelope<BackendStudent>>("/students", payload);
  if (!response.data?.data) {
    throw new Error("Created student payload is missing in API response");
  }
  return mapBackendStudent(response.data.data);
};

export const updateStudent = async (id: string, data: UpdateStudentDto): Promise<Student> => {
  const response = await axiosClient.put<ApiEnvelope<BackendStudent>>(`/students/${id}`, {
    universityId: data.universityId,
    ...(data.programId ? { programId: data.programId } : {}),
  });
  if (!response.data?.data) {
    throw new Error("Updated student payload is missing in API response");
  }
  return mapBackendStudent(response.data.data);
};

export const deleteStudent = async (id: string): Promise<void> => {
  await axiosClient.delete(`/students/${id}`);
};

export const getStudentExams = async (id: string): Promise<StudentExam[]> => {
  const response = await axiosClient.get<ApiEnvelope<StudentExam[]>>(`/students/${id}/exams`);
  return response.data?.data ?? [];
};
