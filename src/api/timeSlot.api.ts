import { axiosClient } from "./axiosclient";
import { CreateTimeSlotDto, TimeSlot, UpdateTimeSlotDto } from "../schemas/timeSlot";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
};

type PaginatedResponse<T> = {
  data: T[];
  meta?: unknown;
};

type BackendTimeSlot = {
  id: string;
  date?: string | null;
  startTime: string;
  endTime: string;
  duration?: number | null;
  _count?: { assignments?: number };
  assignments?: unknown[];
};

const mapBackendTimeSlot = (slot: BackendTimeSlot): TimeSlot => ({
  id: slot.id,
  date: slot.date ?? slot.startTime,
  startTime: slot.startTime,
  endTime: slot.endTime,
  duration: slot.duration ?? undefined,
  assignmentsCount: slot._count?.assignments ?? slot.assignments?.length ?? 0,
});

const combineDateTime = (date: string, time: string): string => {
  if (!date || !time) return new Date().toISOString();
  const [h = "0", m = "0"] = time.split(":");
  const composed = new Date(`${date}T00:00:00.000Z`);
  composed.setUTCHours(Number(h), Number(m), 0, 0);
  return composed.toISOString();
};

const computeDurationMinutes = (startIso: string, endIso: string): number => {
  const diff = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Math.max(0, Math.round(diff / 60000));
};

const serialize = <T extends Partial<CreateTimeSlotDto>>(payload: T) => {
  const out: Record<string, unknown> = { ...payload };
  if (payload.date && payload.startTime) {
    out.startTime = combineDateTime(payload.date, payload.startTime);
  }
  if (payload.date && payload.endTime) {
    out.endTime = combineDateTime(payload.date, payload.endTime);
  }
  if (payload.date) {
    out.date = new Date(`${payload.date}T00:00:00.000Z`).toISOString();
  }
  if (out.startTime && out.endTime) {
    out.duration = computeDurationMinutes(String(out.startTime), String(out.endTime));
  }
  return out;
};

export const fetchTimeSlots = async (): Promise<TimeSlot[]> => {
  const response = await axiosClient.get<ApiEnvelope<PaginatedResponse<BackendTimeSlot>>>("/timeslots", {
    params: { limit: 100 },
  });
  return (response.data?.data?.data ?? []).map(mapBackendTimeSlot);
};

export const createTimeSlot = async (data: CreateTimeSlotDto): Promise<TimeSlot> => {
  const response = await axiosClient.post<ApiEnvelope<BackendTimeSlot>>("/timeslots", serialize(data));
  if (!response.data?.data) throw new Error("Created time slot not found in API response");
  return mapBackendTimeSlot(response.data.data);
};

export const updateTimeSlot = async ({ id, data }: { id: string; data: UpdateTimeSlotDto }): Promise<TimeSlot> => {
  const response = await axiosClient.put<ApiEnvelope<BackendTimeSlot>>(`/timeslots/${id}`, serialize(data));
  if (!response.data?.data) throw new Error("Updated time slot not found in API response");
  return mapBackendTimeSlot(response.data.data);
};

export const deleteTimeSlot = async (id: string): Promise<void> => {
  await axiosClient.delete(`/timeslots/${id}`);
};
