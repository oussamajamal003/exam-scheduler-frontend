import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bulkImportEnrollments,
  createEnrollment,
  deleteEnrollment,
  fetchEnrollments,
} from "../../api/enrollment.api";
import { useToast } from "../../components/ui/toast";
import { getSmartErrorDescription } from "../../lib/apiError";
import type { CreateEnrollmentDto } from "../../schemas/enrollment";

export const useEnrollments = (search = "") =>
  useQuery({
    queryKey: ["enrollments", search],
    queryFn: () => fetchEnrollments(search),
  });

export const useCreateEnrollment = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (data: CreateEnrollmentDto) => createEnrollment(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["course-offerings"] });
      addToast({
        type: "success",
        title: "Enrollment Added",
        description: `${data.student?.user?.name ?? "Student"} enrolled in ${
          data.courseOffering?.course?.title ?? "course"
        }.`,
      });
    },
    onError: (error: Error) => {
      addToast({
        type: "error",
        title: "Failed to Add Enrollment",
        description: getSmartErrorDescription(error, "An error occurred while creating the enrollment."),
      });
    },
  });
};

export const useDeleteEnrollment = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteEnrollment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["course-offerings"] });
      addToast({
        type: "success",
        title: "Enrollment Removed",
        description: "The student has been unenrolled from the course offering.",
      });
    },
    onError: (error: Error) => {
      addToast({
        type: "error",
        title: "Failed to Delete Enrollment",
        description: getSmartErrorDescription(error, "An error occurred while removing the enrollment."),
      });
    },
  });
};

export const useBulkImportEnrollments = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (enrollments: CreateEnrollmentDto[]) => bulkImportEnrollments(enrollments),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["course-offerings"] });
      addToast({
        type: "success",
        title: "Bulk Import Complete",
        description: `${data.length} enrollment${data.length === 1 ? "" : "s"} successfully imported.`,
      });
    },
    onError: (error: Error) => {
      addToast({
        type: "error",
        title: "Bulk Import Failed",
        description: getSmartErrorDescription(error, "An error occurred during bulk import."),
      });
    },
  });
};
