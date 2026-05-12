import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clearDemoData, generateDemoData } from '@/api/demoDataApi';
import { useToast } from '@/components/ui/toast';
import { getSmartErrorDescription } from '@/lib/apiError';

const affectedQueryKeys = [
  ['departments'],
  ['programs'],
  ['semesters'],
  ['courses'],
  ['courses', 'for-offerings'],
  ['course-offerings'],
  ['enrollments'],
  ['students'],
  ['centers'],
  ['rooms'],
  ['rooms', 'available'],
  ['proctors'],
  ['timeSlots'],
  ['schedules'],
];

const invalidateDemoDataQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  for (const queryKey of affectedQueryKeys) {
    queryClient.invalidateQueries({ queryKey });
  }
};

export const useGenerateDemoData = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: generateDemoData,
    onSuccess: (result) => {
      invalidateDemoDataQueries(queryClient);
      addToast({
        type: 'success',
        title: `${result.datasetLabel ?? 'Demo Dataset'} Generated`,
        description: `Created ${result.summary.students} students, ${result.summary.courseOfferings} offerings, ${result.summary.registrations} enrollments, ${result.summary.rooms} rooms, and ${result.summary.timeSlots} time slots without clearing other demo datasets.`,
      });
    },
    onError: (error: unknown) => {
      addToast({
        type: 'error',
        title: 'Failed to Generate Demo Data',
        description: getSmartErrorDescription(error, 'Unable to generate demo data.'),
      });
    },
  });
};

export const useClearDemoData = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: clearDemoData,
    onSuccess: (result) => {
      invalidateDemoDataQueries(queryClient);
      addToast({
        type: 'success',
        title: `${result.datasetLabel ?? 'Demo Dataset'} Cleared`,
        description: `Only demo-generated data for ${result.datasetLabel ?? 'the selected dataset'} has been removed.`,
      });
    },
    onError: (error: unknown) => {
      addToast({
        type: 'error',
        title: 'Failed to Clear Demo Data',
        description: getSmartErrorDescription(error, 'Unable to clear demo data.'),
      });
    },
  });
};
