import axios from 'axios';
import { api } from '../../api/client';
import type { AuthResponse, LoginInput, RegisterInput, User } from '@dsa/shared';

export async function registerApi(input: RegisterInput): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', input);
  return data;
}

export async function loginApi(input: LoginInput): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', input);
  return data;
}

export async function meApi(): Promise<User> {
  const { data } = await api.get<{ user: User }>('/me');
  return data.user;
}

export async function logoutApi(): Promise<void> {
  await api.post('/auth/logout');
}

/** Raw axios so session bootstrap can cleanly treat "no cookie" as guest. */
export async function refreshApi(): Promise<string> {
  const { data } = await axios.post<{ accessToken: string }>(
    '/api/auth/refresh',
    {},
    { withCredentials: true },
  );
  return data.accessToken;
}
