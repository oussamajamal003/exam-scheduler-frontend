import { axiosClient } from "./axiosclient";
import {
  CourseOffering,
  CourseOfferingDetail,
  CreateCourseOfferingDto,
  OfferingCourse,
  OfferingExam,
  OfferingRegistrationStudent,
  UpdateCourseOfferingDto,
} from "../schemas/courseOffering";
import { formatTimeSlotLabel } from "../lib/dateTime";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
};

type PaginatedResponse<T> = {
  data: T[];
  meta?: unknown;
};

// ===== Backend record types =====

type BackendProgram = {
  id: string;
  name: string;
  code?: string;
};

type BackendCourse = {
  id: string;
  name?: string;
  code: string;
  title?: string;
  credits?: number | null;
  description?: string | null;
  programId?: string | null;
  program?: BackendProgram | null;
  semesterId?: string | null;
  semester?: BackendSemester | null;
  courseOfferings?: Array<{
    id?: string;
    semesterId?: string | null;
    semester?: { id?: string; name?: string } | null;
  }> | null;
};

type BackendSemester = {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
};

type BackendUser = {
  id?: string;
  name?: string;
  email?: string;
};

type BackendStudent = {
  id?: string;
  universityId?: string;
  user?: BackendUser | null;
  program?: BackendProgram | null;
};

type BackendRegistration = {
  id?: string;
  student?: BackendStudent | null;
};

type BackendAssignment = {
  id?: string;
  schedule?: { id?: string; name?: string } | null;
  room?: { id?: string; name?: string; label?: string } | null;
  proctor?: { id?: string; user?: BackendUser | null } | null;
  timeSlot?: {
    id?: string;
    label?: string;
    startTime?: string;
    endTime?: string;
    date?: string;
  } | null;
};

type BackendExam = {
  id: string;
  status?: string;
  duration?: number | null;
  examDate?: string | null;
  assignments?: BackendAssignment[] | null;
};

type BackendOfferingList = {
  id: string;
  courseId: string;
  semesterId: string;
  course?: BackendCourse | null;
  program?: BackendProgram | null;
  semester?: BackendSemester | null;
  enrollments?: BackendRegistration[] | null;
  registrations?: BackendRegistration[] | null;
  exams?: BackendExam[] | null;
  section?: string | null;
  instructor?: string | null;
  expectedStudents?: number;
  capacity?: number | null;
  day?: string | null;
  time?: string | null;
  roomLabel?: string | null;
  notes?: string | null;
  courseType?: "COURSE" | "PROJECT";
  hasExam?: boolean;
  status?: "ACTIVE" | "INACTIVE" | "CANCELLED";
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    registrations?: number;
    exams?: number;
  };
};

type BackendOfferingDetail = BackendOfferingList & {
  registrations?: BackendRegistration[] | null;
  exams?: BackendExam[] | null;
};

// ===== Mappers =====

const mapBackendCourse = (course?: BackendCourse | null): OfferingCourse | null => {
  if (!course) return null;
  const title = course.title ?? course.name ?? "Untitled course";
  const semesterIds = Array.from(
    new Set(
      [
        course.semester?.id ?? course.semesterId ?? null,
        ...(course.courseOfferings ?? []).map((o) => o.semester?.id ?? o.semesterId ?? null),
      ]
        .filter((id): id is string => Boolean(id))
    )
  );
  return {
    id: course.id,
    name: course.name ?? title,
    code: course.code,
    title,
    credits: course.credits ?? null,
    description: course.description ?? null,
    program: course.program
      ? {
          id: course.program.id,
          name: course.program.name,
          code: course.program.code,
        }
      : null,
    semesterId: course.semester?.id ?? course.semesterId ?? null,
    semester: course.semester
      ? {
          id: course.semester.id,
          name: course.semester.name,
          startDate: course.semester.startDate,
          endDate: course.semester.endDate,
        }
      : null,
    semesterIds,
  };
};

const mergeOfferingCourse = (
  course?: BackendCourse | null,
  fallbackCourse?: OfferingCourse | null
): OfferingCourse | null => {
  const mappedCourse = mapBackendCourse(course);

  if (!mappedCourse) {
    return fallbackCourse ?? null;
  }

  return {
    ...mappedCourse,
    program: mappedCourse.program ?? fallbackCourse?.program ?? null,
    semesterIds:
      mappedCourse.semesterIds && mappedCourse.semesterIds.length > 0
        ? mappedCourse.semesterIds
        : fallbackCourse?.semesterIds ?? [],
  };
};

const mapBackendOffering = (
  offering: BackendOfferingList,
  fallbackCourse?: OfferingCourse | null
): CourseOffering => {
  const course = mergeOfferingCourse(offering.course, fallbackCourse);
  const enrollments = offering.enrollments ?? offering.registrations ?? [];
  const exams = offering.exams ?? [];

  return {
    id: offering.id,
    courseId: offering.courseId,
    semesterId: offering.semesterId,
    course,
    program: offering.program ?? course?.program ?? null,
    semester: offering.semester
      ? {
          id: offering.semester.id,
          name: offering.semester.name,
          startDate: offering.semester.startDate,
          endDate: offering.semester.endDate,
        }
      : null,
    section: offering.section ?? null,
    instructor: offering.instructor ?? null,
    expectedStudents: offering.expectedStudents ?? 0,
    capacity: offering.capacity ?? null,
    day: offering.day ?? null,
    time: offering.time ?? null,
    roomLabel: offering.roomLabel ?? null,
    notes: offering.notes ?? null,
    courseType: offering.courseType ?? "COURSE",
    hasExam: offering.hasExam ?? offering.courseType !== "PROJECT",
    status: offering.status ?? "ACTIVE",
    createdAt: offering.createdAt,
    updatedAt: offering.updatedAt,
    enrollments,
    exams,
    registrationsCount: enrollments.length || offering._count?.registrations || 0,
    examsCount: exams.length || offering._count?.exams || 0,
  };
};

const mapBackendRegistration = (
  registration: BackendRegistration
): OfferingRegistrationStudent => {
  const student = registration.student;
  return {
    id: student?.id,
    universityId: student?.universityId,
    name: student?.user?.name ?? "Unknown student",
    email: student?.user?.email ?? undefined,
    programName: student?.program?.name ?? undefined,
  };
};

const mapBackendExam = (exam: BackendExam): OfferingExam => ({
  id: exam.id,
  status: exam.status,
  duration: exam.duration ?? null,
  examDate: exam.examDate ?? null,
  assignments: (exam.assignments ?? []).map((assignment) => ({
    id: assignment.id,
    roomName: assignment.room?.name ?? assignment.room?.label ?? undefined,
    proctorName: assignment.proctor?.user?.name ?? undefined,
    timeSlotLabel: formatTimeSlotLabel(assignment.timeSlot),
    scheduleName: assignment.schedule?.name ?? undefined,
  })),
});

const mapBackendOfferingDetail = (
  offering: BackendOfferingDetail,
  fallbackCourse?: OfferingCourse | null
): CourseOfferingDetail => ({
  ...mapBackendOffering(offering, fallbackCourse),
  registrations: (offering.registrations ?? []).map(mapBackendRegistration),
  exams: (offering.exams ?? []).map(mapBackendExam),
  conflictsCount: 0,
});

const fetchCoursesIndex = async (): Promise<Map<string, OfferingCourse>> => {
  const response = await axiosClient.get<ApiEnvelope<PaginatedResponse<BackendCourse>>>(
    "/courses",
    {
      params: { limit: 5000 },
    }
  );

  const courses = (response.data?.data?.data ?? [])
    .map((course) => mapBackendCourse(course))
    .filter((course): course is OfferingCourse => Boolean(course));

  return new Map(courses.map((course) => [course.id, course]));
};

const fetchCourseForOffering = async (courseId: string): Promise<OfferingCourse | null> => {
  const response = await axiosClient.get<ApiEnvelope<BackendCourse>>(`/courses/${courseId}`);
  return mapBackendCourse(response.data?.data);
};

// ===== Public API =====

export const fetchCourseOfferings = async (search = ""): Promise<CourseOffering[]> => {
  const offeringsResponse = await axiosClient.get<ApiEnvelope<PaginatedResponse<BackendOfferingList>>>(
    "/course-offerings",
    {
      params: { limit: 5000, search: search || undefined },
    }
  );

  return (offeringsResponse.data?.data?.data ?? []).map((offering) =>
    mapBackendOffering(offering)
  );
};

export const fetchCourseOffering = async (id: string): Promise<CourseOfferingDetail> => {
  const response = await axiosClient.get<ApiEnvelope<BackendOfferingDetail>>(
    `/course-offerings/${id}`
  );
  if (!response.data?.data) throw new Error("Course offering not found in API response");

  return mapBackendOfferingDetail(response.data.data);
};

export const createCourseOffering = async (
  data: CreateCourseOfferingDto
): Promise<CourseOffering> => {
  const response = await axiosClient.post<ApiEnvelope<BackendOfferingList>>(
    "/course-offerings",
    data
  );
  if (!response.data?.data) throw new Error("Created offering not found in API response");
  return mapBackendOffering(response.data.data);
};

export const updateCourseOffering = async ({
  id,
  data,
}: {
  id: string;
  data: UpdateCourseOfferingDto;
}): Promise<CourseOffering> => {
  const response = await axiosClient.put<ApiEnvelope<BackendOfferingList>>(
    `/course-offerings/${id}`,
    data
  );
  if (!response.data?.data) throw new Error("Updated offering not found in API response");
  return mapBackendOffering(response.data.data);
};

export const deleteCourseOffering = async (id: string): Promise<void> => {
  await axiosClient.delete(`/course-offerings/${id}`);
};

// ===== Helper used by the form selectors (relational courses) =====

export const fetchCoursesForOfferings = async (): Promise<OfferingCourse[]> => {
  return Array.from((await fetchCoursesIndex()).values());
};

export const fetchSelectedCourseForOffering = async (
  courseId: string
): Promise<OfferingCourse | null> => {
  if (!courseId) return null;
  return fetchCourseForOffering(courseId);
};
