import { prisma } from '../../lib/prisma';
import { notFound } from '../../lib/errors';
import type { Pattern } from '@dsa/shared';

export async function getPatternBySlug(slug: string): Promise<Pattern> {
  const p = await prisma.pattern.findUnique({ where: { slug } });
  if (!p) throw notFound('Pattern not found');
  return {
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
  };
}
