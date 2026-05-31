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

const ROOMS_PAGE_SIZE = 200;

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
  const rooms: BackendRoom[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await axiosClient.get<ApiEnvelope<PaginatedRoomsPayload>>("/rooms", {
      params: { page, pageSize: ROOMS_PAGE_SIZE },
    });
    const payload = response.data?.data;
    rooms.push(...(payload?.data ?? []));
    totalPages = readRoomMeta(payload?.meta, page, ROOMS_PAGE_SIZE).totalPages;
    page += 1;
  } while (page <= totalPages);

  return rooms.map(mapBackendRoom);
};

export type RoomPageMeta = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type PagedRooms = { data: Room[]; meta: RoomPageMeta };

const readRoomMeta = (meta: unknown, fallbackPage: number, fallbackSize: number): RoomPageMeta => {
  const m = (meta && typeof meta === "object" ? meta : {}) as Record<string, unknown>;
  const total = Number(m.total ?? m.totalCount ?? 0) || 0;
  const limit = Number(m.limit ?? m.pageSize ?? fallbackSize) || fallbackSize;
  const page = Number(m.page ?? fallbackPage) || fallbackPage;
  const totalPages = Number(m.totalPages ?? Math.ceil(total / Math.max(limit, 1))) || 1;
  return { total, page, pageSize: limit, totalPages };
};

export const fetchRoomsPage = async ({
  page = 1,
  pageSize = 50,
  search,
  centerId,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  centerId?: string;
} = {}): Promise<PagedRooms> => {
  const response = await axiosClient.get<ApiEnvelope<PaginatedRoomsPayload>>("/rooms", {
    params: {
      page,
      limit: pageSize,
      search: search?.trim() ? search.trim() : undefined,
      centerId: centerId || undefined,
    },
  });
  const payload = response.data?.data;
  return {
    data: (payload?.data ?? []).map(mapBackendRoom),
    meta: readRoomMeta(payload?.meta, page, pageSize),
  };
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
  const response = await axiosClient.get<ApiEnvelope<PaginatedRoomsPayload>>("/rooms/available", { params: { pageSize: ROOMS_PAGE_SIZE } });
  return (response.data?.data?.data || []).map(mapBackendRoom);
};

