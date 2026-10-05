import { useQuery } from '@tanstack/react-query';
import { getPattern, getRegions } from './world.api';

export function useRegions() {
  return useQuery({ queryKey: ['regions'], queryFn: getRegions });
}

export function usePattern(slug: string | undefined) {
  return useQuery({
    queryKey: ['pattern', slug],
    queryFn: () => getPattern(slug as string),
    enabled: Boolean(slug),
  });
}
