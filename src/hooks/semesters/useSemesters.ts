import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createSemester, deleteSemester, fetchSemesters, fetchSemestersPage, updateSemester } from "../../api/semester.api";
import { CreateSemesterDto, UpdateSemesterDto } from "../../schemas/semester";
import { useToast } from "../../components/ui/toast";
import { getSmartErrorDescription } from "../../lib/apiError";
import { invalidateScheduleQuerySync } from "../../lib/scheduleQuerySync";

export const useSemesters = (search = "") => {
  return useQuery({
    queryKey: ["semesters", search],
    queryFn: () => fetchSemesters(search),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useSemestersPage = ({
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
    queryKey: ["semesters", "page", { page, pageSize, search }],
    queryFn: () => fetchSemestersPage({ page, pageSize, search }),
    enabled,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
};

export const useCreateSemester = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (data: CreateSemesterDto) => createSemester(data),
    onSuccess: async (data) => {
      await invalidateScheduleQuerySync(queryClient, {
        includeSemesters: true,
        includeCourses: true,
        includeCourseOfferings: true,
        includeEnrollments: true,
      });
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
    onSuccess: async (data) => {
      await invalidateScheduleQuerySync(queryClient, {
        includeSemesters: true,
        includeCourses: true,
        includeCourseOfferings: true,
        includeEnrollments: true,
      });
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
    onSuccess: async () => {
      await invalidateScheduleQuerySync(queryClient, {
        includeSemesters: true,
        includeCourses: true,
        includeCourseOfferings: true,
        includeEnrollments: true,
      });
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
