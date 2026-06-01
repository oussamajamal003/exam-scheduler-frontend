import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  changeRolePassword,
  fetchRoleSettings,
  fetchRoleProfile,
  updateRoleSettings,
  updateRoleProfile,
  type ChangePasswordDto,
  type RolePortal,
  type ProfileDetails,
  type UpdateNotificationPreferencesDto,
} from '@/api/roleSettings.api';
import { authStorageKeys } from '@/api/axiosclient';
import { useToast } from '@/components/ui/toast';
import { getSmartErrorDescription } from '@/lib/apiError';

export const roleSettingsKeys = {
  all: ['role-settings'] as const,
  detail: (portal: RolePortal) => [...roleSettingsKeys.all, portal] as const,
};

export const useRoleSettings = (portal: RolePortal) =>
  useQuery({
    queryKey: roleSettingsKeys.detail(portal),
    queryFn: () => fetchRoleSettings(portal),
  });

export const useRoleProfile = (portal: RolePortal) =>
  useQuery({
    queryKey: [...roleSettingsKeys.detail(portal), 'profile'] as const,
    queryFn: () => fetchRoleProfile(portal),
  });

export const useUpdateRoleSettings = (portal: RolePortal) => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (data: UpdateNotificationPreferencesDto) => updateRoleSettings({ portal, data }),
    onSuccess: (settings) => {
      queryClient.setQueryData(roleSettingsKeys.detail(portal), settings);
      addToast({ type: 'success', title: 'Preferences saved', description: 'Your notification preferences were updated.' });
    },
    onError: (error: unknown) => {
      addToast({
        type: 'error',
        title: 'Could not save preferences',
        description: getSmartErrorDescription(error, 'Update failed. Please try again.'),
      });
    },
  });
};

export const useUpdateRoleProfile = (portal: RolePortal) => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (data: { name?: string; email?: string }) => updateRoleProfile({ portal, data }),
    onSuccess: (profile: ProfileDetails) => {
      queryClient.setQueryData([...roleSettingsKeys.detail(portal), 'profile'] as const, profile);
      queryClient.setQueryData(['currentUser'], profile);
      localStorage.setItem(authStorageKeys.authUser, JSON.stringify(profile));
      addToast({ type: 'success', title: 'Profile updated', description: 'Your account details were saved.' });
    },
    onError: (error: unknown) => {
      addToast({
        type: 'error',
        title: 'Could not save profile',
        description: getSmartErrorDescription(error, 'Update failed. Please try again.'),
      });
    },
  });
};

export const useChangeRolePassword = (portal: RolePortal) => {
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (data: ChangePasswordDto) => changeRolePassword({ portal, data }),
    onSuccess: () => {
      addToast({ type: 'success', title: 'Password changed', description: 'Use your new password the next time you sign in.' });
    },
    onError: (error: unknown) => {
      addToast({
        type: 'error',
        title: 'Could not change password',
        description: getSmartErrorDescription(error, 'Check your current password and password rules.'),
      });
    },
  });
};
