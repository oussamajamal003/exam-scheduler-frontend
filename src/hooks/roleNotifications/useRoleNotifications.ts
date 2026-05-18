import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchRoleNotifications,
  markAllRoleNotificationsRead,
  markRoleNotificationRead,
  type RolePortal,
} from '@/api/roleNotifications.api';

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
}) =>
  useQuery({
    queryKey: roleNotificationKeys.list(portal, limit, unreadOnly),
    queryFn: () => fetchRoleNotifications({ portal, limit, unreadOnly }),
    enabled,
    refetchOnWindowFocus: true,
    refetchInterval: enabled ? 60_000 : false,
  });

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