import { axiosClient } from "./axiosclient";
import type { ScheduleExam } from "../schemas/schedule";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
};

type PaginatedPayload<T> = {
  data: T[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
};

export const fetchExams = async (limit = 500): Promise<ScheduleExam[]> => {
  const response = await axiosClient.get<ApiEnvelope<PaginatedPayload<ScheduleExam>>>(
    "/exams",
    {
      params: { page: 1, limit },
    }
  );

  return response.data?.data?.data ?? [];
};