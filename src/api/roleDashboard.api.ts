import { axiosClient } from './axiosclient';
import type { ChartDatum } from '@/components/dashboard/RealBarChart';
import type { ScheduleAssignment } from '@/schemas/schedule';

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
};

const unwrap = <T,>(payload: ApiEnvelope<T> | undefined, label: string): T => {
  if (!payload?.data) throw new Error(`${label} response missing data`);
  return payload.data;
};

export type RoleUserSummary = {
  id: string;
  name?: string | null;
  email?: string | null;
};

export type RoleProgramSummary = {
  id: string;
  name?: string | null;
  code?: string | null;
  department?: { id: string; name?: string | null; code?: string | null } | null;
};

export type RoleCourseSummary = {
  id: string;
  code?: string | null;
  title?: string | null;
  credits?: number | null;
};

export type RoleSemesterSummary = {
  id: string;
  name?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

export type StudentCourseDashboardItem = {
  registrationId: string;
  status?: string | null;
  id: string;
  section?: string | null;
  instructor?: string | null;
  expectedStudents?: number | null;
  hasExam?: boolean | null;
  courseType?: 'COURSE' | 'PROJECT' | string | null;
  course?: RoleCourseSummary | null;
  semester?: RoleSemesterSummary | null;
  exams: StudentExamDashboardItem[];
};

export type StudentExamDashboardItem = {
  id: string;
  status?: string | null;
  duration?: number | null;
  courseOffering?: {
    id: string;
    section?: string | null;
    instructor?: string | null;
    expectedStudents?: number | null;
    course?: RoleCourseSummary | null;
    semester?: RoleSemesterSummary | null;
  } | null;
  assignments: ScheduleAssignment[];
};

export type StudentDashboardResponse = {
  profile: {
    id: string;
    universityId: string;
    user?: RoleUserSummary | null;
    program?: RoleProgramSummary | null;
  };
  summary: {
    registeredCourses: number;
    examCourses: number;
    scheduledExams: number;
    upcomingExams: number;
    activeSemesters: number;
    nextExamAt?: string | null;
  };
  courses: StudentCourseDashboardItem[];
  exams: StudentExamDashboardItem[];
  assignments: ScheduleAssignment[];
  charts: {
    examsBySemester: ChartDatum[];
    examsByStatus: ChartDatum[];
    examsByCenter: ChartDatum[];
  };
  nextAssignment?: ScheduleAssignment | null;
};

export type ProctorRelatedStudent = {
  id: string;
  universityId?: string | null;
  user?: RoleUserSummary | null;
  program?: RoleProgramSummary | null;
};

export type ProctorDashboardResponse = {
  profile: {
    id: string;
    department?: string | null;
    maxExamsPerDay?: number | null;
    user?: RoleUserSummary | null;
    center?: { id: string; name?: string | null; location?: string | null } | null;
  };
  summary: {
    assignedDuties: number;
    upcomingDuties: number;
    relatedStudents: number;
    assignedCourses: number;
    centers: number;
    nextDutyAt?: string | null;
  };
  assignments: ScheduleAssignment[];
  relatedStudents: ProctorRelatedStudent[];
  charts: {
    dutiesByDay: ChartDatum[];
    dutiesByCenter: ChartDatum[];
    dutiesByCourse: ChartDatum[];
  };
  nextAssignment?: ScheduleAssignment | null;
};

export const fetchStudentDashboard = async (): Promise<StudentDashboardResponse> => {
  const response = await axiosClient.get<ApiEnvelope<StudentDashboardResponse>>('/role-dashboards/student');
  return unwrap(response.data, 'Student dashboard');
};

export const fetchProctorDashboard = async (): Promise<ProctorDashboardResponse> => {
  const response = await axiosClient.get<ApiEnvelope<ProctorDashboardResponse>>('/role-dashboards/proctor');
  return unwrap(response.data, 'Proctor dashboard');
};
