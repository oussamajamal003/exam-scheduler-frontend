import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '@/api/auth.api';

export const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      localStorage.removeItem('token');
      queryClient.clear();
      navigate('/login');
    },
    onError: () => {
      localStorage.removeItem('token');
      queryClient.clear();
      navigate('/login');
    },
  });
};
