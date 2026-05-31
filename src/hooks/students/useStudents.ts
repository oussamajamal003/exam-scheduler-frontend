import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStudents, getStudentsPage, createStudent, updateStudent, deleteStudent, getStudentExams } from "../../api/student.api";
import { CreateStudentDto, UpdateStudentDto } from "../../schemas/student";
import { useToast } from "../../components/ui/toast";
import { getSmartErrorDescription } from "../../lib/apiError";
import { invalidateScheduleQuerySync } from "../../lib/scheduleQuerySync";

export const useStudents = ({ enabled = true }: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: ["students"],
    queryFn: getStudents,
    enabled,
  });
};

export const useStudentsPage = ({
  page = 1,
  pageSize = 50,
  search = "",
  programId,
  departmentId,
  enabled = true,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  programId?: string;
  departmentId?: string;
  enabled?: boolean;
} = {}) => {
  return useQuery({
    queryKey: ["students", "page", { page, pageSize, search, programId: programId ?? null, departmentId: departmentId ?? null }],
    queryFn: () => getStudentsPage({ page, pageSize, search, programId, departmentId }),
    enabled,
    placeholderData: keepPreviousData,
  });
};

export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (data: CreateStudentDto) => createStudent(data),
    onSuccess: async (data) => {
      await invalidateScheduleQuerySync(queryClient, {
        includeEnrollments: true,
        includeStudents: true,
      });
      addToast({
        type: "success",
        title: "Student Added",
        description: `${data.firstName} ${data.lastName} has been successfully added to the system.`,
      });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Add Student",
        description: getSmartErrorDescription(error, "An error occurred while adding the student."),
      });
    },
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStudentDto }) => updateStudent(id, data),
    onSuccess: async (data) => {
      await invalidateScheduleQuerySync(queryClient, {
        includeEnrollments: true,
        includeStudents: true,
      });
      addToast({
        type: "success",
        title: "Student Updated",
        description: `${data.firstName} ${data.lastName}'s information has been successfully updated.`,
      });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Update Student",
        description: getSmartErrorDescription(error, "An error occurred while updating the student."),
      });
    },
  });
};

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteStudent(id),
    onSuccess: async (_data, id) => {
      await invalidateScheduleQuerySync(queryClient, {
        includeEnrollments: true,
        includeStudents: true,
      });
      queryClient.invalidateQueries({ queryKey: ["students", id] });
      addToast({
        type: "success",
        title: "Student Deleted",
        description: "The student has been successfully removed from the system.",
      });
    },
    onError: (error: unknown) => {
      addToast({
        type: "error",
        title: "Failed to Delete Student",
        description: getSmartErrorDescription(error, "An error occurred while deleting the student."),
      });
    },
  });
};

export const useStudentExams = (studentId?: string) => {
  return useQuery({
    queryKey: ["student-exams", studentId],
    queryFn: () => getStudentExams(studentId ?? ""),
    enabled: Boolean(studentId),
  });
};
