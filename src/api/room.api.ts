import { axiosClient } from "./axiosclient";
import { Room, CreateRoomDto, UpdateRoomDto } from "../schemas/room";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
};

type BackendRoom = {
  id?: string;
  name: string;
  capacity: number;
  centerId?: string | null;
  center?: {
    id?: string;
    name?: string;
  } | null;
  assignments?: unknown[];
  status?: string | null;
};

type PaginatedRoomsPayload = {
  data: BackendRoom[];
  meta?: unknown;
};

const mapBackendRoom = (room: BackendRoom): Room => ({
  id: room.id,
  name: room.name,
  capacity: room.capacity,
  centerId: room.centerId ?? room.center?.id ?? "",
  center: room.center ?? null,
  centerName: room.center?.name ?? "",
  status: room.status ? room.status.toLowerCase().replace(/^./, (s: string) => s.toUpperCase()) as "Available" | "Maintenance" : "Available",
  assignments: room.assignments ?? [],
});

export const fetchRooms = async (): Promise<Room[]> => {
  const response = await axiosClient.get<ApiEnvelope<PaginatedRoomsPayload>>("/rooms");
  return (response.data?.data?.data || []).map(mapBackendRoom);
};

export const fetchRoom = async (id: string): Promise<Room> => {
  const response = await axiosClient.get<ApiEnvelope<BackendRoom>>(`/rooms/${id}`);
  if (!response.data?.data) throw new Error("Room not found in API response");
  return mapBackendRoom(response.data.data);
};

export const createRoom = async (room: CreateRoomDto): Promise<Room> => {
  const { centerId, ...rest } = room;
  const response = await axiosClient.post<ApiEnvelope<BackendRoom>>("/rooms", { ...rest, centerId });
  if (!response.data?.data) throw new Error("Created room not found in API response");
  return mapBackendRoom(response.data.data);
};

export const updateRoom = async ({ id, data }: { id: string; data: UpdateRoomDto }): Promise<Room> => {
  const { centerId, ...rest } = data;
  const payload: Record<string, unknown> = { ...rest };
  if (centerId) payload.centerId = centerId;
  const response = await axiosClient.put<ApiEnvelope<BackendRoom>>(`/rooms/${id}`, payload);
  if (!response.data?.data) throw new Error("Updated room not found in API response");
  return mapBackendRoom(response.data.data);
};

export const deleteRoom = async (id: string): Promise<void> => {
  await axiosClient.delete(`/rooms/${id}`);
};

export const fetchAvailableRooms = async (): Promise<Room[]> => {
  const response = await axiosClient.get<ApiEnvelope<PaginatedRoomsPayload>>("/rooms/available");
  return (response.data?.data?.data || []).map(mapBackendRoom);
};

