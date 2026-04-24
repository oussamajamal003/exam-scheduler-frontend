import { z } from 'zod';

export const departmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: 'Department name must be at least 2 characters' }),
  code: z.string().min(2, { message: 'Department code must be at least 2 characters' }).max(12, { message: 'Department code must be 12 characters or less' }),
  totalCourses: z.number().optional().default(0),
  programsCount: z.number().optional().default(0),
  programs: z.array(z.unknown()).optional().default([]),
  courses: z.array(z.unknown()).optional().default([]),
  createdAt: z.string().optional(),
});

export type Department = z.infer<typeof departmentSchema>;
export type CreateDepartmentDto = Pick<Department, 'name' | 'code'>;
export type UpdateDepartmentDto = Partial<CreateDepartmentDto>;