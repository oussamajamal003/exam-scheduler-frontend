import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCourseOffering,
  deleteCourseOffering,
  fetchCourseOffering,
  fetchCourseOfferings,
  fetchCourseOfferingsPage,
  fetchCoursesForOfferings,
  fetchCoursesForOfferingsPage,
  fetchSelectedCourseForOffering,
  updateCourseOffering,
} from "../../api/courseOffering.api";
import {
  CreateCourseOfferingDto,
  UpdateCourseOfferingDto,
} from "../../schemas/courseOffering";
import { useToast } from "../../components/ui/toast";
import { getSmartErrorDescription } from "../../lib/apiError";
import { invalidateScheduleQuerySync } from "../../lib/scheduleQuerySync";

export const useCourseOfferings = ({
  search = "",
  semesterId,
  departmentId,
  enabled = true,
}: {
  search?: string;
  semesterId?: string;
  departmentId?: string;
  enabled?: boolean;
} = {}) => {
  return useQuery({
    queryKey: ["course-offerings", semesterId ?? null, departmentId ?? null, search],
    queryFn: () => fetchCourseOfferings({ search, semesterId, departmentId }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useCourseOfferingsPage = ({
  page = 1,
  pageSize = 50,
  search = "",
  semesterId,
  departmentId,
  enabled = true,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  semesterId?: string;
  departmentId?: string;
  enabled?: boolean;
} = {}) => {
  return useQuery({
    queryKey: ["course-offerings", "page", { page, pageSize, search, semesterId: semesterId ?? null, departmentId: departmentId ?? null }],
    queryFn: () => fetchCourseOfferingsPage({ page, pageSize, search, semesterId, departmentId }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useCourseOffering = (id?: string) => {
  return useQuery({
    queryKey: ["course-offering", id],
    queryFn: () => fetchCourseOffering(id ?? ""),
    enabled: Boolean(id),
  });
};

export const useCoursesForOfferings = ({ enabled = true }: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: ["courses", "for-offerings"],
    queryFn: fetchCoursesForOfferings,
    enabled,
  });
};

export const useCoursesForOfferingsPage = ({
  search = "",
  enabled = true,
}: {
  search?: string;
  enabled?: boolean;
} = {}) => {
  return useQuery({
    queryKey: ["courses", "for-offerings", "page", { search }],
    queryFn: () => fetchCoursesForOfferingsPage({ search, pageSize: 30 }),
    enabled,
    placeholderData: keepPreviousData,
  });
};

export const useSelectedCourseForOffering = (courseId?: string) => {
  return useQuery({
    queryKey: ["course", "for-offering", courseId],
    queryFn: () => fetchSelectedCourseForOffering(courseId ?? ""),
    enabled: Boolean(courseId),
  });
};

export const useCreateCourseOffering = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (data: CreateCourseOfferingDto) => createCourseOffering(data),
    onSuccess: async (data) => {
      await invalidateScheduleQuerySync(queryClient, {
        includeCourseOfferings: true,
        includeEnrollments: true,
      });
      addToast({
        type: "success",
        title: "Offering Added",
        description: `${data.course?.title ?? "Offering"} has been added successfully.`,
      });
    },
    onError: (error: Error) => {
      addToast({
        type: "error",
        title: "Failed to Add Offering",
        description: getSmartErrorDescription(error, "An error occurred while adding the offering."),
      });
    },
  });
};

export const useUpdateCourseOffering = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCourseOfferingDto }) =>
      updateCourseOffering({ id, data }),
    onSuccess: async (data) => {
      await invalidateScheduleQuerySync(queryClient, {
        includeCourseOfferings: true,
        includeEnrollments: true,
      });
      queryClient.invalidateQueries({ queryKey: ["course-offering", data.id] });
      addToast({
        type: "success",
        title: "Offering Updated",
        description: `${data.course?.title ?? "Offering"} has been updated successfully.`,
      });
    },
    onError: (error: Error) => {
      addToast({
        type: "error",
        title: "Failed to Update Offering",
        description: getSmartErrorDescription(error, "An error occurred while updating the offering."),
      });
    },
  });
};

export const useDeleteCourseOffering = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteCourseOffering(id),
    onSuccess: async () => {
      await invalidateScheduleQuerySync(queryClient, {
        includeCourseOfferings: true,
        includeEnrollments: true,
      });
      addToast({
        type: "success",
        title: "Offering Deleted",
        description: "The course offering has been removed from the system.",
      });
    },
    onError: (error: Error) => {
      addToast({
        type: "error",
        title: "Failed to Delete Offering",
        description: getSmartErrorDescription(error, "An error occurred while deleting the offering."),
      });
    },
  });
};
