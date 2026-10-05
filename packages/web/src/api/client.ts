import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/auth.store';

/** Single axios instance. Same-origin `/api` (Vite proxies to the API in dev) so the refresh cookie stays first-party. */
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Attach the in-memory access token to every request.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// De-dupe concurrent refreshes: all 401s awaiting the same in-flight refresh.
let refreshing: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  try {
    // Raw axios (no interceptors) to avoid recursion on the refresh call itself.
    const { data } = await axios.post<{ accessToken: string }>(
      '/api/auth/refresh',
      {},
      { withCredentials: true },
    );
    useAuthStore.getState().setAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    useAuthStore.getState().clear();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const url = original?.url ?? '';
    const isAuthCall = url.includes('/auth/');
    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      refreshing = refreshing ?? doRefresh();
      const token = await refreshing;
      refreshing = null;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);
