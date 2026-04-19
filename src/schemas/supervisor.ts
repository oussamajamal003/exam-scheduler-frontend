import { z } from "zod";

export const supervisorSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  department: z.string().min(2, { message: "Department is required" }),
  center: z.string().min(2, { message: "Center is required" }),
});

export type Supervisor = z.infer<typeof supervisorSchema>;
export type CreateSupervisorDto = Omit<Supervisor, "id">;
export type UpdateSupervisorDto = Partial<CreateSupervisorDto>;
