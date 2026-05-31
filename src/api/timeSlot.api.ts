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

type RawMeta = Record<string, number>;

const TIME_SLOTS_PAGE_SIZE = 200;

export type PaginatedMeta = {
  total: number;
  totalCount: number;
  page: number;
  limit: number;
  pageSize: number;
  totalPages: number;
};

export type PagedTimeSlots = {
  data: TimeSlot[];
  meta: PaginatedMeta;
};

type BackendTimeSlot = {
  id: string;
  date?: string | null;
  startTime: string;
  endTime: string;
  duration?: number | null;
  assignments?: Array<{ scheduleId?: string; examId?: string }>;
};

const countLogicalTimeSlotAssignments = (
  assignments: Array<{ scheduleId?: string; examId?: string }> = []
) => {
  const keys = new Set<string>();
  for (const assignment of assignments) {
    if (assignment.scheduleId && assignment.examId) {
      keys.add(`${assignment.scheduleId}:${assignment.examId}`);
      continue;
    }
    keys.add(JSON.stringify(assignment));
  }
  return keys.size;
};

const mapBackendTimeSlot = (slot: BackendTimeSlot): TimeSlot => ({
  id: slot.id,
  date: slot.date ?? slot.startTime,
  startTime: slot.startTime,
  endTime: slot.endTime,
  duration: slot.duration ?? undefined,
  assignments: slot.assignments ?? [],
  assignmentsCount: countLogicalTimeSlotAssignments(slot.assignments ?? []),
});

const readMeta = (raw: unknown, page: number, pageSize: number): PaginatedMeta => {
  const m = (raw ?? {}) as RawMeta;
  return {
    total:      m.total      ?? m.totalCount ?? 0,
    totalCount: m.total      ?? m.totalCount ?? 0,
    page:       m.page       ?? page,
    limit:      m.limit      ?? m.pageSize   ?? pageSize,
    pageSize:   m.pageSize   ?? m.limit      ?? pageSize,
    totalPages: m.totalPages ?? 1,
  };
};

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

/** Legacy: fetches all time slots (kept for backwards compatibility with mutations/form). */
export const fetchTimeSlots = async (): Promise<TimeSlot[]> => {
  const timeSlots: BackendTimeSlot[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await axiosClient.get<ApiEnvelope<PaginatedResponse<BackendTimeSlot>>>("/timeslots", {
      params: { page, pageSize: TIME_SLOTS_PAGE_SIZE },
    });
    const payload = response.data?.data;
    timeSlots.push(...(payload?.data ?? []));
    totalPages = readMeta(payload?.meta, page, TIME_SLOTS_PAGE_SIZE).totalPages;
    page += 1;
  } while (page <= totalPages);

  return timeSlots.map(mapBackendTimeSlot);
};

/** Paginated + searchable fetch — use this for the TimeSlotsPage list. */
export const fetchTimeSlotsPage = async ({
  page = 1,
  pageSize = 50,
  search,
  sortField,
  sortDirection,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  sortField?: string;
  sortDirection?: "asc" | "desc";
} = {}): Promise<PagedTimeSlots> => {
  const response = await axiosClient.get<ApiEnvelope<PaginatedResponse<BackendTimeSlot>>>("/timeslots", {
    params: {
      page,
      pageSize,
      search: search?.trim() || undefined,
      sortField: sortField || undefined,
      sortDirection: sortDirection || undefined,
    },
  });
  const payload = response.data?.data;
  return {
    data: (payload?.data ?? []).map(mapBackendTimeSlot),
    meta: readMeta(payload?.meta, page, pageSize),
  };
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
