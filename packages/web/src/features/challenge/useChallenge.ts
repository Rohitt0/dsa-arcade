import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchChallenge, runExamples, submitCode } from './challenge.api';
import { useAuthStore } from '../../stores/auth.store';

export function useChallenge(slug: string | undefined) {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: ['challenge', slug, userId],
    queryFn: () => fetchChallenge(slug!),
    enabled: Boolean(slug),
  });
}

export function useSubmitCode(slug: string) {
  return useMutation({ mutationFn: (code: string) => submitCode(slug, code) });
}

export function useRunExamples(slug: string) {
  return useMutation({ mutationFn: (code: string) => runExamples(slug, code) });
}
