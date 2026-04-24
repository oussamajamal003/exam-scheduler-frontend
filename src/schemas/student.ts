import { z } from "zod";

export const studentSchema = z.object({
  id: z.string().optional(),
  universityId: z
    .string()
    .min(1, { message: "University ID is required" })
    .regex(/^\d+$/, { message: "University ID must contain only numbers" }),
  firstName: z
    .string()
    .min(2, { message: "First name must be at least 2 characters" })
    .regex(/^[a-zA-Z\s]+$/, { message: "First name must contain only letters" }),
  lastName: z
    .string()
    .min(2, { message: "Last name must be at least 2 characters" })
    .regex(/^[a-zA-Z\s]+$/, { message: "Last name must contain only letters" }),
  email: z.string().email({ message: "Invalid email address" }),
  programId: z.string().uuid().optional(),
  user: z.object({ name: z.string().optional(), email: z.string().optional() }).nullable().optional(),
  programRef: z
    .object({
      id: z.string().optional(),
      name: z.string().optional(),
      code: z.string().optional(),
      department: z.object({ id: z.string().optional(), name: z.string().optional(), code: z.string().optional() }).nullable().optional(),
    })
    .nullable()
    .optional(),
  program: z.string().optional(),
  department: z.string().optional(),
});

export type Student = z.infer<typeof studentSchema>;
export type CreateStudentDto = Omit<Student, "id">;
export type UpdateStudentDto = Partial<CreateStudentDto>;
