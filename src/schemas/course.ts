import { z } from "zod";

export const courseSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2, { message: "Course code must be at least 2 characters" }),
  name: z.string().min(2, { message: "Course name must be at least 2 characters" }),
  program: z.string().min(2, { message: "Program must be at least 2 characters" }),
  semester: z.string().min(2, { message: "Semester is required" }),
});

export type Course = z.infer<typeof courseSchema>;
export type CreateCourseDto = Omit<Course, "id">;
export type UpdateCourseDto = Partial<CreateCourseDto>;
