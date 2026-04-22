import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createProgram, fetchPrograms, updateProgram, deleteProgram } from '@/api/program.api';
import { CreateProgramDto, UpdateProgramDto } from '@/schemas/program';
import { useToast } from '@/components/ui/toast';

export const usePrograms = (search = '') => {
  return useQuery({
    queryKey: ['programs', search],
    queryFn: () => fetchPrograms(search),
  });
};

export const useCreateProgram = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (data: CreateProgramDto) => createProgram(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
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
        description: error.message || 'An error occurred while adding the program.',
      });
    },
  });
};

export const useUpdateProgram = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProgramDto }) => updateProgram({ id, data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
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
        description: error.message || 'An error occurred while updating the program.',
      });
    },
  });
};

export const useDeleteProgram = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteProgram(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
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
        description: error.message || 'An error occurred while deleting the program.',
      });
    },
  });
};