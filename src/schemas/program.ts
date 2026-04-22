import { z } from 'zod';

export const programSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: 'Program name must be at least 2 characters' }),
  code: z.string().min(2, { message: 'Program code must be at least 2 characters' }).max(16, { message: 'Program code must be 16 characters or less' }),
  departmentId: z.string().min(1, { message: 'Department is required' }),
  department: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    code: z.string().optional(),
  }).optional().nullable(),
  courses: z.array(z.object({ id: z.string().optional() })).optional().default([]),
  departmentName: z.string().optional(),
  totalCourses: z.number().optional().default(0),
  createdAt: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export type Program = z.infer<typeof programSchema>;
export type CreateProgramDto = Pick<Program, 'name' | 'code' | 'departmentId'>;
export type UpdateProgramDto = Partial<CreateProgramDto> & Pick<Program, 'departmentId'>;