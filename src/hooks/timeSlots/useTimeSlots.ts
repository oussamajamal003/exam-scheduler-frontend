import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createTimeSlot, deleteTimeSlot, fetchTimeSlots, updateTimeSlot } from "../../api/timeSlot.api";
import { CreateTimeSlotDto, UpdateTimeSlotDto } from "../../schemas/timeSlot";
import { useToast } from "../../components/ui/toast";
import { getApiErrorMessage } from "../../lib/apiError";

export const useTimeSlots = () => {
  return useQuery({
    queryKey: ["timeSlots"],
    queryFn: fetchTimeSlots,
  });
};

export const useCreateTimeSlot = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (data: CreateTimeSlotDto) => createTimeSlot(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeSlots"] });
      addToast({ type: "success", title: "Time Slot Added", description: "The time slot has been created." });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Add Time Slot",
        description: getApiErrorMessage(error, "An error occurred while adding the time slot."),
      });
    },
  });
};

export const useUpdateTimeSlot = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTimeSlotDto }) => updateTimeSlot({ id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeSlots"] });
      addToast({ type: "success", title: "Time Slot Updated", description: "The time slot has been updated." });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Update Time Slot",
        description: getApiErrorMessage(error, "An error occurred while updating the time slot."),
      });
    },
  });
};

export const useDeleteTimeSlot = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteTimeSlot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeSlots"] });
      addToast({ type: "success", title: "Time Slot Deleted", description: "The time slot has been removed." });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Delete Time Slot",
        description: getApiErrorMessage(error, "An error occurred while deleting the time slot."),
      });
    },
  });
};
