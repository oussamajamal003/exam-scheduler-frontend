import { z } from "zod";

export const timeSlotSchema = z.object({
  id: z.string(),
  date: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  duration: z.number().optional(),
  assignmentsCount: z.number().optional().default(0),
});

export type TimeSlot = z.infer<typeof timeSlotSchema>;

export const timeSlotFormSchema = z
  .object({
    date: z.string().min(1, "Date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
  })
  .refine(
    (data) => {
      if (!data.startTime || !data.endTime) return true;
      return data.endTime > data.startTime;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

export type TimeSlotFormValues = z.infer<typeof timeSlotFormSchema>;

export type CreateTimeSlotDto = {
  date: string;
  startTime: string;
  endTime: string;
  duration?: number;
};

export type UpdateTimeSlotDto = Partial<CreateTimeSlotDto>;
