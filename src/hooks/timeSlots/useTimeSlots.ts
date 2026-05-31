import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createTimeSlot, deleteTimeSlot, fetchTimeSlots, fetchTimeSlotsPage, updateTimeSlot } from "../../api/timeSlot.api";
import { CreateTimeSlotDto, UpdateTimeSlotDto } from "../../schemas/timeSlot";
import { useToast } from "../../components/ui/toast";
import { getSmartErrorDescription } from "../../lib/apiError";
import { invalidateScheduleQuerySync } from "../../lib/scheduleQuerySync";

export const useTimeSlots = () => {
  return useQuery({
    queryKey: ["timeSlots"],
    queryFn: fetchTimeSlots,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useTimeSlotsPage = ({
  page = 1,
  pageSize = 50,
  search = "",
  sortField,
  sortDirection,
  enabled = true,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  enabled?: boolean;
} = {}) => {
  return useQuery({
    queryKey: ["timeSlots", "page", { page, pageSize, search, sortField: sortField ?? null, sortDirection: sortDirection ?? null }],
    queryFn: () => fetchTimeSlotsPage({ page, pageSize, search, sortField, sortDirection }),
    enabled,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
};

export const useCreateTimeSlot = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (data: CreateTimeSlotDto) => createTimeSlot(data),
    onSuccess: async () => {
      await invalidateScheduleQuerySync(queryClient, {
        includeTimeSlots: true,
      });
      addToast({ type: "success", title: "Time Slot Added", description: "The time slot has been created." });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Add Time Slot",
        description: getSmartErrorDescription(error, "An error occurred while adding the time slot."),
      });
    },
  });
};

export const useUpdateTimeSlot = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTimeSlotDto }) => updateTimeSlot({ id, data }),
    onSuccess: async () => {
      await invalidateScheduleQuerySync(queryClient, {
        includeTimeSlots: true,
      });
      addToast({ type: "success", title: "Time Slot Updated", description: "The time slot has been updated." });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Update Time Slot",
        description: getSmartErrorDescription(error, "An error occurred while updating the time slot."),
      });
    },
  });
};

export const useDeleteTimeSlot = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteTimeSlot(id),
    onSuccess: async () => {
      await invalidateScheduleQuerySync(queryClient, {
        includeTimeSlots: true,
      });
      addToast({ type: "success", title: "Time Slot Deleted", description: "The time slot has been removed." });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Delete Time Slot",
        description: getSmartErrorDescription(error, "An error occurred while deleting the time slot."),
      });
    },
  });
};
