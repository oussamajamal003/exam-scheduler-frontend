import { axiosClient } from "./axiosclient";
import type { Schedule } from "../schemas/schedule";

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

export type FetchSchedulesParams = {
  page?: number;
  limit?: number;
  search?: string;
  isFinal?: boolean;
};

export type FetchSchedulesResult = {
  data: Schedule[];
  meta?: PaginatedPayload<Schedule>["meta"];
};

export type CreateScheduleDto = {
  name: string;
  isFinal?: boolean;
};

export type UpdateScheduleDto = Partial<CreateScheduleDto>;

const unwrap = <T,>(payload: ApiEnvelope<T> | undefined, label: string): T => {
  if (!payload?.data) throw new Error(`${label} response missing data`);
  return payload.data;
};

// GET /api/schedules
export const fetchSchedules = async (
  params: FetchSchedulesParams = {}
): Promise<FetchSchedulesResult> => {
  const response = await axiosClient.get<ApiEnvelope<PaginatedPayload<Schedule>>>(
    "/schedules",
    {
      params: {
        page: params.page,
        limit: params.limit ?? 50,
        search: params.search || undefined,
        isFinal: params.isFinal,
      },
    }
  );
  const payload = response.data?.data;
  return { data: payload?.data ?? [], meta: payload?.meta };
};

// GET /api/schedules/:id
export const fetchSchedule = async (id: string): Promise<Schedule> => {
  const response = await axiosClient.get<ApiEnvelope<Schedule>>(`/schedules/${id}`);
  return unwrap(response.data, "Schedule");
};

// POST /api/schedules
export const createSchedule = async (data: CreateScheduleDto): Promise<Schedule> => {
  const response = await axiosClient.post<ApiEnvelope<Schedule>>("/schedules", data);
  return unwrap(response.data, "Create schedule");
};

// PUT /api/schedules/:id
export const updateSchedule = async ({
  id,
  data,
}: {
  id: string;
  data: UpdateScheduleDto;
}): Promise<Schedule> => {
  const response = await axiosClient.put<ApiEnvelope<Schedule>>(`/schedules/${id}`, data);
  return unwrap(response.data, "Update schedule");
};

// DELETE /api/schedules/:id
export const deleteSchedule = async (id: string): Promise<void> => {
  await axiosClient.delete(`/schedules/${id}`);
};
