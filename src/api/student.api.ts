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
  programId?: string | null;
  user?: {
    name?: string;
    email?: string;
  };
  program?: {
    id?: string;
    name?: string;
    code?: string;
    department?: {
      id?: string;
      name?: string;
      code?: string;
    } | null;
  } | null;
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
    programId: student.program?.id ?? student.programId ?? undefined,
    user: student.user ?? null,
    programRef: student.program ?? null,
    program: student.program?.name ?? "",
    department: student.program?.department?.name ?? "",
  };
};

export const getStudents = async (): Promise<Student[]> => {
  const response = await axiosClient.get<ApiEnvelope<PaginatedStudentsPayload>>("/students", { params: { limit: 5000 } });
  return (response.data?.data?.data ?? []).map(mapBackendStudent);
};

export type StudentPageMeta = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type PagedStudents = { data: Student[]; meta: StudentPageMeta };

const readStudentMeta = (meta: unknown, fallbackPage: number, fallbackSize: number): StudentPageMeta => {
  const m = (meta && typeof meta === "object" ? meta : {}) as Record<string, unknown>;
  const total = Number(m.total ?? m.totalCount ?? 0) || 0;
  const limit = Number(m.limit ?? m.pageSize ?? fallbackSize) || fallbackSize;
  const page = Number(m.page ?? fallbackPage) || fallbackPage;
  const totalPages = Number(m.totalPages ?? Math.ceil(total / Math.max(limit, 1))) || 1;
  return { total, page, pageSize: limit, totalPages };
};

export const getStudentsPage = async ({
  page = 1,
  pageSize = 50,
  search,
  programId,
  departmentId,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  programId?: string;
  departmentId?: string;
} = {}): Promise<PagedStudents> => {
  const response = await axiosClient.get<ApiEnvelope<PaginatedStudentsPayload>>("/students", {
    params: {
      page,
      limit: pageSize,
      search: search?.trim() ? search.trim() : undefined,
      programId: programId || undefined,
      departmentId: departmentId || undefined,
    },
  });
  const payload = response.data?.data;
  return {
    data: (payload?.data ?? []).map(mapBackendStudent),
    meta: readStudentMeta(payload?.meta, page, pageSize),
  };
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
  const payload: Record<string, unknown> = {};
  if (data.universityId) payload.universityId = data.universityId;
  if (data.firstName) payload.firstName = data.firstName;
  if (data.lastName) payload.lastName = data.lastName;
  if (data.email) payload.email = data.email;
  if (data.programId) payload.programId = data.programId;

  const response = await axiosClient.put<ApiEnvelope<BackendStudent>>(`/students/${id}`, payload);
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
