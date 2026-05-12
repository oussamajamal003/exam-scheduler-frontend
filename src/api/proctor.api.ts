import { axiosClient } from "./axiosclient";
import { Proctor, CreateProctorDto, UpdateProctorDto } from "../schemas/proctor";
import { TimeSlot } from "../schemas/timeSlot";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
};

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
  center?: {
    id?: string;
    name?: string;
  } | string;
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
  centerId: proctor.centerId,
  center: proctor.center,
  timeSlotIds: proctor.timeSlotIds ?? [],
});

const mapBackendProctor = (proctor: BackendProctor): Proctor => ({
  id: proctor.id,
  name: proctor.user?.name || proctor.name || "Unknown",
  email: proctor.user?.email || proctor.email || "Unknown",
  department: proctor.department || "—",
  centerId: typeof proctor.center === "string" ? "" : proctor.center?.id || "",
  user: proctor.user ?? null,
  center: typeof proctor.center === "string" ? proctor.center : proctor.center?.name || "Unknown",
  centerRef: typeof proctor.center === "string" ? null : proctor.center ?? null,
  availableTimeSlots: mapAvailableTimeSlots(proctor),
  timeSlotIds: (proctor.availableTimeSlots ?? [])
    .map((entry) => entry.timeSlotId ?? entry.timeSlot?.id)
    .filter((id): id is string => Boolean(id)),
  assignments: proctor.assignments ?? [],
});

export const fetchProctors = async (): Promise<Proctor[]> => {
  const response = await axiosClient.get<ApiEnvelope<{ data: BackendProctor[]; meta?: unknown }>>("/proctors", { params: { limit: 5000 } });
  return (response.data?.data?.data || []).map(mapBackendProctor);
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
