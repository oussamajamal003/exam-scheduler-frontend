import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { loginUser, type AuthResponse, type LoginCredentials } from '@/api/auth.api';
import { getHomePathForRole } from '@/lib/authRoutes';
import { authStorageKeys } from '@/api/axiosclient';

const AUTH_USER_STORAGE_KEY = 'auth_user';

export const useLogin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, Error, LoginCredentials>({
    mutationFn: loginUser,
    onSuccess: (data) => {
      const expiresAt = Date.now() + 150 * 60 * 1000; // 150 minutes in ms
      // Clear any stale force-logout flags from a previous session before storing the new session.
      localStorage.removeItem(authStorageKeys.forceLogoutOnReload);
      localStorage.removeItem(authStorageKeys.forceLogoutOnReloadBoot);
      localStorage.setItem('token', data.token);
      localStorage.setItem('token_expires_at', String(expiresAt));
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(data.user));
      queryClient.setQueryData(['currentUser'], data.user);
      navigate(getHomePathForRole(data.user.role));
    },
  });
};
