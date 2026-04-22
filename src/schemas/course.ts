import { z } from "zod";

export const courseSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2, { message: "Course code must be at least 2 characters" }),
  name: z.string().min(2, { message: "Course name must be at least 2 characters" }),
  programId: z.string().min(1, { message: "Program is required" }),
  program: z.string().optional().default("Unassigned Program"),
  semesterId: z.string().optional(),
  semester: z.string().optional().default("Assigned through offerings"),
});

export type Course = z.infer<typeof courseSchema>;
export type CreateCourseDto = Omit<Course, "id">;
export type UpdateCourseDto = Partial<CreateCourseDto>;
