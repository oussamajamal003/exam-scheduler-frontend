import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createSemester, deleteSemester, fetchSemesters, updateSemester } from "../../api/semester.api";
import { CreateSemesterDto, UpdateSemesterDto } from "../../schemas/semester";
import { useToast } from "../../components/ui/toast";
import { getSmartErrorDescription } from "../../lib/apiError";

export const useSemesters = (search = "") => {
  return useQuery({
    queryKey: ["semesters", search],
    queryFn: () => fetchSemesters(search),
  });
};

export const useCreateSemester = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (data: CreateSemesterDto) => createSemester(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      addToast({
        type: "success",
        title: "Semester Added",
        description: `${data.name} has been added.`,
      });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Add Semester",
        description: getSmartErrorDescription(error, "An error occurred while adding the semester."),
      });
    },
  });
};

export const useUpdateSemester = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSemesterDto }) => updateSemester({ id, data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      addToast({
        type: "success",
        title: "Semester Updated",
        description: `${data.name} has been updated.`,
      });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Update Semester",
        description: getSmartErrorDescription(error, "An error occurred while updating the semester."),
      });
    },
  });
};

export const useDeleteSemester = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteSemester(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      addToast({
        type: "success",
        title: "Semester Deleted",
        description: "The semester has been removed.",
      });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Delete Semester",
        description: getSmartErrorDescription(error, "An error occurred while deleting the semester."),
      });
    },
  });
};
