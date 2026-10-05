import { api } from '../../api/client';
import type { Pattern, Region } from '@dsa/shared';

export async function getRegions(): Promise<Region[]> {
  const { data } = await api.get<{ regions: Region[] }>('/regions');
  return data.regions;
}

export async function getPattern(slug: string): Promise<Pattern> {
  const { data } = await api.get<{ pattern: Pattern }>(`/patterns/${slug}`);
  return data.pattern;
}
