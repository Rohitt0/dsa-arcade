import { create } from 'zustand';
import type { User } from '@dsa/shared';

export type AuthStatus = 'loading' | 'authed' | 'guest';

interface AuthState {
  user: User | null;
  /** Access token is held in memory only (never localStorage) — refresh lives in an httpOnly cookie. */
  accessToken: string | null;
  status: AuthStatus;
  setAuth: (user: User, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: 'loading',
  setAuth: (user, accessToken) => set({ user, accessToken, status: 'authed' }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setUser: (user) => set({ user }),
  clear: () => set({ user: null, accessToken: null, status: 'guest' }),
}));
