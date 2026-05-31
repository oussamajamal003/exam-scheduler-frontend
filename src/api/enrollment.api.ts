import { axiosClient } from "./axiosclient";
import type {
  CreateEnrollmentDto,
  EnrollmentDepartment,
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
    program?: { id?: string; name?: string; code?: string; department?: BackendDepartment | null } | null;
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
      program?: { id?: string; name?: string; code?: string; department?: BackendDepartment | null } | null;
    } | null;
    program?: { id?: string; name?: string; code?: string; department?: BackendDepartment | null } | null;
    semester?: { id?: string; name?: string } | null;
  } | null;
  program?: { id?: string; name?: string; code?: string; department?: BackendDepartment | null } | null;
  semester?: { id?: string; name?: string } | null;
};

type BackendDepartment = {
  id?: string;
  name?: string;
  code?: string;
};

type EnrollmentFilterOptionsPayload = {
  students?: BackendEnrollment["student"][];
  courseOfferings?: BackendEnrollment["courseOffering"][];
  departments?: BackendDepartment[];
};

export type EnrollmentFilterOptions = {
  students: EnrollmentStudent[];
  courseOfferings: EnrollmentCourseOffering[];
  departments: EnrollmentDepartment[];
};

export type EnrollmentListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  semesterId?: string;
  courseOfferingId?: string;
  studentId?: string;
  departmentId?: string;
};

const mapDepartment = (department?: BackendDepartment | null): EnrollmentDepartment | null => {
  if (!department?.id) return null;
  return {
    id: department.id,
    name: department.name ?? "Department",
    code: department.code,
  };
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
      ? { id: s.program.id, name: s.program.name ?? "", code: s.program.code, department: mapDepartment(s.program.department) }
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
                department: mapDepartment(program.department),
              }
            : null,
        }
      : null,
    program: program?.id
      ? { id: program.id, name: program.name ?? "", code: program.code, department: mapDepartment(program.department) }
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
    ? { id: e.program.id, name: e.program.name ?? "", code: e.program.code, department: mapDepartment(e.program.department) }
    : mapOffering(e.courseOffering)?.program ?? null,
  semester: e.semester?.id
    ? { id: e.semester.id, name: e.semester.name ?? "" }
    : mapOffering(e.courseOffering)?.semester ?? null,
});

// ===== Public API =====

export const fetchEnrollments = async (
  options: Pick<EnrollmentListParams, "search" | "semesterId" | "courseOfferingId" | "studentId" | "departmentId"> | string = ""
): Promise<Enrollment[]> => {
  const { search = "", semesterId, courseOfferingId, studentId, departmentId } =
    typeof options === "string" ? { search: options } : options;
  const response = await axiosClient.get<ApiEnvelope<PaginatedResponse<BackendEnrollment>>>(
    "/enrollments",
    {
      params: {
        limit: 5000,
        search: search || undefined,
        semesterId: semesterId || undefined,
        courseOfferingId: courseOfferingId || undefined,
        studentId: studentId || undefined,
        departmentId: departmentId || undefined,
      },
    }
  );
  return (response.data?.data?.data ?? []).map(mapEnrollment);
};

export type PageMeta = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type PagedResult<T> = { data: T[]; meta: PageMeta };

const readMeta = (meta: unknown, fallbackPage: number, fallbackSize: number): PageMeta => {
  const m = (meta && typeof meta === "object" ? meta : {}) as Record<string, unknown>;
  const total = Number(m.total ?? m.totalCount ?? 0) || 0;
  const limit = Number(m.limit ?? m.pageSize ?? fallbackSize) || fallbackSize;
  const page = Number(m.page ?? fallbackPage) || fallbackPage;
  const totalPages = Number(m.totalPages ?? Math.ceil(total / Math.max(limit, 1))) || 1;
  return { total, page, pageSize: limit, totalPages };
};

export const fetchEnrollmentsPage = async ({
  page = 1,
  pageSize = 50,
  search,
  semesterId,
  courseOfferingId,
  studentId,
  departmentId,
}: EnrollmentListParams = {}): Promise<PagedResult<Enrollment>> => {
  const response = await axiosClient.get<ApiEnvelope<PaginatedResponse<BackendEnrollment>>>(
    "/enrollments",
    {
      params: {
        page,
        limit: pageSize,
        search: search?.trim() ? search.trim() : undefined,
        semesterId: semesterId || undefined,
        courseOfferingId: courseOfferingId || undefined,
        studentId: studentId || undefined,
        departmentId: departmentId || undefined,
      },
    }
  );
  const payload = response.data?.data;
  return {
    data: (payload?.data ?? []).map(mapEnrollment),
    meta: readMeta(payload?.meta, page, pageSize),
  };
};

export const fetchEnrollmentFilterOptions = async ({
  semesterId,
}: {
  semesterId?: string;
} = {}): Promise<EnrollmentFilterOptions> => {
  const response = await axiosClient.get<ApiEnvelope<EnrollmentFilterOptionsPayload>>("/enrollments/filters", {
    params: { semesterId: semesterId || undefined },
  });
  const payload = response.data?.data ?? {};
  return {
    students: (payload.students ?? []).map(mapStudent).filter((student): student is EnrollmentStudent => Boolean(student?.id)),
    courseOfferings: (payload.courseOfferings ?? []).map(mapOffering).filter((offering): offering is EnrollmentCourseOffering => Boolean(offering?.id)),
    departments: (payload.departments ?? []).map(mapDepartment).filter((department): department is EnrollmentDepartment => Boolean(department?.id)),
  };
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
