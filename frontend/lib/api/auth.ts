import { apiClient } from './client';
import { AuthResponse, UserResponse } from '../types';

export async function register(data: {
  fullName: string;
  matricNumber: string;
  email: string;
  phoneNumber: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/auth/register', data);
  return res.data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/auth/login', { email, password });
  return res.data;
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('/auth/logout', { refreshToken });
}

export async function getMe(): Promise<UserResponse> {
  const res = await apiClient.get<UserResponse>('/users/me');
  return res.data;
}
