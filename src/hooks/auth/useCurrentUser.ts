import { useQuery } from '@tanstack/react-query';
import { getCurrentUser, type User } from '@/api/auth.api';

export const useCurrentUser = () => {
  return useQuery<User, Error>({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};
