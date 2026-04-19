import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStudents, createStudent, updateStudent, deleteStudent, getStudentExams } from "../../api/student.api";
import { CreateStudentDto, UpdateStudentDto } from "../../schemas/student";

export const useStudents = () => {
  return useQuery({
    queryKey: ["students"],
    queryFn: getStudents,
  });
};

export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStudentDto) => createStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStudentDto }) => updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
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
