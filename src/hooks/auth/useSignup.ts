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
      localStorage.setItem('token', data.token);
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
