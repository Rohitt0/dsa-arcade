import { prisma } from '../../lib/prisma';
import type { Pattern, Region, RegionTheme } from '@dsa/shared';

export async function listRegions(): Promise<Region[]> {
  const regions = await prisma.region.findMany({
    orderBy: { orderIndex: 'asc' },
    include: { patterns: { orderBy: { orderIndex: 'asc' } } },
  });

  // Phase 1 unlock rule: only the first region is open (no progress system yet).
  return regions.map((r, i) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    orderIndex: r.orderIndex,
    theme: (r.theme as RegionTheme | null) ?? null,
    unlocked: i === 0,
    patterns: r.patterns.map(
      (p): Pattern => ({
        id: p.id,
        regionId: p.regionId,
        slug: p.slug,
        name: p.name,
        description: p.description,
        analogy: p.analogy,
        pseudocode: p.pseudocode,
        complexity: p.complexity,
        difficulty: p.difficulty,
        orderIndex: p.orderIndex,
      }),
    ),
  }));
}
