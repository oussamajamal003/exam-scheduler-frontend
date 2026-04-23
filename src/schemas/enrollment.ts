import { z } from "zod";

// ===== Relational shapes (mirror backend include) =====

export type EnrollmentProgram = {
  id: string;
  name: string;
  code?: string;
};

export type EnrollmentSemester = {
  id: string;
  name: string;
};

export type EnrollmentCourse = {
  id: string;
  code: string;
  title: string;
  program?: EnrollmentProgram | null;
};

export type EnrollmentCourseOffering = {
  id: string;
  section?: string | null;
  instructor?: string | null;
  course?: EnrollmentCourse | null;
  semester?: EnrollmentSemester | null;
};

export type EnrollmentStudent = {
  id: string;
  universityId?: string;
  user?: { id?: string; name?: string; email?: string } | null;
  program?: EnrollmentProgram | null;
};

export type Enrollment = {
  id: string;
  status?: string | null;
  createdAt?: string;
  updatedAt?: string;
  student?: EnrollmentStudent | null;
  courseOffering?: EnrollmentCourseOffering | null;
};

// ===== Form / DTOs =====

export const createEnrollmentSchema = z.object({
  studentId: z.string().uuid({ message: "Please select a student" }),
  courseOfferingId: z.string().uuid({ message: "Please select a course offering" }),
  status: z.string().optional().default("ACTIVE"),
});

export type CreateEnrollmentDto = z.infer<typeof createEnrollmentSchema>;

export type BulkEnrollmentRow = {
  rowNumber: number;
  studentEmail: string;
  courseOfferingId?: string;
  courseCode?: string;
  semester?: string;
  // Resolved
  resolvedStudentId?: string;
  resolvedOfferingId?: string;
  resolvedStudentName?: string;
  resolvedCourseTitle?: string;
  // Validation
  status: "valid" | "invalid";
  errors: string[];
};
