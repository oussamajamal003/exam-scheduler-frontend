import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSupervisors, fetchSupervisor, createSupervisor, updateSupervisor, deleteSupervisor, fetchSupervisorWorkload } from "../../api/supervisor.api";
import { CreateSupervisorDto, UpdateSupervisorDto } from "../../schemas/supervisor";
import { useToast } from "../../components/ui/toast";

export const useSupervisors = () => {
  return useQuery({
    queryKey: ["supervisors"],
    queryFn: fetchSupervisors,
  });
};

export const useSupervisor = (id: string | null) => {
  return useQuery({
    queryKey: ["supervisors", id],
    queryFn: () => fetchSupervisor(id as string),
    enabled: !!id,
  });
};

export const useCreateSupervisor = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (data: CreateSupervisorDto) => createSupervisor(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["supervisors"] });
      addToast({
        type: "success",
        title: "Supervisor Added",
        description: `${data.name} has been successfully added as a supervisor.`,
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Add Supervisor",
        description: error?.message || "An error occurred while adding the supervisor.",
      });
    },
  });
};

export const useUpdateSupervisor = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSupervisorDto }) => updateSupervisor({ id, data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["supervisors"] });
      queryClient.invalidateQueries({ queryKey: ["supervisors", data.id] });
      addToast({
        type: "success",
        title: "Supervisor Updated",
        description: `${data.name}'s information has been successfully updated.`,
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Update Supervisor",
        description: error?.message || "An error occurred while updating the supervisor.",
      });
    },
  });
};

export const useDeleteSupervisor = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteSupervisor(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["supervisors"] });
      queryClient.invalidateQueries({ queryKey: ["supervisors", id] });
      addToast({
        type: "success",
        title: "Supervisor Removed",
        description: "The supervisor has been successfully removed from the system.",
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Remove Supervisor",
        description: error?.message || "An error occurred while removing the supervisor.",
      });
    },
  });
};

export const useSupervisorWorkload = (id: string | null) => {
  return useQuery({
    queryKey: ["supervisors", id, "workload"],
    queryFn: () => fetchSupervisorWorkload(id as string),
    enabled: !!id,
  });
};
