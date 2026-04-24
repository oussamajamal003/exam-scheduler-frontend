import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '@/api/auth.api';

const AUTH_USER_STORAGE_KEY = 'auth_user';

export const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('token_expires_at');
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
      queryClient.clear();
      navigate('/login');
    },
    onError: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('token_expires_at');
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
      queryClient.clear();
      navigate('/login');
    },
  });
};
