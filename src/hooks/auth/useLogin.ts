import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { loginUser, type AuthResponse, type LoginCredentials } from '@/api/auth.api';

const AUTH_USER_STORAGE_KEY = 'auth_user';

export const useLogin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, Error, LoginCredentials>({
    mutationFn: loginUser,
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(data.user));
      queryClient.setQueryData(['currentUser'], data.user);
      navigate('/dashboard');
    },
  });
};
