import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCourses, fetchCourse, fetchCourseDetail, createCourse, updateCourse, deleteCourse } from "../../api/course.api";
import { CreateCourseDto, UpdateCourseDto } from "../../schemas/course";
import { useToast } from "../../components/ui/toast";
import { getSmartErrorDescription } from "../../lib/apiError";
import { invalidateScheduleQuerySync } from "../../lib/scheduleQuerySync";

export const useCourses = ({ departmentId }: { departmentId?: string } = {}) => {
  return useQuery({
    queryKey: ["courses", departmentId ?? null],
    queryFn: () => fetchCourses({ departmentId }),
    placeholderData: keepPreviousData,
  });
};

export const useCourse = (id: string | null) => {
  return useQuery({
    queryKey: ["courses", id],
    queryFn: () => fetchCourse(id as string),
    enabled: !!id,
  });
};

export const useCourseDetail = (id: string | null | undefined) => {
  return useQuery({
    queryKey: ["courses", id, "detail"],
    queryFn: () => fetchCourseDetail(id as string),
    enabled: !!id,
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (data: CreateCourseDto) => createCourse(data),
    onSuccess: async (data) => {
      await invalidateScheduleQuerySync(queryClient, {
        includeCourses: true,
        includeCourseOfferings: true,
        includeEnrollments: true,
      });
      addToast({
        type: "success",
        title: "Course Added",
        description: `${data.name} has been successfully added to the curriculum.`,
      });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Add Course",
        description: getSmartErrorDescription(error, "An error occurred while adding the course."),
      });
    },
  });
};

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCourseDto }) => updateCourse({ id, data }),
    onSuccess: async (data) => {
      await invalidateScheduleQuerySync(queryClient, {
        includeCourses: true,
        includeCourseOfferings: true,
        includeEnrollments: true,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["courses", data.id] }),
        queryClient.invalidateQueries({ queryKey: ["course", "for-offering", data.id] }),
      ]);
      addToast({
        type: "success",
        title: "Course Updated",
        description: `${data.name} has been successfully updated.`,
      });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Update Course",
        description: getSmartErrorDescription(error, "An error occurred while updating the course."),
      });
    },
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteCourse(id),
    onSuccess: async (_data, id) => {
      await invalidateScheduleQuerySync(queryClient, {
        includeCourses: true,
        includeCourseOfferings: true,
        includeEnrollments: true,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["courses", id] }),
        queryClient.invalidateQueries({ queryKey: ["course", "for-offering", id] }),
      ]);
      addToast({
        type: "success",
        title: "Course Deleted",
        description: "The course has been successfully removed from the curriculum.",
      });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Delete Course",
        description: getSmartErrorDescription(error, "An error occurred while deleting the course."),
      });
    },
  });
};
