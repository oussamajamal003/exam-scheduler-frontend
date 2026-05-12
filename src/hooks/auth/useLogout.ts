import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '@/api/auth.api';
import { clearStoredAuthSession } from '@/api/axiosclient';

export const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      clearStoredAuthSession();
      queryClient.clear();
      navigate('/login');
    },
    onError: () => {
      clearStoredAuthSession();
      queryClient.clear();
      navigate('/login');
    },
  });
};
