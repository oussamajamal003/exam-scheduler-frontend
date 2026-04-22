import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createCenter, deleteCenter, fetchCenter, fetchCenters, updateCenter } from "../../api/center.api";
import { CreateCenterDto, UpdateCenterDto } from "../../schemas/center";
import { useToast } from "../../components/ui/toast";
import { getApiErrorMessage } from "../../lib/apiError";

export const useCenters = (search = "") => {
  return useQuery({
    queryKey: ["centers", search],
    queryFn: () => fetchCenters(search),
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["centers"] });
      addToast({ type: "success", title: "Center Added", description: `${data.name} has been added.` });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Add Center",
        description: getApiErrorMessage(error, "An error occurred while adding the center."),
      });
    },
  });
};

export const useUpdateCenter = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCenterDto }) => updateCenter({ id, data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["centers"] });
      addToast({ type: "success", title: "Center Updated", description: `${data.name} has been updated.` });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Update Center",
        description: getApiErrorMessage(error, "An error occurred while updating the center."),
      });
    },
  });
};

export const useDeleteCenter = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteCenter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centers"] });
      addToast({ type: "success", title: "Center Deleted", description: "The center has been removed." });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Delete Center",
        description: getApiErrorMessage(error, "An error occurred while deleting the center."),
      });
    },
  });
};
