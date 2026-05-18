import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchStudentNotifications,
  markAllStudentNotificationsRead,
  markStudentNotificationRead,
} from '@/api/studentNotifications.api';

export const studentNotificationKeys = {
  all: ['student-notifications'] as const,
  list: (limit = 20, unreadOnly = false) => [...studentNotificationKeys.all, 'list', limit, unreadOnly] as const,
};

export const useStudentNotifications = ({
  limit = 20,
  unreadOnly = false,
  enabled = true,
}: {
  limit?: number;
  unreadOnly?: boolean;
  enabled?: boolean;
} = {}) =>
  useQuery({
    queryKey: studentNotificationKeys.list(limit, unreadOnly),
    queryFn: () => fetchStudentNotifications({ limit, unreadOnly }),
    enabled,
    refetchOnWindowFocus: true,
    refetchInterval: enabled ? 60_000 : false,
  });

export const useMarkStudentNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markStudentNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: studentNotificationKeys.all }),
  });
};

export const useMarkAllStudentNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllStudentNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: studentNotificationKeys.all }),
  });
};
