import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStudents, createStudent, updateStudent, deleteStudent, getStudentExams } from "../../api/student.api";
import { CreateStudentDto, UpdateStudentDto } from "../../schemas/student";
import { useToast } from "../../components/ui/toast";

export const useStudents = () => {
  return useQuery({
    queryKey: ["students"],
    queryFn: getStudents,
  });
};

export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (data: CreateStudentDto) => createStudent(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      addToast({
        type: "success",
        title: "Student Added",
        description: `${data.firstName} ${data.lastName} has been successfully added to the system.`,
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Add Student",
        description: error?.message || "An error occurred while adding the student.",
      });
    },
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStudentDto }) => updateStudent(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      addToast({
        type: "success",
        title: "Student Updated",
        description: `${data.firstName} ${data.lastName}'s information has been successfully updated.`,
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Update Student",
        description: error?.message || "An error occurred while updating the student.",
      });
    },
  });
};

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteStudent(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["students", id] });
      addToast({
        type: "success",
        title: "Student Deleted",
        description: "The student has been successfully removed from the system.",
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Delete Student",
        description: error?.message || "An error occurred while deleting the student.",
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
