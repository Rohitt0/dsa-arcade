import 'dotenv/config';
import { PrismaClient, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * The eight themed worlds from the DSA Arcade design.
 * Phase 1 seeds the world structure + the five MVP patterns so the
 * World Map has real content to render.
 */
const regions = [
  {
    slug: 'beginning-valley',
    name: 'The Beginning Valley',
    description: 'A gentle green valley where every adventurer learns to walk before they run. Arrays, hashing and the sliding window.',
    theme: { biome: 'valley', accent: '#5fc26a' },
  },
  {
    slug: 'twin-peaks',
    name: 'The Twin Peaks',
    description: 'Two mountains that must be climbed from both sides. Two pointers and binary search.',
    theme: { biome: 'mountains', accent: '#6cb8e4' },
  },
  {
    slug: 'river-kingdom',
    name: 'The River Kingdom',
    description: 'A kingdom of flowing chains and stacked towers. Linked lists and stacks.',
    theme: { biome: 'river', accent: '#4ea0c9' },
  },
  {
    slug: 'ancient-forest',
    name: 'The Ancient Forest',
    description: 'A deep forest of branching paths and hidden roots. Trees, tries and recursion.',
    theme: { biome: 'forest', accent: '#3f9d5a' },
  },
  {
    slug: 'graph-kingdom',
    name: 'The Graph Kingdom',
    description: 'A sprawling realm of roads and crossings. BFS, DFS and graphs.',
    theme: { biome: 'kingdom', accent: '#b06cf0' },
  },
  {
    slug: 'machine-city',
    name: 'The Machine City',
    description: 'A city of gears and priority queues that never sleeps. Heaps and priority queues.',
    theme: { biome: 'city', accent: '#f2a65a' },
  },
  {
    slug: 'kingdom-of-choices',
    name: 'The Kingdom of Choices',
    description: 'Every road forks, and every choice has a cost. Dynamic programming and greedy.',
    theme: { biome: 'castle', accent: '#ffcf4e' },
  },
  {
    slug: 'final-realms',
    name: 'The Final Realms',
    description: 'Where every pattern you have learned is put to the ultimate test.',
    theme: { biome: 'void', accent: '#e4572e' },
  },
];

const patterns = [
  {
    regionSlug: 'beginning-valley',
    slug: 'sliding-window',
    name: 'Sliding Window',
    description:
      'Instead of recomputing a group of consecutive elements from scratch every time, slide a "window" across the data: remove the element that leaves and add the element that enters.',
    analogy:
      'An old mountain train can only look at three carriages at a time. As it rolls forward, one carriage leaves the window at the back and one new carriage enters at the front — you never re-count the whole train.',
    pseudocode:
      'windowSum = sum(first k elements)\nbest = windowSum\nfor i from k to n-1:\n    windowSum += arr[i]        // element entering\n    windowSum -= arr[i - k]    // element leaving\n    best = max(best, windowSum)',
    complexity: 'Time O(n), Space O(1)',
    difficulty: Difficulty.EASY,
  },
  {
    regionSlug: 'twin-peaks',
    slug: 'binary-search',
    name: 'Binary Search',
    description:
      'When data is sorted, you never have to search everywhere. Each comparison with the middle lets you throw away half of the remaining search space.',
    analogy:
      'A sorted treasure vault. Check the middle chest: if your treasure is worth more, every smaller chest to the left can be ignored — half the vault eliminated in one step.',
    pseudocode:
      'low = 0, high = n-1\nwhile low <= high:\n    mid = low + (high - low) / 2\n    if arr[mid] == target: return mid\n    if arr[mid] < target: low = mid + 1\n    else: high = mid - 1\nreturn -1',
    complexity: 'Time O(log n), Space O(1)',
    difficulty: Difficulty.EASY,
  },
  {
    regionSlug: 'twin-peaks',
    slug: 'two-pointers',
    name: 'Two Pointers',
    description:
      'Two markers move toward each other (or in the same direction) based on a condition, letting you scan a structure in a single pass instead of nested loops.',
    analogy:
      'A rescue squad enters a collapsed tunnel from both ends. Depending on what each team finds, one side advances — they meet exactly where the problem is solved.',
    pseudocode:
      'left = 0, right = n-1\nwhile left < right:\n    if condition(arr[left], arr[right]): return ...\n    else if tooSmall: left++\n    else: right--',
    complexity: 'Time O(n), Space O(1)',
    difficulty: Difficulty.EASY,
  },
  {
    regionSlug: 'river-kingdom',
    slug: 'stack',
    name: 'Stack',
    description:
      'A Last-In-First-Out pile. The last thing you put on top is the first thing you take off — perfect for matching, undo, and nested structures.',
    analogy:
      'A tower of plates. You can only add or remove from the top. The last plate stacked is the first one washed.',
    pseudocode:
      'for ch in input:\n    if ch is opening: push(ch)\n    else:\n        if stack empty or top does not match: return false\n        pop()\nreturn stack is empty',
    complexity: 'Time O(n), Space O(n)',
    difficulty: Difficulty.EASY,
  },
  {
    regionSlug: 'graph-kingdom',
    slug: 'bfs',
    name: 'Breadth-First Search',
    description:
      'Explore a graph or grid level by level, nearest-first, using a queue. The first time you reach a node is always via a shortest path (in unweighted graphs).',
    analogy:
      'Fire spreading through a building. Everything one step away catches first, then everything two steps away — distance grows outward in perfect rings.',
    pseudocode:
      'queue = [start]; dist[start] = 0\nwhile queue not empty:\n    node = queue.pop_front()\n    for next in neighbors(node):\n        if next not visited:\n            dist[next] = dist[node] + 1\n            queue.push_back(next)',
    complexity: 'Time O(V + E), Space O(V)',
    difficulty: Difficulty.MEDIUM,
  },
];

async function main() {
  console.log('Seeding regions...');
  for (const [i, r] of regions.entries()) {
    await prisma.region.upsert({
      where: { slug: r.slug },
      update: { name: r.name, description: r.description, orderIndex: i, theme: r.theme },
      create: { slug: r.slug, name: r.name, description: r.description, orderIndex: i, theme: r.theme },
    });
  }

  const regionIdBySlug = new Map(
    (await prisma.region.findMany({ select: { id: true, slug: true } })).map((r) => [r.slug, r.id]),
  );

  console.log('Seeding patterns...');
  for (const [i, p] of patterns.entries()) {
    const regionId = regionIdBySlug.get(p.regionSlug);
    if (!regionId) throw new Error(`Unknown region slug: ${p.regionSlug}`);
    await prisma.pattern.upsert({
      where: { slug: p.slug },
      update: {
        regionId,
        name: p.name,
        description: p.description,
        analogy: p.analogy,
        pseudocode: p.pseudocode,
        complexity: p.complexity,
        difficulty: p.difficulty,
        orderIndex: i,
      },
      create: {
        regionId,
        slug: p.slug,
        name: p.name,
        description: p.description,
        analogy: p.analogy,
        pseudocode: p.pseudocode,
        complexity: p.complexity,
        difficulty: p.difficulty,
        orderIndex: i,
      },
    });
  }

  console.log(`Seed complete: ${regions.length} regions, ${patterns.length} patterns.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
