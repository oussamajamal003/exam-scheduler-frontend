import { useQuery } from '@tanstack/react-query';
import { getCurrentUser, type User } from '@/api/auth.api';

const AUTH_USER_STORAGE_KEY = 'auth_user';

const getStoredUser = (): User | undefined => {
  const storedUser = localStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!storedUser) {
    return undefined;
  }

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return undefined;
  }
};

const resolveCurrentUser = async (): Promise<User> => {
  const storedUser = getStoredUser();
  if (storedUser) {
    return storedUser;
  }

  const user = await getCurrentUser();
  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
  return user;
};

export const useCurrentUser = () => {
  return useQuery<User, Error>({
    queryKey: ['currentUser'],
    queryFn: resolveCurrentUser,
    enabled: Boolean(localStorage.getItem('token')),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};
