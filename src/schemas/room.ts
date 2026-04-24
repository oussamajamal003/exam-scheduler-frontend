import { z } from "zod";

export const roomSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: "Room name must be at least 2 characters" }),
  centerId: z.string().uuid({ message: "Please select a center" }),
  center: z.object({ id: z.string().optional(), name: z.string().optional() }).nullable().optional(),
  // display only — populated from backend, not submitted
  centerName: z.string().optional(),
  capacity: z.coerce.number().min(1, { message: "Capacity must be at least 1" }),
  status: z.enum(["Available", "Maintenance"]).default("Available"),
  assignments: z.array(z.unknown()).optional(),
});

export type Room = z.infer<typeof roomSchema>;
export type CreateRoomDto = Omit<Room, "id" | "center" | "centerName" | "assignments">;
export type UpdateRoomDto = Partial<CreateRoomDto>;

