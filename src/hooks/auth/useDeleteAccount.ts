import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { deleteUser } from '@/api/auth.api';
import { clearStoredAuthSession } from '@/api/axiosclient';

export const useDeleteAccount = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      clearStoredAuthSession();
      queryClient.clear();
      navigate('/login');
    },
  });
};
