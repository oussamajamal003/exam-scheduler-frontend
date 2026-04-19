import { axiosClient } from "./axiosclient";
import { Supervisor, CreateSupervisorDto, UpdateSupervisorDto } from "../schemas/supervisor";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
};

type BackendSupervisor = {
  id: string;
  name?: string;
  email?: string;
  user?: {
    name?: string;
    email?: string;
  };
  center?: {
    name?: string;
  } | string;
};

type SupervisorWorkload = {
  supervisorId: string;
  totalAssignments: number;
  assignments: unknown[];
};

const mapBackendSupervisor = (supervisor: BackendSupervisor): Supervisor => ({
  id: supervisor.id,
  name: supervisor.user?.name || supervisor.name || "Unknown",
  email: supervisor.user?.email || supervisor.email || "Unknown",
  department: "General",
  center: typeof supervisor.center === "string" ? supervisor.center : supervisor.center?.name || "Unknown",
});

export const fetchSupervisors = async (): Promise<Supervisor[]> => {
  const response = await axiosClient.get<ApiEnvelope<{ data: BackendSupervisor[], meta?: unknown }>>("/supervisors");
  return (response.data?.data?.data || []).map(mapBackendSupervisor);
};

export const fetchSupervisor = async (id: string): Promise<Supervisor> => {
  const response = await axiosClient.get<ApiEnvelope<BackendSupervisor>>(`/supervisors/${id}`);
  if (!response.data?.data) throw new Error("Supervisor not found in API response");
  return mapBackendSupervisor(response.data.data);
};

export const createSupervisor = async (supervisor: CreateSupervisorDto): Promise<Supervisor> => {
  const response = await axiosClient.post<ApiEnvelope<BackendSupervisor>>("/supervisors", supervisor);
  if (!response.data?.data) throw new Error("Created supervisor not found in API response");
  return mapBackendSupervisor(response.data.data);
};

export const updateSupervisor = async ({ id, data }: { id: string; data: UpdateSupervisorDto }): Promise<Supervisor> => {
  const response = await axiosClient.put<ApiEnvelope<BackendSupervisor>>(`/supervisors/${id}`, data);
  if (!response.data?.data) throw new Error("Updated supervisor not found in API response");
  return mapBackendSupervisor(response.data.data);
};

export const deleteSupervisor = async (id: string): Promise<void> => {
  await axiosClient.delete(`/supervisors/${id}`);
};

export const fetchSupervisorWorkload = async (id: string): Promise<SupervisorWorkload> => {
  const response = await axiosClient.get<ApiEnvelope<SupervisorWorkload>>(`/supervisors/${id}/workload`);
  if (!response.data?.data) throw new Error("Supervisor workload not found in API response");
  return response.data.data;
};
