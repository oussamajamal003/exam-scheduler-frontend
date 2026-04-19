import { z } from "zod";

export const roomSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: "Room name must be at least 2 characters" }),
  center: z.string().min(2, { message: "Center is required" }),
  capacity: z.coerce.number().min(1, { message: "Capacity must be at least 1" }),
  status: z.enum(["Available", "Maintenance"]).default("Available"),
});

export type Room = z.infer<typeof roomSchema>;
export type CreateRoomDto = Omit<Room, "id">;
export type UpdateRoomDto = Partial<CreateRoomDto>;
