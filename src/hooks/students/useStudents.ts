import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { createStudent, CreateStudentInput, deleteStudent, getStudents, updateStudent } from '../../api/student.api';
import { StudentFormData } from '../../schemas/student';

export const useStudents = (search?: string) => {
  return useQuery({
    queryKey: ['students', search],
    queryFn: () => getStudents({ search, page: 1, limit: 100 }),
    retry: (failureCount, error: unknown) => {
      if (error instanceof AxiosError && error.response?.status === 403) return false;
      return failureCount < 1;
    },
  });
};

export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStudentInput) => createStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StudentFormData }) => updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};