import { z } from "zod";

export const centerRoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  capacity: z.number().optional(),
  status: z.string().optional(),
});

export const centerSupervisorSchema = z.string();

export const centerSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string().optional(),
  code: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  roomsCount: z.number().optional().default(0),
  supervisorsCount: z.number().optional().default(0),
  rooms: z.array(centerRoomSchema).optional(),
  supervisors: z.array(centerSupervisorSchema).optional(),
});

export type Center = z.infer<typeof centerSchema>;
export type CenterRoom = z.infer<typeof centerRoomSchema>;
export type CenterSupervisor = z.infer<typeof centerSupervisorSchema>;

export const centerFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  location: z.string().trim().optional().or(z.literal("")),
  supervisorsText: z.string().trim().optional().or(z.literal("")),
});

export type CenterFormValues = z.input<typeof centerFormSchema>;

export type CreateCenterDto = {
  name: string;
  location?: string;
  supervisors?: string[];
};

export type UpdateCenterDto = Partial<CreateCenterDto>;
