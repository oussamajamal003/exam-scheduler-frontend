import { z } from "zod";

export const supervisorSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .refine(
      (v) => {
        const lower = v.toLowerCase();
        return lower.endsWith("@uni.edu") && !lower.endsWith("@st.uni.edu");
      },
      { message: "Supervisor email must end with @uni.edu" }
    ),
  department: z.string().min(2, { message: "Department is required" }),
  centerId: z.string().min(1, { message: "Center is required" }),
  user: z.object({ id: z.string().optional(), name: z.string().optional(), email: z.string().optional(), role: z.string().optional() }).nullable().optional(),
  center: z.string().optional().default(""),
  centerRef: z.object({ id: z.string().optional(), name: z.string().optional() }).nullable().optional(),
  assignments: z.array(z.unknown()).optional(),
});

export type Supervisor = z.infer<typeof supervisorSchema>;
export type CreateSupervisorDto = Omit<Supervisor, "id">;
export type UpdateSupervisorDto = Partial<CreateSupervisorDto>;
