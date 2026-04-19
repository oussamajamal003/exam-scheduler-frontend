import { axiosClient } from "./axiosclient";
import { Room, CreateRoomDto, UpdateRoomDto } from "../schemas/room";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
};

const mapBackendRoom = (room: any): Room => ({
  id: room.id,
  name: room.name,
  capacity: room.capacity,
  center: room.center?.name || "Unknown Center",
  status: room.status || "Available",
});

export const fetchRooms = async (): Promise<Room[]> => {
  const response = await axiosClient.get<ApiEnvelope<{ data: any[], meta?: unknown }>>("/rooms");
  return (response.data?.data?.data || []).map(mapBackendRoom);
};

export const fetchRoom = async (id: string): Promise<Room> => {
  const response = await axiosClient.get<ApiEnvelope<any>>(`/rooms/${id}`);
  if (!response.data?.data) throw new Error("Room not found in API response");
  return mapBackendRoom(response.data.data);
};

export const createRoom = async (room: CreateRoomDto): Promise<Room> => {
  const response = await axiosClient.post<ApiEnvelope<any>>("/rooms", room);
  if (!response.data?.data) throw new Error("Created room not found in API response");
  return mapBackendRoom(response.data.data);
};

export const updateRoom = async ({ id, data }: { id: string; data: UpdateRoomDto }): Promise<Room> => {
  const response = await axiosClient.put<ApiEnvelope<any>>(`/rooms/${id}`, data);
  if (!response.data?.data) throw new Error("Updated room not found in API response");
  return mapBackendRoom(response.data.data);
};

export const deleteRoom = async (id: string): Promise<void> => {
  await axiosClient.delete(`/rooms/${id}`);
};

export const fetchAvailableRooms = async (): Promise<Room[]> => {
  const response = await axiosClient.get<ApiEnvelope<{ data: any[], meta?: unknown }>>("/rooms/available");
  return (response.data?.data?.data || []).map(mapBackendRoom);
};
