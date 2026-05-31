import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createCenter, deleteCenter, fetchCenter, fetchCenters, fetchCentersPage, updateCenter } from "../../api/center.api";
import { CreateCenterDto, UpdateCenterDto } from "../../schemas/center";
import { useToast } from "../../components/ui/toast";
import { getSmartErrorDescription } from "../../lib/apiError";
import { invalidateScheduleQuerySync } from "../../lib/scheduleQuerySync";

export const useCenters = (search = "") => {
  return useQuery({
    queryKey: ["centers", search],
    queryFn: () => fetchCenters(search),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useCentersPage = ({
  page = 1,
  pageSize = 50,
  search = "",
  enabled = true,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  enabled?: boolean;
} = {}) => {
  return useQuery({
    queryKey: ["centers", "page", { page, pageSize, search }],
    queryFn: () => fetchCentersPage({ page, pageSize, search }),
    enabled,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
};

export const useCenter = (id?: string) => {
  return useQuery({
    queryKey: ["centers", "detail", id],
    queryFn: () => fetchCenter(id as string),
    enabled: Boolean(id),
  });
};

export const useCreateCenter = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (data: CreateCenterDto) => createCenter(data),
    onSuccess: async (data) => {
      await invalidateScheduleQuerySync(queryClient, {
        includeCenters: true,
        includeRooms: true,
      });
      addToast({ type: "success", title: "Center Added", description: `${data.name} has been added.` });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Add Center",
        description: getSmartErrorDescription(error, "An error occurred while adding the center."),
      });
    },
  });
};

export const useUpdateCenter = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCenterDto }) => updateCenter({ id, data }),
    onSuccess: async (data) => {
      await invalidateScheduleQuerySync(queryClient, {
        includeCenters: true,
        includeRooms: true,
      });
      addToast({ type: "success", title: "Center Updated", description: `${data.name} has been updated.` });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Update Center",
        description: getSmartErrorDescription(error, "An error occurred while updating the center."),
      });
    },
  });
};

export const useDeleteCenter = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteCenter(id),
    onSuccess: async () => {
      await invalidateScheduleQuerySync(queryClient, {
        includeCenters: true,
        includeRooms: true,
      });
      addToast({ type: "success", title: "Center Deleted", description: "The center has been removed." });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Delete Center",
        description: getSmartErrorDescription(error, "An error occurred while deleting the center."),
      });
    },
  });
};
