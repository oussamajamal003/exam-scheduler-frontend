import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProctors, fetchProctor, createProctor, updateProctor, deleteProctor, fetchProctorWorkload } from "../../api/proctor.api";
import { CreateProctorDto, UpdateProctorDto } from "../../schemas/proctor";
import { useToast } from "../../components/ui/toast";
import { getSmartErrorDescription } from "../../lib/apiError";

export const useProctors = () => {
  return useQuery({
    queryKey: ["proctors"],
    queryFn: fetchProctors,
  });
};

export const useProctor = (id: string | null) => {
  return useQuery({
    queryKey: ["proctors", id],
    queryFn: () => fetchProctor(id as string),
    enabled: !!id,
  });
};

export const useCreateProctor = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (data: CreateProctorDto) => createProctor(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["proctors"] });
      addToast({
        type: "success",
        title: "Proctor Added",
        description: `${data.name} has been successfully added as a proctor.`,
      });
    },
    onError: (error: Error) => {
      addToast({
        type: "error",
        title: "Failed to Add Proctor",
        description: getSmartErrorDescription(error, "An error occurred while adding the proctor."),
      });
    },
  });
};

export const useUpdateProctor = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProctorDto }) => updateProctor({ id, data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["proctors"] });
      queryClient.invalidateQueries({ queryKey: ["proctors", data.id] });
      addToast({
        type: "success",
        title: "Proctor Updated",
        description: `${data.name}'s information has been successfully updated.`,
      });
    },
    onError: (error: Error) => {
      addToast({
        type: "error",
        title: "Failed to Update Proctor",
        description: getSmartErrorDescription(error, "An error occurred while updating the proctor."),
      });
    },
  });
};

export const useDeleteProctor = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteProctor(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["proctors"] });
      queryClient.invalidateQueries({ queryKey: ["proctors", id] });
      addToast({
        type: "success",
        title: "Proctor Removed",
        description: "The proctor has been successfully removed from the system.",
      });
    },
    onError: (error: Error) => {
      addToast({
        type: "error",
        title: "Failed to Remove Proctor",
        description: getSmartErrorDescription(error, "An error occurred while removing the proctor."),
      });
    },
  });
};

export const useProctorWorkload = (id: string | null) => {
  return useQuery({
    queryKey: ["proctors", id, "workload"],
    queryFn: () => fetchProctorWorkload(id as string),
    enabled: !!id,
  });
};
