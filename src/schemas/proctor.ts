import { z } from "zod";
import { timeSlotSchema } from "./timeSlot";

export const proctorSchema = z.object({
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
      { message: "Proctor email must end with @uni.edu" }
    ),
  department: z.string().min(2, { message: "Department is required" }),
  user: z.object({ id: z.string().optional(), name: z.string().optional(), email: z.string().optional(), role: z.string().optional() }).nullable().optional(),
  availableTimeSlots: z.array(timeSlotSchema).optional().default([]),
  timeSlotIds: z.array(z.string()).optional().default([]),
  assignments: z.array(z.unknown()).optional(),
});

export type Proctor = z.infer<typeof proctorSchema>;
export type CreateProctorDto = Pick<Proctor, "name" | "email" | "department" | "timeSlotIds">;
export type UpdateProctorDto = Partial<CreateProctorDto>;
