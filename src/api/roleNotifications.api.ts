import { axiosClient } from './axiosclient';

export type RolePortal = 'student' | 'proctor';

export type RoleNotificationType =
  | 'SCHEDULE_PUBLISHED'
  | 'SCHEDULE_REPUBLISHED'
  | 'SCHEDULE_UNPUBLISHED'
  | 'SCHEDULE_UPDATED'
  | 'ROOM_TIME_CHANGE'
  | 'ANNOUNCEMENT'
  | 'NEW_DUTY_ASSIGNED'
  | string;

export type RoleNotification = {
  id: string;
  userId: string;
  scheduleId?: string | null;
  type: RoleNotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown> | null;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
  schedule?: {
    id: string;
    name?: string | null;
    examPeriod?: string | null;
    isFinal?: boolean | null;
  } | null;
};

export type RoleNotificationsResponse = {
  notifications: RoleNotification[];
  unreadCount: number;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
};

const unwrap = <T,>(payload: ApiEnvelope<T> | undefined, label: string): T => {
  if (!payload?.data) throw new Error(`${label} response missing data`);
  return payload.data;
};

export const fetchRoleNotifications = async ({
  portal,
  limit = 20,
  unreadOnly = false,
}: {
  portal: RolePortal;
  limit?: number;
  unreadOnly?: boolean;
}): Promise<RoleNotificationsResponse> => {
  const response = await axiosClient.get<ApiEnvelope<RoleNotificationsResponse>>(`/${portal}/notifications`, {
    params: { limit, unreadOnly: unreadOnly || undefined },
  });
  return unwrap(response.data, `${portal} notifications`);
};

export const markRoleNotificationRead = async ({
  portal,
  id,
}: {
  portal: RolePortal;
  id: string;
}): Promise<RoleNotification> => {
  const response = await axiosClient.patch<ApiEnvelope<RoleNotification>>(`/${portal}/notifications/${id}/read`);
  return unwrap(response.data, 'Read notification');
};

export const markAllRoleNotificationsRead = async (portal: RolePortal): Promise<{ updatedCount: number }> => {
  const response = await axiosClient.patch<ApiEnvelope<{ updatedCount: number }>>(`/${portal}/notifications/read-all`);
  return unwrap(response.data, 'Read notifications');
};