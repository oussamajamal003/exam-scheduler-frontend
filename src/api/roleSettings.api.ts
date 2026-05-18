import { axiosClient } from './axiosclient';

export type RolePortal = 'student' | 'proctor';

export type NotificationPreferences = {
  id: string;
  userId: string;
  schedulePublishedNotifications: boolean;
  examAssignmentUpdates: boolean;
  roomTimeChanges: boolean;
  announcementsMessages: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpdateNotificationPreferencesDto = Partial<Pick<NotificationPreferences,
  | 'schedulePublishedNotifications'
  | 'examAssignmentUpdates'
  | 'roomTimeChanges'
  | 'announcementsMessages'
>>;

export type ChangePasswordDto = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  logoutOtherSessions?: boolean;
};

export type ChangePasswordResult = {
  changed: boolean;
  logoutOtherSessionsApplied: boolean;
  logoutOtherSessionsRequested: boolean;
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

export const fetchRoleSettings = async (portal: RolePortal): Promise<NotificationPreferences> => {
  const response = await axiosClient.get<ApiEnvelope<NotificationPreferences>>(`/${portal}/settings`);
  return unwrap(response.data, 'Settings');
};

export const updateRoleSettings = async ({
  portal,
  data,
}: {
  portal: RolePortal;
  data: UpdateNotificationPreferencesDto;
}): Promise<NotificationPreferences> => {
  const response = await axiosClient.patch<ApiEnvelope<NotificationPreferences>>(`/${portal}/settings`, data);
  return unwrap(response.data, 'Update settings');
};

export const changeRolePassword = async ({
  portal,
  data,
}: {
  portal: RolePortal;
  data: ChangePasswordDto;
}): Promise<ChangePasswordResult> => {
  const response = await axiosClient.patch<ApiEnvelope<ChangePasswordResult>>(`/${portal}/settings/change-password`, data);
  return unwrap(response.data, 'Change password');
};
