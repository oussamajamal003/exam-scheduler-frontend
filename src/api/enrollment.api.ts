import { axiosClient } from "./axiosclient";
import type {
  CreateEnrollmentDto,
  Enrollment,
  EnrollmentCourseOffering,
  EnrollmentStudent,
} from "../schemas/enrollment";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
};

type PaginatedResponse<T> = {
  data: T[];
  meta?: unknown;
};

// ===== Backend record shape =====

type BackendEnrollment = {
  id: string;
  status?: string | null;
  createdAt?: string;
  updatedAt?: string;
  student?: {
    id?: string;
    fullName?: string | null;
    universityId?: string;
    user?: { id?: string; name?: string; email?: string } | null;
    program?: { id?: string; name?: string; code?: string } | null;
  } | null;
  courseOffering?: {
    id?: string;
    section?: string | null;
    instructor?: string | null;
    course?: {
      id?: string;
      name?: string;
      code?: string;
      title?: string;
      program?: { id?: string; name?: string; code?: string } | null;
    } | null;
    program?: { id?: string; name?: string; code?: string } | null;
    semester?: { id?: string; name?: string } | null;
  } | null;
  program?: { id?: string; name?: string; code?: string } | null;
  semester?: { id?: string; name?: string } | null;
};

const mapStudent = (s?: BackendEnrollment["student"]): EnrollmentStudent | null => {
  if (!s) return null;
  return {
    id: s.id ?? "",
    fullName: s.fullName ?? s.user?.name ?? null,
    universityId: s.universityId,
    user: s.user
      ? { id: s.user.id, name: s.user.name, email: s.user.email }
      : null,
    program: s.program?.id
      ? { id: s.program.id, name: s.program.name ?? "", code: s.program.code }
      : null,
  };
};

const mapOffering = (
  o?: BackendEnrollment["courseOffering"]
): EnrollmentCourseOffering | null => {
  if (!o) return null;
  const program = o.program ?? o.course?.program ?? null;
  return {
    id: o.id ?? "",
    section: o.section ?? null,
    instructor: o.instructor ?? null,
    course: o.course
      ? {
          id: o.course.id ?? "",
          name: o.course.name ?? o.course.title ?? "",
          code: o.course.code ?? "",
          title: o.course.title ?? o.course.name ?? "",
          program: program?.id
            ? {
                id: program.id,
                name: program.name ?? "",
                code: program.code,
              }
            : null,
        }
      : null,
    program: program?.id
      ? { id: program.id, name: program.name ?? "", code: program.code }
      : null,
    semester: o.semester?.id
      ? { id: o.semester.id, name: o.semester.name ?? "" }
      : null,
  };
};

const mapEnrollment = (e: BackendEnrollment): Enrollment => ({
  id: e.id,
  status: e.status ?? "ACTIVE",
  createdAt: e.createdAt,
  updatedAt: e.updatedAt,
  student: mapStudent(e.student),
  courseOffering: mapOffering(e.courseOffering),
  program: e.program?.id
    ? { id: e.program.id, name: e.program.name ?? "", code: e.program.code }
    : mapOffering(e.courseOffering)?.program ?? null,
  semester: e.semester?.id
    ? { id: e.semester.id, name: e.semester.name ?? "" }
    : mapOffering(e.courseOffering)?.semester ?? null,
});

// ===== Public API =====

export const fetchEnrollments = async (search = ""): Promise<Enrollment[]> => {
  const response = await axiosClient.get<ApiEnvelope<PaginatedResponse<BackendEnrollment>>>(
    "/enrollments",
    { params: { limit: 5000, search: search || undefined } }
  );
  return (response.data?.data?.data ?? []).map(mapEnrollment);
};

export const createEnrollment = async (
  data: CreateEnrollmentDto
): Promise<Enrollment> => {
  const response = await axiosClient.post<ApiEnvelope<BackendEnrollment>>(
    "/enrollments",
    data
  );
  if (!response.data?.data) throw new Error("Created enrollment payload missing");
  return mapEnrollment(response.data.data);
};

export const deleteEnrollment = async (id: string): Promise<void> => {
  await axiosClient.delete(`/enrollments/${id}`);
};

export const bulkImportEnrollments = async (
  enrollments: CreateEnrollmentDto[]
): Promise<Enrollment[]> => {
  const response = await axiosClient.post<ApiEnvelope<BackendEnrollment[]>>(
    "/enrollments/bulk-import",
    { enrollments }
  );
  return (response.data?.data ?? []).map(mapEnrollment);
};
