import { useQuery } from '@tanstack/react-query';
import {
  fetchPublishedSchedulesForRole,
  fetchProctorDashboard,
  fetchStudentDashboard,
  type RolePortal,
} from '@/api/roleDashboard.api';
import { normalizeRole } from '@/lib/authRoutes';

const AUTH_USER_STORAGE_KEY = 'auth_user';

const decodeTokenRole = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { role?: string };
    return decoded.role ?? null;
  } catch {
    return null;
  }
};

const getPortalFromCurrentUser = (): RolePortal | null => {
  const storedUser = localStorage.getItem(AUTH_USER_STORAGE_KEY);
  let storedRole: string | null = null;

  if (storedUser) {
    try {
      storedRole = (JSON.parse(storedUser) as { role?: string }).role ?? null;
    } catch {
      storedRole = null;
    }
  }

  const role = normalizeRole(storedRole ?? decodeTokenRole());
  if (role === 'STUDENT') return 'student';
  if (role === 'PROCTOR') return 'proctor';
  return null;
};

export const roleDashboardKeys = {
  all: ['role-portals'] as const,
  student: () => [...roleDashboardKeys.all, 'student'] as const,
  proctor: () => [...roleDashboardKeys.all, 'proctor'] as const,
  publishedSchedules: (portal?: RolePortal | null) => [...roleDashboardKeys.all, portal ?? 'unknown', 'published-schedules'] as const,
};

export const useStudentDashboard = () =>
  useQuery({
    queryKey: roleDashboardKeys.student(),
    queryFn: fetchStudentDashboard,
    staleTime: 5 * 60 * 1000,  // 5 minutes — most expensive query in the app
    gcTime: 10 * 60 * 1000,
  });

export const useProctorDashboard = () =>
  useQuery({
    queryKey: roleDashboardKeys.proctor(),
    queryFn: fetchProctorDashboard,
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 10 * 60 * 1000,
  });

export const usePublishedSchedulesForRole = () => {
  const portal = getPortalFromCurrentUser();

  return useQuery({
    queryKey: roleDashboardKeys.publishedSchedules(portal),
    queryFn: () => fetchPublishedSchedulesForRole(portal as RolePortal),
    enabled: Boolean(portal),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
