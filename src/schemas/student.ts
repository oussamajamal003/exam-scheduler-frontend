import { z } from 'zod';

export const studentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  studentId: z.string().min(1, 'Student ID is required'),
  department: z.string().optional(),
  level: z.string().optional(),
});

export type StudentFormData = z.infer<typeof studentSchema>;

export interface Student extends StudentFormData {
  id: string;
  createdAt: string;
  updatedAt: string;
}
