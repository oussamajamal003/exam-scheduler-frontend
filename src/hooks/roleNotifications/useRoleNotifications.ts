import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchRoleNotifications,
  markAllRoleNotificationsRead,
  markRoleNotificationRead,
  type RolePortal,
} from '@/api/roleNotifications.api';
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

const getCurrentPortal = (): RolePortal | null => {
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

export const roleNotificationKeys = {
  all: ['role-notifications'] as const,
  portal: (portal: RolePortal) => [...roleNotificationKeys.all, portal] as const,
  list: (portal: RolePortal, limit = 20, unreadOnly = false) =>
    [...roleNotificationKeys.portal(portal), 'list', limit, unreadOnly] as const,
};

export const useRoleNotifications = ({
  portal,
  limit = 20,
  unreadOnly = false,
  enabled = true,
}: {
  portal: RolePortal;
  limit?: number;
  unreadOnly?: boolean;
  enabled?: boolean;
}) => {
  const isEnabled = enabled && getCurrentPortal() === portal;

  return useQuery({
    queryKey: roleNotificationKeys.list(portal, limit, unreadOnly),
    queryFn: () => fetchRoleNotifications({ portal, limit, unreadOnly }),
    enabled: isEnabled,
    refetchOnWindowFocus: true,
    refetchInterval: isEnabled ? 60_000 : false,
  });
};

export const useMarkRoleNotificationRead = (portal: RolePortal) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markRoleNotificationRead({ portal, id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roleNotificationKeys.portal(portal) }),
  });
};

export const useMarkAllRoleNotificationsRead = (portal: RolePortal) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllRoleNotificationsRead(portal),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roleNotificationKeys.portal(portal) }),
  });
};