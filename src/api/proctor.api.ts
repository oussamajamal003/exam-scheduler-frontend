import { axiosClient } from "./axiosclient";
import { Proctor, CreateProctorDto, UpdateProctorDto } from "../schemas/proctor";
import { TimeSlot } from "../schemas/timeSlot";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
};

type PaginatedProctorsPayload = {
  data: BackendProctor[];
  meta?: unknown;
};

const PROCTORS_PAGE_SIZE = 200;

type BackendTimeSlotRef = {
  timeSlotId?: string;
  timeSlot?: TimeSlot | null;
};

type BackendProctor = {
  id: string;
  name?: string;
  email?: string;
  department?: string | null;
  user?: {
    name?: string;
    email?: string;
  };
  availableTimeSlots?: BackendTimeSlotRef[];
  assignments?: unknown[];
  _count?: {
    assignments?: number;
  };
};

export type ProctorWorkloadAssignment = {
  id?: string;
  timeSlot?: {
    label?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
  } | null;
  room?: {
    id?: string;
    name?: string;
  } | null;
  exam?: {
    courseOffering?: {
      course?: { code?: string; title?: string } | null;
      semester?: { name?: string } | null;
    } | null;
  } | null;
};

export type ProctorWorkload = {
  workloadCount: number;
  assignments: ProctorWorkloadAssignment[];
};

const mapAvailableTimeSlots = (proctor: BackendProctor): TimeSlot[] => {
  return (proctor.availableTimeSlots ?? [])
    .map((entry) => entry.timeSlot ?? null)
    .filter((slot): slot is TimeSlot => Boolean(slot?.id));
};

const serializeProctor = (proctor: CreateProctorDto | UpdateProctorDto) => ({
  name: proctor.name,
  email: proctor.email,
  department: proctor.department,
  timeSlotIds: proctor.timeSlotIds ?? [],
});

const mapBackendProctor = (proctor: BackendProctor): Proctor => ({
  id: proctor.id,
  name: proctor.user?.name || proctor.name || "Unknown",
  email: proctor.user?.email || proctor.email || "Unknown",
  department: proctor.department || "—",
  user: proctor.user ?? null,
  availableTimeSlots: mapAvailableTimeSlots(proctor),
  timeSlotIds: (proctor.availableTimeSlots ?? [])
    .map((entry) => entry.timeSlotId ?? entry.timeSlot?.id)
    .filter((id): id is string => Boolean(id)),
  assignments: proctor.assignments ?? [],
});

export const fetchProctors = async (): Promise<Proctor[]> => {
  const proctors: BackendProctor[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await axiosClient.get<ApiEnvelope<PaginatedProctorsPayload>>("/proctors", {
      params: { page, pageSize: PROCTORS_PAGE_SIZE },
    });
    const payload = response.data?.data;
    proctors.push(...(payload?.data ?? []));
    totalPages = readProctorMeta(payload?.meta, page, PROCTORS_PAGE_SIZE).totalPages;
    page += 1;
  } while (page <= totalPages);

  return proctors.map(mapBackendProctor);
};

export type ProctorPageMeta = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type PagedProctors = { data: Proctor[]; meta: ProctorPageMeta };

const readProctorMeta = (meta: unknown, fallbackPage: number, fallbackSize: number): ProctorPageMeta => {
  const m = (meta && typeof meta === "object" ? meta : {}) as Record<string, unknown>;
  const total = Number(m.total ?? m.totalCount ?? 0) || 0;
  const limit = Number(m.limit ?? m.pageSize ?? fallbackSize) || fallbackSize;
  const page = Number(m.page ?? fallbackPage) || fallbackPage;
  const totalPages = Number(m.totalPages ?? Math.ceil(total / Math.max(limit, 1))) || 1;
  return { total, page, pageSize: limit, totalPages };
};

export const fetchProctorsPage = async ({
  page = 1,
  pageSize = 50,
  search,
  centerId,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  centerId?: string;
} = {}): Promise<PagedProctors> => {
  const response = await axiosClient.get<ApiEnvelope<PaginatedProctorsPayload>>("/proctors", {
    params: {
      page,
      limit: pageSize,
      search: search?.trim() ? search.trim() : undefined,
      centerId: centerId || undefined,
    },
  });
  const payload = response.data?.data;
  return {
    data: (payload?.data ?? []).map(mapBackendProctor),
    meta: readProctorMeta(payload?.meta, page, pageSize),
  };
};

export const fetchProctor = async (id: string): Promise<Proctor> => {
  const response = await axiosClient.get<ApiEnvelope<BackendProctor>>(`/proctors/${id}`);
  if (!response.data?.data) throw new Error("Proctor not found in API response");
  return mapBackendProctor(response.data.data);
};

export const createProctor = async (proctor: CreateProctorDto): Promise<Proctor> => {
  const response = await axiosClient.post<ApiEnvelope<BackendProctor>>("/proctors", serializeProctor(proctor));
  if (!response.data?.data) throw new Error("Created proctor not found in API response");
  return mapBackendProctor(response.data.data);
};

export const updateProctor = async ({ id, data }: { id: string; data: UpdateProctorDto }): Promise<Proctor> => {
  const response = await axiosClient.put<ApiEnvelope<BackendProctor>>(`/proctors/${id}`, serializeProctor(data));
  if (!response.data?.data) throw new Error("Updated proctor not found in API response");
  return mapBackendProctor(response.data.data);
};

export const deleteProctor = async (id: string): Promise<void> => {
  await axiosClient.delete(`/proctors/${id}`);
};

export const fetchProctorWorkload = async (id: string): Promise<ProctorWorkload> => {
  const response = await axiosClient.get<ApiEnvelope<ProctorWorkload>>(`/proctors/${id}/workload`);
  if (!response.data?.data) throw new Error("Proctor workload not found in API response");
  return response.data.data;
};
