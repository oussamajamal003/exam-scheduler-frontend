import { axiosClient } from './axiosclient';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

const unwrapResponseData = <T>(responseData: ApiEnvelope<T> | T): T => {
  if (
    responseData &&
    typeof responseData === 'object' &&
    'data' in responseData &&
    responseData.data !== undefined
  ) {
    return responseData.data;
  }

  return responseData as T;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await axiosClient.get<ApiEnvelope<User>>('/auth/me');
  return unwrapResponseData(response.data);
};

export const getAllUsers = async (): Promise<User[]> => {
  const response = await axiosClient.get<ApiEnvelope<User[]>>('/auth/');
  return unwrapResponseData(response.data);
};

export const loginUser = async (data: LoginCredentials): Promise<AuthResponse> => {
  const response = await axiosClient.post<ApiEnvelope<AuthResponse>>('/auth/login', data);
  return unwrapResponseData(response.data);
};

export const logoutUser = async (): Promise<void> => {
  await axiosClient.post('/auth/logout');
};

export const deleteUser = async (): Promise<void> => {
  await axiosClient.delete('/auth/delete');
};
