import { axiosClient } from "./axiosclient";
import { Center, CreateCenterDto, UpdateCenterDto } from "../schemas/center";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
};

type PaginatedResponse<T> = {
  data: T[];
  meta?: unknown;
};

type BackendRoom = {
  id: string;
  name: string;
  capacity?: number;
  status?: string;
};

type BackendSupervisor = {
  id: string;
  department?: string | null;
  user?: { id?: string; name?: string; email?: string };
};

type BackendCenter = {
  id: string;
  name: string;
  location?: string | null;
  code?: string | null;
  description?: string | null;
  isActive?: boolean;
  rooms?: BackendRoom[];
  supervisors?: BackendSupervisor[];
  roomsCount?: number;
  supervisorsCount?: number;
  _count?: { rooms?: number; supervisors?: number };
};

const mapBackendCenter = (center: BackendCenter): Center => ({
  id: center.id,
  name: center.name,
  location: center.location ?? undefined,
  code: center.code ?? undefined,
  description: center.description ?? undefined,
  isActive: center.isActive ?? true,
  roomsCount: center.rooms?.length ?? center.roomsCount ?? center._count?.rooms ?? 0,
  supervisorsCount: center.supervisors?.length ?? center.supervisorsCount ?? center._count?.supervisors ?? 0,
  rooms: center.rooms?.map((r) => ({
    id: r.id,
    name: r.name,
    capacity: r.capacity,
    status: r.status,
  })),
  supervisors: center.supervisors?.map((s) => ({
    id: s.id,
    name: s.user?.name,
    email: s.user?.email,
    department: s.department ?? undefined,
  })),
});

export const fetchCenters = async (search = ""): Promise<Center[]> => {
  const response = await axiosClient.get<ApiEnvelope<PaginatedResponse<BackendCenter>>>("/centers", {
    params: { limit: 5000, search: search || undefined },
  });
  return (response.data?.data?.data ?? []).map(mapBackendCenter);
};

export const fetchCenter = async (id: string): Promise<Center> => {
  const response = await axiosClient.get<ApiEnvelope<BackendCenter>>(`/centers/${id}`);
  if (!response.data?.data) throw new Error("Center not found in API response");
  return mapBackendCenter(response.data.data);
};

export const createCenter = async (data: CreateCenterDto): Promise<Center> => {
  const response = await axiosClient.post<ApiEnvelope<BackendCenter>>("/centers", data);
  if (!response.data?.data) throw new Error("Created center not found in API response");
  return mapBackendCenter(response.data.data);
};

export const updateCenter = async ({ id, data }: { id: string; data: UpdateCenterDto }): Promise<Center> => {
  const response = await axiosClient.put<ApiEnvelope<BackendCenter>>(`/centers/${id}`, data);
  if (!response.data?.data) throw new Error("Updated center not found in API response");
  return mapBackendCenter(response.data.data);
};

export const deleteCenter = async (id: string): Promise<void> => {
  await axiosClient.delete(`/centers/${id}`);
};
