import { useQuery } from '@tanstack/react-query';
import {
  fetchPublishedSchedulesForRole,
  fetchProctorDashboard,
  fetchStudentDashboard,
} from '@/api/roleDashboard.api';

export const roleDashboardKeys = {
  all: ['role-dashboards'] as const,
  student: () => [...roleDashboardKeys.all, 'student'] as const,
  proctor: () => [...roleDashboardKeys.all, 'proctor'] as const,
  publishedSchedules: () => [...roleDashboardKeys.all, 'published-schedules'] as const,
};

export const useStudentDashboard = () =>
  useQuery({
    queryKey: roleDashboardKeys.student(),
    queryFn: fetchStudentDashboard,
  });

export const useProctorDashboard = () =>
  useQuery({
    queryKey: roleDashboardKeys.proctor(),
    queryFn: fetchProctorDashboard,
  });

export const usePublishedSchedulesForRole = () =>
  useQuery({
    queryKey: roleDashboardKeys.publishedSchedules(),
    queryFn: fetchPublishedSchedulesForRole,
  });
