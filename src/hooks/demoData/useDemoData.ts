import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clearDemoData, generateDemoData } from '@/api/demoDataApi';
import { useToast } from '@/components/ui/toast';
import { getSmartErrorDescription } from '@/lib/apiError';
import { invalidateScheduleQuerySync } from '@/lib/scheduleQuerySync';

const invalidateDemoDataQueries = async (queryClient: ReturnType<typeof useQueryClient>) => {
  await invalidateScheduleQuerySync(queryClient, {
    includeSchedules: true,
    includeAssignments: true,
    includeDashboards: true,
    includeNotifications: true,
    includeSearch: true,
    includeCourses: true,
    includeDepartments: true,
    includePrograms: true,
    includeSemesters: true,
    includeCourseOfferings: true,
    includeEnrollments: true,
    includeStudents: true,
    includeProctors: true,
    includeRooms: true,
    includeCenters: true,
    includeTimeSlots: true,
  });

  await queryClient.invalidateQueries({ queryKey: ['rooms', 'available'] });
};

export const useGenerateDemoData = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: generateDemoData,
    onSuccess: async (result) => {
      await invalidateDemoDataQueries(queryClient);
      addToast({
        type: 'success',
        title: `${result.datasetLabel ?? 'Demo Dataset'} Generated`,
        description: `Created ${result.summary.students} students, ${result.summary.courseOfferings} offerings, ${result.summary.registrations} enrollments, ${result.summary.rooms} rooms, and ${result.summary.timeSlots} time slots without deleting existing schedules.`,
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
    onSuccess: async (result) => {
      await invalidateDemoDataQueries(queryClient);
      addToast({
        type: 'success',
        title: `${result.datasetLabel ?? 'Demo Dataset'} Cleared`,
        description: `All demo data for ${result.datasetLabel ?? 'the selected dataset'} has been removed, including related schedules and assignments.`,
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
