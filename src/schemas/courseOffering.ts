import { z } from "zod";

export const offeringStatusSchema = z.enum(["ACTIVE", "INACTIVE", "CANCELLED"]);
export type OfferingStatus = z.infer<typeof offeringStatusSchema>;

export const offeringCourseSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  code: z.string(),
  title: z.string(),
  credits: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  program: z
    .object({
      id: z.string(),
      name: z.string(),
      code: z.string().optional(),
    })
    .nullable()
    .optional(),
});

export type OfferingCourse = z.infer<typeof offeringCourseSchema>;

export const offeringSemesterSchema = z.object({
  id: z.string(),
  name: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type OfferingSemester = z.infer<typeof offeringSemesterSchema>;

export const courseOfferingSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  semesterId: z.string(),
  course: offeringCourseSchema.nullable().optional(),
  program: z
    .object({
      id: z.string(),
      name: z.string(),
      code: z.string().optional(),
    })
    .nullable()
    .optional(),
  semester: offeringSemesterSchema.nullable().optional(),
  section: z.string().nullable().optional(),
  instructor: z.string().nullable().optional(),
  expectedStudents: z.number().optional().default(0),
  capacity: z.number().nullable().optional(),
  day: z.string().nullable().optional(),
  time: z.string().nullable().optional(),
  roomLabel: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: offeringStatusSchema.optional().default("ACTIVE"),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  registrationsCount: z.number().optional().default(0),
  examsCount: z.number().optional().default(0),
  enrollments: z.array(z.unknown()).optional(),
  exams: z.array(z.unknown()).optional(),
});

export type CourseOffering = z.infer<typeof courseOfferingSchema>;

export type CreateCourseOfferingDto = {
  courseId: string;
  semesterId: string;
  section?: string;
  instructor?: string;
  expectedStudents?: number;
  capacity?: number;
  day?: string;
  time?: string;
  roomLabel?: string;
  notes?: string;
  status?: OfferingStatus;
};

export type UpdateCourseOfferingDto = Partial<CreateCourseOfferingDto>;

// ===== Detail page types =====

export type OfferingRegistrationStudent = {
  id?: string;
  universityId?: string;
  name: string;
  email?: string;
  programName?: string;
};

export type OfferingExamAssignment = {
  id?: string;
  roomName?: string;
  supervisorName?: string;
  timeSlotLabel?: string;
  scheduleName?: string;
};

export type OfferingExam = {
  id: string;
  status?: string;
  duration?: number | null;
  examDate?: string | null;
  assignments: OfferingExamAssignment[];
};

export type CourseOfferingDetail = Omit<CourseOffering, "exams"> & {
  registrations: OfferingRegistrationStudent[];
  exams: OfferingExam[];
  conflictsCount?: number;
};
