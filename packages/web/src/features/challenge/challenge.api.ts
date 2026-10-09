import type { Challenge, SubmissionResult } from '@dsa/shared';
import { api } from '../../api/client';

export async function fetchChallenge(slug: string) {
  const { data } = await api.get<{ challenge: Challenge }>(`/challenges/${slug}`);
  return data.challenge;
}

export async function submitCode(slug: string, code: string) {
  const { data } = await api.post<{ result: SubmissionResult }>(`/challenges/${slug}/submissions`, {
    code,
  });
  return data.result;
}

export async function runExamples(slug: string, code: string) {
  const { data } = await api.post<{ result: SubmissionResult }>(`/challenges/${slug}/run`, { code });
  return data.result;
}
