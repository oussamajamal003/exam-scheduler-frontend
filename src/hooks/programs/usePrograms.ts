import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createProgram, fetchPrograms, fetchProgramsPage, updateProgram, deleteProgram } from '@/api/program.api';
import { CreateProgramDto, UpdateProgramDto } from '@/schemas/program';
import { useToast } from '@/components/ui/toast';
import { getSmartErrorDescription } from '@/lib/apiError';
import { invalidateScheduleQuerySync } from '@/lib/scheduleQuerySync';

export const usePrograms = (search = '') => {
  return useQuery({
    queryKey: ['programs', search],
    queryFn: () => fetchPrograms(search),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useProgramsPage = ({
  page = 1,
  pageSize = 50,
  search = '',
  departmentId,
  enabled = true,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  departmentId?: string;
  enabled?: boolean;
} = {}) => {
  return useQuery({
    queryKey: ['programs', 'page', { page, pageSize, search, departmentId: departmentId ?? null }],
    queryFn: () => fetchProgramsPage({ page, pageSize, search, departmentId }),
    enabled,
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

export const useCreateProgram = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (data: CreateProgramDto) => createProgram(data),
    onSuccess: async (data) => {
      await invalidateScheduleQuerySync(queryClient, {
        includePrograms: true,
        includeDepartments: true,
        includeCourses: true,
        includeCourseOfferings: true,
        includeEnrollments: true,
      });
      addToast({
        type: 'success',
        title: 'Program Added',
        description: `${data.name} has been added successfully.`,
      });
    },
    onError: (error: Error) => {
      addToast({
        type: 'error',
        title: 'Failed to Add Program',
        description: getSmartErrorDescription(error, 'An error occurred while adding the program.'),
      });
    },
  });
};

export const useUpdateProgram = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProgramDto }) => updateProgram({ id, data }),
    onSuccess: async (data) => {
      await invalidateScheduleQuerySync(queryClient, {
        includePrograms: true,
        includeDepartments: true,
        includeCourses: true,
        includeCourseOfferings: true,
        includeEnrollments: true,
      });
      addToast({
        type: 'success',
        title: 'Program Updated',
        description: `${data.name} has been updated successfully.`,
      });
    },
    onError: (error: Error) => {
      addToast({
        type: 'error',
        title: 'Failed to Update Program',
        description: getSmartErrorDescription(error, 'An error occurred while updating the program.'),
      });
    },
  });
};

export const useDeleteProgram = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteProgram(id),
    onSuccess: async () => {
      await invalidateScheduleQuerySync(queryClient, {
        includePrograms: true,
        includeDepartments: true,
        includeCourses: true,
        includeCourseOfferings: true,
        includeEnrollments: true,
      });
      addToast({
        type: 'success',
        title: 'Program Deleted',
        description: 'The program has been removed from the department.',
      });
    },
    onError: (error: Error) => {
      addToast({
        type: 'error',
        title: 'Failed to Delete Program',
        description: getSmartErrorDescription(error, 'An error occurred while deleting the program.'),
      });
    },
  });
};