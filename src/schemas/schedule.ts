// Type definitions mirroring the backend Prisma response shape for
// Schedule, ExamAssignment, Exam, Room, Supervisor, TimeSlot, Conflict.
// These are intentionally permissive (most fields optional) so the same
// shape can be reused for list / detail / generate responses.

import type { Conflict } from "./conflict";

export type ScheduleCourse = {
  id: string;
  code?: string | null;
  title?: string | null;
  name?: string | null;
  credits?: number | null;
  difficulty?: number | null;
  priority?: number | null;
};

export type ScheduleSemester = {
  id: string;
  name?: string | null;
  year?: number | null;
  isActive?: boolean | null;
};

export type ScheduleRegistration = {
  id?: string;
  studentId: string;
  status?: string | null;
  student?: {
    id?: string;
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
    } | null;
  } | null;
};

export type ScheduleCourseOffering = {
  id: string;
  expectedStudents?: number | null;
  course?: ScheduleCourse | null;
  semester?: ScheduleSemester | null;
  registrations?: ScheduleRegistration[];
};

export type ScheduleExam = {
  id: string;
  status?: string | null;
  duration?: number | null;
  courseOfferingId?: string;
  courseOffering?: ScheduleCourseOffering | null;
};

export type ScheduleCenter = {
  id: string;
  name: string;
  location?: string | null;
};

export type ScheduleRoom = {
  id: string;
  name: string;
  capacity: number;
  status?: string | null;
  centerId?: string;
  center?: ScheduleCenter | null;
};

export type ScheduleSupervisorUser = {
  id: string;
  name?: string | null;
  email?: string | null;
};

export type ScheduleSupervisor = {
  id: string;
  department?: string | null;
  user?: ScheduleSupervisorUser | null;
};

export type ScheduleTimeSlot = {
  id: string;
  startTime: string;
  endTime: string;
  date?: string | null;
  duration?: number | null;
};

export type ScheduleAssignment = {
  id: string;
  scheduleId: string;
  examId: string;
  roomId: string;
  supervisorId: string;
  timeSlotId: string;
  exam?: ScheduleExam | null;
  room?: ScheduleRoom | null;
  supervisor?: ScheduleSupervisor | null;
  timeSlot?: ScheduleTimeSlot | null;
};

export type Schedule = {
  id: string;
  name: string;
  isFinal: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  assignments?: ScheduleAssignment[];
  conflicts?: Conflict[];
  _count?: { assignments?: number; conflicts?: number };
};

// Payload sent to POST /api/scheduling/generate
export type GenerateScheduleDto = {
  scheduleName: string;
  semesterId: string;
  centerIds?: string[];
  examIds?: string[];
  options?: Record<string, unknown>;
};

// Response of /api/scheduling/generate (engine returns full graph)
export type GenerateScheduleResponse = {
  scheduleId?: string;
  scheduleName?: string;
  schedule: Schedule;
  summary?: {
    totalExams?: number;
    scheduledExams?: number;
    unscheduledExams?: number;
    totalAssignments?: number;
    conflictsCount?: number;
    [key: string]: unknown;
  };
  conflicts?: Conflict[];
  message?: string;
};
