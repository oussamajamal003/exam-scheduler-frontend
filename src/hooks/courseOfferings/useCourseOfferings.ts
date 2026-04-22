import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCourseOffering,
  deleteCourseOffering,
  fetchCourseOffering,
  fetchCourseOfferings,
  fetchCoursesForOfferings,
  fetchSelectedCourseForOffering,
  updateCourseOffering,
} from "../../api/courseOffering.api";
import {
  CreateCourseOfferingDto,
  UpdateCourseOfferingDto,
} from "../../schemas/courseOffering";
import { useToast } from "../../components/ui/toast";

export const useCourseOfferings = (search = "") => {
  return useQuery({
    queryKey: ["course-offerings", search],
    queryFn: () => fetchCourseOfferings(search),
  });
};

export const useCourseOffering = (id?: string) => {
  return useQuery({
    queryKey: ["course-offering", id],
    queryFn: () => fetchCourseOffering(id ?? ""),
    enabled: Boolean(id),
  });
};

export const useCoursesForOfferings = () => {
  return useQuery({
    queryKey: ["courses", "for-offerings"],
    queryFn: fetchCoursesForOfferings,
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["course-offerings"] });
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
        description: error?.message || "An error occurred while adding the offering.",
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["course-offerings"] });
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
        description: error?.message || "An error occurred while updating the offering.",
      });
    },
  });
};

export const useDeleteCourseOffering = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteCourseOffering(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-offerings"] });
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
        description: error?.message || "An error occurred while deleting the offering.",
      });
    },
  });
};
