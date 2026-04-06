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

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export const getCurrentUser = async (): Promise<User> => {
  const response = await axiosClient.get<User>('/auth/');
  return response.data;
};

export const signupUser = async (data: SignupCredentials): Promise<AuthResponse> => {
  const response = await axiosClient.post<AuthResponse>('/auth/signup', data);
  return response.data;
};

export const loginUser = async (data: LoginCredentials): Promise<AuthResponse> => {
  const response = await axiosClient.post<AuthResponse>('/auth/login', data);
  return response.data;
};

export const logoutUser = async (): Promise<void> => {
  await axiosClient.post('/auth/logout');
};

export const deleteUser = async (): Promise<void> => {
  await axiosClient.delete('/auth/delete');
};
