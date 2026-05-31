import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createDepartment, deleteDepartment, fetchDepartments, fetchDepartmentsPage, updateDepartment } from '@/api/department.api';
import { CreateDepartmentDto, UpdateDepartmentDto } from '@/schemas/department';
import { useToast } from '@/components/ui/toast';
import { getSmartErrorDescription } from '@/lib/apiError';
import { invalidateScheduleQuerySync } from '@/lib/scheduleQuerySync';

export const useDepartments = (search = '') => {
  return useQuery({
    queryKey: ['departments', search],
    queryFn: () => fetchDepartments(search),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useDepartmentsPage = ({
  page = 1,
  pageSize = 50,
  search = '',
  enabled = true,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  enabled?: boolean;
} = {}) => {
  return useQuery({
    queryKey: ['departments', 'page', { page, pageSize, search }],
    queryFn: () => fetchDepartmentsPage({ page, pageSize, search }),
    enabled,
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (data: CreateDepartmentDto) => createDepartment(data),
    onSuccess: async () => {
      await invalidateScheduleQuerySync(queryClient, {
        includeDepartments: true,
        includePrograms: true,
        includeCourseOfferings: true,
        includeEnrollments: true,
      });
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
    onSuccess: async () => {
      await invalidateScheduleQuerySync(queryClient, {
        includeDepartments: true,
        includePrograms: true,
        includeCourseOfferings: true,
        includeEnrollments: true,
      });
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
    onSuccess: async () => {
      await invalidateScheduleQuerySync(queryClient, {
        includeDepartments: true,
        includePrograms: true,
        includeCourseOfferings: true,
        includeEnrollments: true,
      });
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