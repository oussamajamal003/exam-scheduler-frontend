import { useQuery } from '@tanstack/react-query';
import {
  fetchProctorDashboard,
  fetchStudentDashboard,
} from '@/api/roleDashboard.api';

export const roleDashboardKeys = {
  all: ['role-dashboards'] as const,
  student: () => [...roleDashboardKeys.all, 'student'] as const,
  proctor: () => [...roleDashboardKeys.all, 'proctor'] as const,
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
