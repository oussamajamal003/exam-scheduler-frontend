import { axiosClient } from './axiosclient';

export type StudentNotificationType =
  | 'SCHEDULE_PUBLISHED'
  | 'SCHEDULE_UPDATED'
  | 'ROOM_TIME_CHANGE'
  | 'ANNOUNCEMENT'
  | string;

export type StudentNotification = {
  id: string;
  studentId: string;
  scheduleId?: string | null;
  type: StudentNotificationType;
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

export type StudentNotificationsResponse = {
  notifications: StudentNotification[];
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

export const fetchStudentNotifications = async ({
  limit = 20,
  unreadOnly = false,
}: {
  limit?: number;
  unreadOnly?: boolean;
} = {}): Promise<StudentNotificationsResponse> => {
  const response = await axiosClient.get<ApiEnvelope<StudentNotificationsResponse>>('/student/notifications', {
    params: { limit, unreadOnly: unreadOnly || undefined },
  });
  return unwrap(response.data, 'Student notifications');
};

export const markStudentNotificationRead = async (id: string): Promise<StudentNotification> => {
  const response = await axiosClient.patch<ApiEnvelope<StudentNotification>>(`/student-notifications/${id}/read`);
  return unwrap(response.data, 'Read notification');
};

export const markAllStudentNotificationsRead = async (): Promise<{ updatedCount: number }> => {
  const response = await axiosClient.patch<ApiEnvelope<{ updatedCount: number }>>('/student-notifications/read-all');
  return unwrap(response.data, 'Read notifications');
};
