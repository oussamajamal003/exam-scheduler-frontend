import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createDepartment, deleteDepartment, fetchDepartments, updateDepartment } from '@/api/department.api';
import { CreateDepartmentDto, UpdateDepartmentDto } from '@/schemas/department';
import { useToast } from '@/components/ui/toast';
import { getSmartErrorDescription } from '@/lib/apiError';

export const useDepartments = (search = '') => {
  return useQuery({
    queryKey: ['departments', search],
    queryFn: () => fetchDepartments(search),
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (data: CreateDepartmentDto) => createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (error: unknown) => {
      addToast({
        type: 'error',
        title: 'Failed to Add Department',
        description: getSmartErrorDescription(error, 'An error occurred while adding the department.'),
      });
    },
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDepartmentDto }) => updateDepartment({ id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (error: unknown) => {
      addToast({
        type: 'error',
        title: 'Failed to Update Department',
        description: getSmartErrorDescription(error, 'An error occurred while updating the department.'),
      });
    },
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      addToast({
        type: 'success',
        title: 'Department Deleted',
        description: 'The department has been removed from the system.',
      });
    },
    onError: (error: Error) => {
      addToast({
        type: 'error',
        title: 'Failed to Delete Department',
        description: getSmartErrorDescription(error, 'An error occurred while deleting the department.'),
      });
    },
  });
};