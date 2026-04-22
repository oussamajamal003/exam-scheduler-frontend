import { z } from "zod";

export const semesterSchema = z.object({
  id: z.string(),
  name: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional().default(false),
  isCurrent: z.boolean().optional().default(false),
  academicYear: z.string().optional(),
  status: z.enum(["ACTIVE", "UPCOMING", "PAST"]).optional(),
  courseOfferingsCount: z.number().optional().default(0),
});

export type Semester = z.infer<typeof semesterSchema>;

export const semesterFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      return new Date(data.endDate).getTime() > new Date(data.startDate).getTime();
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

export type SemesterFormValues = z.infer<typeof semesterFormSchema>;

export type CreateSemesterDto = {
  name: string;
  startDate: string;
  endDate: string;
};

export type UpdateSemesterDto = Partial<CreateSemesterDto>;
