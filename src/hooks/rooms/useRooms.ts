import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRooms, fetchRoom, fetchAvailableRooms, createRoom, updateRoom, deleteRoom } from "../../api/room.api";
import { CreateRoomDto, UpdateRoomDto } from "../../schemas/room";
import { useToast } from "../../components/ui/toast";

export const useRooms = () => {
  return useQuery({
    queryKey: ["rooms"],
    queryFn: fetchRooms,
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      addToast({
        type: "success",
        title: "Room Added",
        description: `Room ${data.name} has been successfully added to the system.`,
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Add Room",
        description: error?.message || "An error occurred while adding the room.",
      });
    },
  });
};

export const useUpdateRoom = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoomDto }) => updateRoom({ id, data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["rooms", data.id] });
      addToast({
        type: "success",
        title: "Room Updated",
        description: `Room ${data.name} has been successfully updated.`,
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Update Room",
        description: error?.message || "An error occurred while updating the room.",
      });
    },
  });
};

export const useDeleteRoom = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteRoom(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["rooms", id] });
      addToast({
        type: "success",
        title: "Room Deleted",
        description: "The room has been successfully removed from the system.",
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Delete Room",
        description: error?.message || "An error occurred while deleting the room.",
      });
    },
  });
};
