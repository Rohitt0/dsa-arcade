import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { LoginInput, RegisterInput } from '@dsa/shared';
import { useAuthStore } from '../../stores/auth.store';
import { loginApi, logoutApi, meApi, refreshApi, registerApi } from './auth.api';

/**
 * One-time session restore on app load: refresh cookie -> access token -> /me.
 * Any failure means "not signed in" and resolves to guest.
 */
export async function bootstrapAuth(): Promise<void> {
  const store = useAuthStore.getState();
  try {
    const accessToken = await refreshApi();
    store.setAccessToken(accessToken);
    const user = await meApi();
    store.setAuth(user, accessToken);
  } catch {
    store.clear();
  }
}

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const queryClient = useQueryClient();

  const login = useCallback(async (input: LoginInput) => {
    const res = await loginApi(input);
    useAuthStore.getState().setAuth(res.user, res.accessToken);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const res = await registerApi(input);
    useAuthStore.getState().setAuth(res.user, res.accessToken);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      useAuthStore.getState().clear();
      queryClient.clear();
    }
  }, [queryClient]);

  return { user, status, isAuthed: status === 'authed', login, register, logout };
}
