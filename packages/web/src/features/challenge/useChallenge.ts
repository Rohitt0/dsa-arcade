import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchChallenge, submitCode } from './challenge.api';

export function useChallenge(slug: string | undefined) {
  return useQuery({
    queryKey: ['challenge', slug],
    queryFn: () => fetchChallenge(slug!),
    enabled: Boolean(slug),
  });
}

export function useSubmitCode(slug: string) {
  return useMutation({ mutationFn: (code: string) => submitCode(slug, code) });
}
