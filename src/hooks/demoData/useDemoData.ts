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
  ['supervisors'],
  ['timeSlots'],
  ['schedules'],
  ['conflicts'],
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
        title: 'Big Demo Dataset Generated',
        description: `Created ${result.summary.students} students, ${result.summary.courseOfferings} offerings, ${result.summary.registrations} enrollments, ${result.summary.rooms} rooms, and ${result.summary.timeSlots} time slots.`,
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
    onSuccess: () => {
      invalidateDemoDataQueries(queryClient);
      addToast({
        type: 'success',
        title: 'Demo Data Cleared',
        description: 'Generated demo academic, management, and scheduling test data has been removed.',
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
