import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { deleteUser } from '@/api/auth.api';

const AUTH_USER_STORAGE_KEY = 'auth_user';

export const useDeleteAccount = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('token_expires_at');
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
      queryClient.clear();
      navigate('/login');
    },
  });
};
