import { axiosClient } from './axiosclient';
import type {
  ChangePasswordDto,
  ChangePasswordResult,
  NotificationPreferences,
  UpdateNotificationPreferencesDto,
} from './roleSettings.api';

export type { NotificationPreferences, UpdateNotificationPreferencesDto, ChangePasswordDto, ChangePasswordResult };

export type SystemSettings = {
  id: string;
  systemName: string;
  maintenanceMode: boolean;
  allowScheduleGeneration: boolean;
  notificationsEnabled: boolean;
  academicYear: string | null;
  supportEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateSystemSettingsDto = Partial<
  Pick<SystemSettings, 'systemName' | 'maintenanceMode' | 'allowScheduleGeneration' | 'notificationsEnabled' | 'academicYear' | 'supportEmail'>
>;

export type AdminProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
};

export type UpdateProfileDto = {
  name?: string;
  email?: string;
};

export type UserAccount = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STUDENT' | 'PROCTOR';
  createdAt: string;
  updatedAt: string;
  studentId: string | null;
  universityId: string | null;
  programName: string | null;
  proctorId: string | null;
  department: string | null;
  maxExamsPerDay: number | null;
};

export type UpdateAccountDto = {
  name?: string;
  email?: string;
  department?: string | null;
  maxExamsPerDay?: number;
};

export type AccountListParams = {
  role?: 'STUDENT' | 'PROCTOR' | 'ADMIN';
  search?: string;
  page?: number;
  limit?: number;
};

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type AccountListResult = {
  data: UserAccount[];
  meta: PaginationMeta;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
};

const unwrap = <T,>(payload: ApiEnvelope<T> | undefined, label: string): T => {
  if (payload?.data === undefined) throw new Error(`${label} response missing data`);
  return payload.data;
};

// ─── System settings ─────────────────────────────────────────────────────────
export const fetchSystemSettings = async (): Promise<SystemSettings> => {
  const response = await axiosClient.get<ApiEnvelope<SystemSettings>>('/settings');
  return unwrap(response.data, 'System settings');
};

export const updateSystemSettings = async (data: UpdateSystemSettingsDto): Promise<SystemSettings> => {
  const response = await axiosClient.put<ApiEnvelope<SystemSettings>>('/settings', data);
  return unwrap(response.data, 'Update system settings');
};

// ─── Notifications (admin's own account) ─────────────────────────────────────
export const fetchAdminNotifications = async (): Promise<NotificationPreferences> => {
  const response = await axiosClient.get<ApiEnvelope<NotificationPreferences>>('/settings/notifications');
  return unwrap(response.data, 'Notifications');
};

export const updateAdminNotifications = async (data: UpdateNotificationPreferencesDto): Promise<NotificationPreferences> => {
  const response = await axiosClient.put<ApiEnvelope<NotificationPreferences>>('/settings/notifications', data);
  return unwrap(response.data, 'Update notifications');
};

// ─── Admin profile / password ────────────────────────────────────────────────
export const fetchAdminProfile = async (): Promise<AdminProfile> => {
  const response = await axiosClient.get<ApiEnvelope<AdminProfile>>('/settings/profile');
  return unwrap(response.data, 'Profile');
};

export const updateAdminProfile = async (data: UpdateProfileDto): Promise<AdminProfile> => {
  const response = await axiosClient.put<ApiEnvelope<AdminProfile>>('/settings/profile', data);
  return unwrap(response.data, 'Update profile');
};

export const changeAdminPassword = async (data: ChangePasswordDto): Promise<ChangePasswordResult> => {
  const response = await axiosClient.put<ApiEnvelope<ChangePasswordResult>>('/settings/change-password', data);
  return unwrap(response.data, 'Change password');
};

// ─── User account management ─────────────────────────────────────────────────
export const fetchUserAccounts = async (params: AccountListParams): Promise<AccountListResult> => {
  const response = await axiosClient.get<ApiEnvelope<AccountListResult>>('/settings/accounts', { params });
  return unwrap(response.data, 'Accounts');
};

export const updateUserAccount = async ({ userId, data }: { userId: string; data: UpdateAccountDto }): Promise<UserAccount> => {
  const response = await axiosClient.put<ApiEnvelope<UserAccount>>(`/settings/accounts/${userId}`, data);
  return unwrap(response.data, 'Update account');
};

export const deleteUserAccount = async (userId: string): Promise<{ id: string; deleted: boolean }> => {
  const response = await axiosClient.delete<ApiEnvelope<{ id: string; deleted: boolean }>>(`/settings/accounts/${userId}`);
  return unwrap(response.data, 'Delete account');
};
