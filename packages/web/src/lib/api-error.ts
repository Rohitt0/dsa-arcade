import { AxiosError } from 'axios';
import type { ApiError } from '@dsa/shared';

/** Pulls a human-readable message out of our API error envelope (or any error). */
export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as ApiError | undefined;
    if (data?.error?.message) return data.error.message;
    if (err.code === 'ERR_NETWORK') return 'Cannot reach the server. Is the API running?';
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
