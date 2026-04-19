import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCourses, fetchCourse, createCourse, updateCourse, deleteCourse } from "../../api/course.api";
import { CreateCourseDto, UpdateCourseDto } from "../../schemas/course";
import { useToast } from "../../components/ui/toast";

export const useCourses = () => {
  return useQuery({
    queryKey: ["courses"],
    queryFn: fetchCourses,
  });
};

export const useCourse = (id: string | null) => {
  return useQuery({
    queryKey: ["courses", id],
    queryFn: () => fetchCourse(id as string),
    enabled: !!id,
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (data: CreateCourseDto) => createCourse(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      addToast({
        type: "success",
        title: "Course Added",
        description: `${data.name} has been successfully added to the curriculum.`,
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Add Course",
        description: error?.message || "An error occurred while adding the course.",
      });
    },
  });
};

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCourseDto }) => updateCourse({ id, data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses", data.id] });
      addToast({
        type: "success",
        title: "Course Updated",
        description: `${data.name} has been successfully updated.`,
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Update Course",
        description: error?.message || "An error occurred while updating the course.",
      });
    },
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteCourse(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses", id] });
      addToast({
        type: "success",
        title: "Course Deleted",
        description: "The course has been successfully removed from the curriculum.",
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Delete Course",
        description: error?.message || "An error occurred while deleting the course.",
      });
    },
  });
};
