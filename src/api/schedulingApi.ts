import { axiosClient } from "./axiosclient";
import type {
  GenerateScheduleDto,
  GenerateScheduleResponse,
  Schedule,
} from "../schemas/schedule";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
};

const unwrap = <T,>(payload: ApiEnvelope<T> | undefined, label: string): T => {
  if (!payload?.data) throw new Error(`${label} response missing data`);
  return payload.data;
};

// Generic payload shapes — the backend accepts a flexible body for prepare /
// validate-input depending on inputs available (semesterId, centerIds, examIds, options).
export type PrepareSchedulingDto = {
  semesterId?: string;
  centerIds?: string[];
  examIds?: string[];
  options?: Record<string, unknown>;
};

export type ValidateSchedulingInputDto = PrepareSchedulingDto;

export type ScheduleAnalysis = {
  scheduleId: string;
  summary?: Record<string, unknown>;
  conflicts?: unknown[];
  metrics?: Record<string, unknown>;
  [key: string]: unknown;
};

// POST /api/scheduling/prepare
export const prepareScheduling = async (
  payload: PrepareSchedulingDto = {}
): Promise<unknown> => {
  const response = await axiosClient.post<ApiEnvelope<unknown>>(
    "/scheduling/prepare",
    payload
  );
  return response.data?.data;
};

// POST /api/scheduling/validate-input
export const validateSchedulingInput = async (
  payload: ValidateSchedulingInputDto = {}
): Promise<unknown> => {
  const response = await axiosClient.post<ApiEnvelope<unknown>>(
    "/scheduling/validate-input",
    payload
  );
  return response.data?.data;
};

// POST /api/scheduling/generate
export const generateSchedule = async (
  payload: GenerateScheduleDto
): Promise<GenerateScheduleResponse> => {
  const response = await axiosClient.post<ApiEnvelope<GenerateScheduleResponse>>(
    "/scheduling/generate",
    payload
  );
  return unwrap(response.data, "Generate schedule");
};

// GET /api/scheduling/:id/analysis
export const fetchScheduleAnalysis = async (id: string): Promise<ScheduleAnalysis> => {
  const response = await axiosClient.get<ApiEnvelope<ScheduleAnalysis>>(
    `/scheduling/${id}/analysis`
  );
  return unwrap(response.data, "Schedule analysis");
};

// PATCH /api/scheduling/:id/publish
export const publishSchedule = async (id: string): Promise<Schedule> => {
  const response = await axiosClient.patch<ApiEnvelope<Schedule>>(
    `/scheduling/${id}/publish`
  );
  return unwrap(response.data, "Publish schedule");
};
