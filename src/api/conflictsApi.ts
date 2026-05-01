import { axiosClient } from "./axiosclient";
import type {
  Conflict,
  DetectConflictsDto,
  DetectConflictsResponse,
} from "../schemas/conflict";

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

export type FetchConflictsParams = {
  page?: number;
  limit?: number;
  search?: string;
  scheduleId?: string;
  type?: Conflict["type"];
  resolved?: boolean;
};

export type FetchConflictsResult = {
  data: Conflict[];
  meta?: PaginatedPayload<Conflict>["meta"];
};

const unwrap = <T,>(payload: ApiEnvelope<T> | undefined, label: string): T => {
  if (!payload?.data) throw new Error(`${label} response missing data`);
  return payload.data;
};

// GET /api/conflicts
export const fetchConflicts = async (
  params: FetchConflictsParams = {}
): Promise<FetchConflictsResult> => {
  const response = await axiosClient.get<ApiEnvelope<PaginatedPayload<Conflict>>>(
    "/conflicts",
    {
      params: {
        page: params.page,
        limit: params.limit ?? 50,
        search: params.search || undefined,
        scheduleId: params.scheduleId,
        type: params.type,
        resolved: params.resolved,
      },
    }
  );
  const payload = response.data?.data;
  return { data: payload?.data ?? [], meta: payload?.meta };
};

// GET /api/conflicts/:id
export const fetchConflict = async (id: string): Promise<Conflict> => {
  const response = await axiosClient.get<ApiEnvelope<Conflict>>(`/conflicts/${id}`);
  return unwrap(response.data, "Conflict");
};

// GET /api/schedules/:id/conflicts
export const fetchScheduleConflicts = async (scheduleId: string): Promise<Conflict[]> => {
  const response = await axiosClient.get<ApiEnvelope<Conflict[]>>(
    `/schedules/${scheduleId}/conflicts`
  );
  return response.data?.data ?? [];
};

// POST /api/conflicts/detect
export const detectConflicts = async (
  payload: DetectConflictsDto
): Promise<DetectConflictsResponse> => {
  const response = await axiosClient.post<ApiEnvelope<DetectConflictsResponse>>(
    "/conflicts/detect",
    payload
  );
  return unwrap(response.data, "Detect conflicts");
};
