import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRooms, fetchRoomsPage, fetchRoom, fetchAvailableRooms, createRoom, updateRoom, deleteRoom } from "../../api/room.api";
import { CreateRoomDto, UpdateRoomDto } from "../../schemas/room";
import { useToast } from "../../components/ui/toast";
import { getSmartErrorDescription } from "../../lib/apiError";
import { invalidateScheduleQuerySync } from "../../lib/scheduleQuerySync";

export const useRooms = () => {
  return useQuery({
    queryKey: ["rooms"],
    queryFn: fetchRooms,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useRoomsPage = ({
  page = 1,
  pageSize = 50,
  search = "",
  centerId,
  enabled = true,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  centerId?: string;
  enabled?: boolean;
} = {}) => {
  return useQuery({
    queryKey: ["rooms", "page", { page, pageSize, search, centerId: centerId ?? null }],
    queryFn: () => fetchRoomsPage({ page, pageSize, search, centerId }),
    enabled,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
};

export const useAvailableRooms = () => {
  return useQuery({
    queryKey: ["rooms", "available"],
    queryFn: fetchAvailableRooms,
  });
};

export const useRoom = (id: string | null) => {
  return useQuery({
    queryKey: ["rooms", id],
    queryFn: () => fetchRoom(id as string),
    enabled: !!id,
  });
};

export const useCreateRoom = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (data: CreateRoomDto) => createRoom(data),
    onSuccess: async (data) => {
      await invalidateScheduleQuerySync(queryClient, {
        includeRooms: true,
      });
      addToast({
        type: "success",
        title: "Room Added",
        description: `Room ${data.name} has been successfully added to the system.`,
      });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Add Room",
        description: getSmartErrorDescription(error, "An error occurred while adding the room."),
      });
    },
  });
};

export const useUpdateRoom = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoomDto }) => updateRoom({ id, data }),
    onSuccess: async (data) => {
      await invalidateScheduleQuerySync(queryClient, {
        includeRooms: true,
      });
      queryClient.invalidateQueries({ queryKey: ["rooms", data.id] });
      addToast({
        type: "success",
        title: "Room Updated",
        description: `Room ${data.name} has been successfully updated.`,
      });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Update Room",
        description: getSmartErrorDescription(error, "An error occurred while updating the room."),
      });
    },
  });
};

export const useDeleteRoom = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteRoom(id),
    onSuccess: async (_data, id) => {
      await invalidateScheduleQuerySync(queryClient, {
        includeRooms: true,
      });
      queryClient.invalidateQueries({ queryKey: ["rooms", id] });
      addToast({
        type: "success",
        title: "Room Deleted",
        description: "The room has been successfully removed from the system.",
      });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Delete Room",
        description: getSmartErrorDescription(error, "An error occurred while deleting the room."),
      });
    },
  });
};
