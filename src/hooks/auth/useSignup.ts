import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { signupUser, type AuthResponse, type SignupCredentials } from '@/api/auth.api';

const AUTH_USER_STORAGE_KEY = 'auth_user';

export const useSignup = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, AxiosError<{ message?: string }>, SignupCredentials>({
    mutationFn: signupUser,
    onSuccess: (data) => {
      const expiresAt = Date.now() + 150 * 60 * 1000; // 150 minutes in ms
      localStorage.setItem('token', data.token);
      localStorage.setItem('token_expires_at', String(expiresAt));
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(data.user));
      queryClient.setQueryData(['currentUser'], data.user);
      navigate('/dashboard');
    },
    onError: (error) => {
      if (error.response?.status === 409 || error.response?.status === 400) {
        navigate('/login');
      }
    },
  });
};
