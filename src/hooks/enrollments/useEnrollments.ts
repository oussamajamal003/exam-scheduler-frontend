import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bulkImportEnrollments,
  createEnrollment,
  deleteEnrollment,
  fetchEnrollmentFilterOptions,
  fetchEnrollments,
  fetchEnrollmentsPage,
} from "../../api/enrollment.api";
import { useToast } from "../../components/ui/toast";
import { getSmartErrorDescription } from "../../lib/apiError";
import type { CreateEnrollmentDto } from "../../schemas/enrollment";
import { invalidateScheduleQuerySync } from "../../lib/scheduleQuerySync";

export const useEnrollments = (
  options: { search?: string; semesterId?: string; courseOfferingId?: string; studentId?: string; departmentId?: string; enabled?: boolean } | string = ""
) => {
  const { search = "", semesterId, courseOfferingId, studentId, departmentId, enabled = true } =
    typeof options === "string" ? { search: options } : options;
  return useQuery({
    queryKey: ["enrollments", semesterId ?? null, search, courseOfferingId ?? null, studentId ?? null, departmentId ?? null],
    queryFn: () => fetchEnrollments({ search, semesterId, courseOfferingId, studentId, departmentId }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useEnrollmentsPage = ({
  page = 1,
  pageSize = 50,
  search = "",
  semesterId,
  courseOfferingId,
  studentId,
  departmentId,
  enabled = true,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  semesterId?: string;
  courseOfferingId?: string;
  studentId?: string;
  departmentId?: string;
  enabled?: boolean;
} = {}) => {
  return useQuery({
    queryKey: ["enrollments", "page", { page, pageSize, search, semesterId: semesterId ?? null, courseOfferingId: courseOfferingId ?? null, studentId: studentId ?? null, departmentId: departmentId ?? null }],
    queryFn: () => fetchEnrollmentsPage({ page, pageSize, search, semesterId, courseOfferingId, studentId, departmentId }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useEnrollmentFilterOptions = ({
  semesterId,
  enabled = true,
}: {
  semesterId?: string;
  enabled?: boolean;
} = {}) => {
  return useQuery({
    queryKey: ["enrollments", "filters", semesterId ?? null],
    queryFn: () => fetchEnrollmentFilterOptions({ semesterId }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useCreateEnrollment = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (data: CreateEnrollmentDto) => createEnrollment(data),
    onSuccess: async (data) => {
      await invalidateScheduleQuerySync(queryClient, {
        includeCourseOfferings: true,
        includeEnrollments: true,
        includeStudents: true,
      });
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
    onSuccess: async () => {
      await invalidateScheduleQuerySync(queryClient, {
        includeCourseOfferings: true,
        includeEnrollments: true,
        includeStudents: true,
      });
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
    onSuccess: async (data) => {
      await invalidateScheduleQuerySync(queryClient, {
        includeCourseOfferings: true,
        includeEnrollments: true,
        includeStudents: true,
      });
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
