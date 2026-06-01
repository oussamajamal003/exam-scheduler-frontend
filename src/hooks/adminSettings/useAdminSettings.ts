import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  changeAdminPassword,
  deleteUserAccount,
  fetchAdminNotifications,
  fetchAdminProfile,
  fetchSystemSettings,
  fetchUserAccounts,
  updateAdminNotifications,
  updateAdminProfile,
  updateSystemSettings,
  updateUserAccount,
  type AccountListParams,
  type AdminProfile,
  type ChangePasswordDto,
  type NotificationPreferences,
  type SystemSettings,
  type UpdateAccountDto,
  type UpdateNotificationPreferencesDto,
  type UpdateProfileDto,
  type UpdateSystemSettingsDto,
} from '@/api/adminSettings.api';
import { useToast } from '@/components/ui/toast';
import { getSmartErrorDescription } from '@/lib/apiError';

export const adminSettingsKeys = {
  all: ['admin-settings'] as const,
  system: () => [...adminSettingsKeys.all, 'system'] as const,
  notifications: () => [...adminSettingsKeys.all, 'notifications'] as const,
  profile: () => [...adminSettingsKeys.all, 'profile'] as const,
  accounts: (params: AccountListParams) => [...adminSettingsKeys.all, 'accounts', params] as const,
};

// ─── System settings ─────────────────────────────────────────────────────────
export const useSystemSettings = () =>
  useQuery({ queryKey: adminSettingsKeys.system(), queryFn: fetchSystemSettings });

export const useUpdateSystemSettings = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (data: UpdateSystemSettingsDto) => updateSystemSettings(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: adminSettingsKeys.system() });
      const previous = queryClient.getQueryData<SystemSettings>(adminSettingsKeys.system());
      if (previous) queryClient.setQueryData(adminSettingsKeys.system(), { ...previous, ...data });
      return { previous };
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(adminSettingsKeys.system(), settings);
      addToast({ type: 'success', title: 'System settings saved', description: 'Global settings were updated.' });
    },
    onError: (error: unknown, _data, context) => {
      if (context?.previous) queryClient.setQueryData(adminSettingsKeys.system(), context.previous);
      addToast({ type: 'error', title: 'Could not save settings', description: getSmartErrorDescription(error, 'Update failed.') });
    },
  });
};

// ─── Notifications ───────────────────────────────────────────────────────────
export const useAdminNotifications = () =>
  useQuery({ queryKey: adminSettingsKeys.notifications(), queryFn: fetchAdminNotifications });

export const useUpdateAdminNotifications = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (data: UpdateNotificationPreferencesDto) => updateAdminNotifications(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: adminSettingsKeys.notifications() });
      const previous = queryClient.getQueryData<NotificationPreferences>(adminSettingsKeys.notifications());
      if (previous) queryClient.setQueryData(adminSettingsKeys.notifications(), { ...previous, ...data });
      return { previous };
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(adminSettingsKeys.notifications(), settings);
    },
    onError: (error: unknown, _data, context) => {
      if (context?.previous) queryClient.setQueryData(adminSettingsKeys.notifications(), context.previous);
      addToast({ type: 'error', title: 'Could not save preferences', description: getSmartErrorDescription(error, 'Update failed.') });
    },
  });
};

// ─── Profile / password ──────────────────────────────────────────────────────
export const useAdminProfile = () =>
  useQuery({ queryKey: adminSettingsKeys.profile(), queryFn: fetchAdminProfile });

export const useUpdateAdminProfile = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (data: UpdateProfileDto) => updateAdminProfile(data),
    onSuccess: (profile: AdminProfile) => {
      queryClient.setQueryData(adminSettingsKeys.profile(), profile);
      addToast({ type: 'success', title: 'Profile updated', description: 'Your account details were saved.' });
    },
    onError: (error: unknown) => {
      addToast({ type: 'error', title: 'Could not update profile', description: getSmartErrorDescription(error, 'Update failed.') });
    },
  });
};

export const useChangeAdminPassword = () => {
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (data: ChangePasswordDto) => changeAdminPassword(data),
    onSuccess: () => {
      addToast({ type: 'success', title: 'Password changed', description: 'Your password was updated successfully.' });
    },
    onError: (error: unknown) => {
      addToast({ type: 'error', title: 'Could not change password', description: getSmartErrorDescription(error, 'Update failed.') });
    },
  });
};

// ─── User accounts ───────────────────────────────────────────────────────────
export const useUserAccounts = (params: AccountListParams) =>
  useQuery({ queryKey: adminSettingsKeys.accounts(params), queryFn: () => fetchUserAccounts(params) });

export const useUpdateUserAccount = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (input: { userId: string; data: UpdateAccountDto }) => updateUserAccount(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...adminSettingsKeys.all, 'accounts'] });
      addToast({ type: 'success', title: 'Account updated', description: 'The account was saved.' });
    },
    onError: (error: unknown) => {
      addToast({ type: 'error', title: 'Could not update account', description: getSmartErrorDescription(error, 'Update failed.') });
    },
  });
};

export const useDeleteUserAccount = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (userId: string) => deleteUserAccount(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...adminSettingsKeys.all, 'accounts'] });
      addToast({ type: 'success', title: 'Account deleted', description: 'The account and its linked records were removed.' });
    },
    onError: (error: unknown) => {
      addToast({ type: 'error', title: 'Could not delete account', description: getSmartErrorDescription(error, 'Delete failed.') });
    },
  });
};
