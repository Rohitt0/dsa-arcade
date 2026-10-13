import 'dotenv/config';
import { PrismaClient, Difficulty } from '@prisma/client';
import { binarySearchStage, greenhouseStageExamples } from '@dsa/shared';

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
    description:
      'A gentle green valley where every adventurer learns to walk before they run. Arrays, hashing and the sliding window.',
    theme: { biome: 'valley', accent: '#5fc26a' },
  },
  {
    slug: 'twin-peaks',
    name: 'The Twin Peaks',
    description:
      'Two mountains that must be climbed from both sides. Two pointers and binary search.',
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
    description:
      'A city of gears and priority queues that never sleeps. Heaps and priority queues.',
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
      'The greenhouse scans k neighboring crystals at once. As its window slides forward, subtract the crystal that leaves and add the one that enters instead of measuring every crystal again.',
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

const slidingWindowChallenge = {
  slug: 'longest-substring-without-repeating-characters',
  title: 'Longest Substring Without Repeating Characters',
  description:
    'Given a string, return the length of its longest contiguous part that contains no repeated character. A substring must use neighboring characters in their original order.',
  inputFormat: 'One line containing the input string. The line may be empty.',
  outputFormat: 'Print one integer: the length of the longest valid substring.',
  constraints: '0 ≤ string length ≤ 100,000. The input uses visible ASCII characters.',
  starterCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    string s;
    getline(cin, s);

    // TODO: track a substring with no repeated characters.
    cout << 0 << "\\n";
    return 0;
}`,
  testCases: [
    { testKey: 'example-1', input: 'abcabcbb', expected: '3', hidden: false },
    { testKey: 'example-2', input: 'bbbbb', expected: '1', hidden: false },
    { testKey: 'hidden-1', input: 'pwwkew', expected: '3', hidden: true },
    { testKey: 'hidden-2', input: 'dvdf', expected: '3', hidden: true },
    { testKey: 'edge-empty', input: '', expected: '0', hidden: true },
  ],
};

const greenhouseChallenge = {
  slug: 'maximum-sum-k-consecutive-crystals',
  title: 'Maximum Sum of K Consecutive Crystals',
  description:
    'Given an integer array crystals and an integer k, return the maximum sum among all contiguous windows of exactly k crystals. Implement Solution::maxCrystalEnergy. Run checks the visible examples; Submit also checks hidden cases.',
  inputFormat: 'First line: n and k. Second line: n integer crystal values.',
  outputFormat: 'Print the maximum sum of exactly k consecutive values.',
  constraints: '1 ≤ k ≤ n ≤ 100,000. Crystal values fit in a signed 32-bit integer.',
  starterCode: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    long long maxCrystalEnergy(vector<int>& crystals, int k) {
        // TODO: maintain one fixed-size window as it slides.
        return 0;
    }
};`,
  testCases: [
    { testKey: 'example-greenhouse-row', input: `${greenhouseStageExamples.maximum.crystals.length} ${greenhouseStageExamples.maximum.windowSize}\n${greenhouseStageExamples.maximum.crystals.join(' ')}`, expected: '17', hidden: false },
    { testKey: 'example-classic', input: '6 3\n2 1 5 1 3 2', expected: '9', hidden: false },
    { testKey: 'example-increasing', input: '5 2\n1 2 3 4 5', expected: '9', hidden: false },
    { testKey: 'mission-crystals', input: '8 3\n4 2 7 1 6 3 8 5', expected: '17', hidden: true },
    { testKey: 'hidden-full-window', input: '4 4\n3 6 2 9', expected: '20', hidden: true },
    { testKey: 'hidden-negative', input: '5 2\n-8 -3 -6 -2 -5', expected: '-7', hidden: true },
  ],
};

const reliableWindowsChallenge = {
  slug: 'reliable-crystal-windows',
  title: 'Keep the Greenhouse Alive',
  description:
    'Given an integer array crystals, an integer k, and a long long target, return the number of contiguous windows of exactly k crystals whose sum is at least target. Implement Solution::countPowerWindows. Run checks the visible example; Submit also checks hidden cases.',
  inputFormat: 'First line: n, k, and target. Second line: n nonnegative crystal values.',
  outputFormat: 'Print the number of exactly-k windows whose sum is at least target.',
  constraints: '1 <= n <= 100,000; 1 <= k <= n; 0 <= crystals[i] <= 1,000,000,000; 0 <= target <= 100,000,000,000,000.',
  starterCode: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countPowerWindows(vector<int>& crystals,
                          int k, long long target) {
        // Count qualifying windows.
        return 0;
    }
};`,
  testCases: [
    { testKey: 'example-reliable-windows', input: `${greenhouseStageExamples.reliable.crystals.length} ${greenhouseStageExamples.reliable.windowSize} ${greenhouseStageExamples.reliable.target}\n${greenhouseStageExamples.reliable.crystals.join(' ')}`, expected: '2', hidden: false },
    { testKey: 'hidden-singletons', input: '4 1 5\n0 5 8 2', expected: '2', hidden: true },
    { testKey: 'hidden-full-window', input: '4 4 15\n3 4 5 6', expected: '1', hidden: true },
    { testKey: 'hidden-no-qualifying-window', input: '4 2 20\n1 2 3 4', expected: '0', hidden: true },
    { testKey: 'hidden-every-window', input: '5 2 7\n3 4 5 6 7', expected: '4', hidden: true },
    { testKey: 'hidden-exact-target', input: '4 2 9\n4 5 2 7', expected: '2', hidden: true },
    { testKey: 'hidden-zero-target', input: '4 2 0\n0 0 0 0', expected: '3', hidden: true },
    { testKey: 'hidden-overlapping', input: '4 2 10\n5 5 5 1', expected: '2', hidden: true },
    { testKey: 'hidden-long-long-sums', input: '3 2 2000000000\n1000000000 1000000000 1000000000', expected: '2', hidden: true },
    { testKey: 'hidden-large-input', input: `100000 50000 50000\n${Array(100000).fill('1').join(' ')}`, expected: '50001', hidden: true },
  ],
};

const minimumCrystalBurstChallenge = {
  slug: 'minimum-crystal-burst',
  title: 'A Short Burst',
  description:
    'Given an array of positive integers crystals and a positive long long target, return the minimum length of a contiguous subarray whose sum is at least target. Return 0 if no such subarray exists. Implement Solution::minCrystalBurst. Run checks the visible examples; Submit also checks hidden cases.',
  inputFormat: 'First line: n and target. Second line: n positive integer crystal values.',
  outputFormat: 'Print the minimum length of a contiguous range reaching target, or 0 if none exists.',
  constraints: '1 <= crystals.size() <= 100,000; 1 <= crystals[i] <= 1,000,000,000; 1 <= target <= 100,000,000,000,000.',
  starterCode: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minCrystalBurst(vector<int>& crystals, long long target) {
        // Find the shortest consecutive group reaching target.
        return 0;
    }
};`,
  testCases: [
    { testKey: 'example-greenhouse-burst', input: `${greenhouseStageExamples.burst.crystals.length} ${greenhouseStageExamples.burst.target}\n${greenhouseStageExamples.burst.crystals.join(' ')}`, expected: '2', hidden: false },
    { testKey: 'hidden-single-meets-target', input: '1 7\n7', expected: '1', hidden: true },
    { testKey: 'hidden-single-below-target', input: '1 8\n7', expected: '0', hidden: true },
    { testKey: 'hidden-full-array-shortest', input: '3 6\n2 2 2', expected: '3', hidden: true },
    { testKey: 'hidden-best-at-beginning', input: '4 5\n5 1 1 1', expected: '1', hidden: true },
    { testKey: 'hidden-best-at-end', input: '4 5\n1 1 1 5', expected: '1', hidden: true },
    { testKey: 'hidden-equal-shortest-uses-length', input: '4 7\n2 5 2 5', expected: '2', hidden: true },
    { testKey: 'hidden-exact-target', input: '4 14\n4 2 7 1', expected: '4', hidden: true },
    { testKey: 'hidden-repeated-shrink', input: '6 7\n2 3 1 2 4 3', expected: '2', hidden: true },
    { testKey: 'hidden-long-long-sum', input: '2 2000000000\n1000000000 1000000000', expected: '2', hidden: true },
    { testKey: 'hidden-large-input', input: `100000 100000\n${Array(100000).fill('1').join(' ')}`, expected: '100000', hidden: true },
  ],
};

const longestCrystalBudgetChallenge = {
  slug: 'longest-crystal-budget', title: 'Keep the Vines Warm',
  description: 'Given nonnegative integer crystal values and a long long budget, return the maximum length of a contiguous subarray whose sum is at most budget. Return 0 if no nonempty subarray fits. Implement Solution::longestWarmStretch.',
  inputFormat: 'First line: n and budget. Second line: n nonnegative integer crystal values.',
  outputFormat: 'Print the maximum valid range length.',
  constraints: '1 <= crystals.size() <= 100,000; 0 <= crystals[i] <= 1,000,000,000; 0 <= budget <= 100,000,000,000,000.',
  starterCode: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestWarmStretch(vector<int>& crystals, long long budget) {
        // Find the longest contiguous range within budget.
        return 0;
    }
};`,
  testCases: [
    { testKey: 'example-vine-budget', input: `${greenhouseStageExamples.budget.crystals.length} ${greenhouseStageExamples.budget.budget}\n${greenhouseStageExamples.budget.crystals.join(' ')}`, expected: '4', hidden: false },
    { testKey: 'hidden-zero-budget-all-zero', input: '4 0\n0 0 0 0', expected: '4', hidden: true },
    { testKey: 'hidden-mixed-zeros', input: '6 1\n0 0 2 0 1 0', expected: '3', hidden: true },
    { testKey: 'hidden-all-fit', input: '4 20\n2 3 4 5', expected: '4', hidden: true },
    { testKey: 'hidden-no-valid-window', input: '3 1\n2 2 2', expected: '0', hidden: true },
    { testKey: 'hidden-exact-budget', input: '3 6\n1 2 3', expected: '3', hidden: true },
    { testKey: 'hidden-best-at-beginning', input: '4 3\n1 1 1 10', expected: '3', hidden: true },
    { testKey: 'hidden-best-at-end', input: '4 3\n10 1 1 1', expected: '3', hidden: true },
    { testKey: 'hidden-best-middle', input: '6 4\n9 2 1 1 2 9', expected: '3', hidden: true },
    { testKey: 'hidden-repeated-shrink', input: '7 6\n1 2 1 3 2 1 4', expected: '3', hidden: true },
    { testKey: 'hidden-over-32-bit-window-sums', input: '3 2000000000\n1000000000 1000000000 1000000000', expected: '2', hidden: true },
    { testKey: 'hidden-large-input', input: `100000 1000\n${Array(100000).fill('1').join(' ')}`, expected: '1000', hidden: true },
  ],
};

const binarySearchSignalChallenge = {
  slug: binarySearchStage.challengeSlug,
  title: binarySearchStage.title,
  description: 'At the observatory, the telescope has lost a distant signal. Given a strictly increasing array of distinct frequency readings and a target, return the target\'s zero-based index, or -1 if it is absent. Implement Solution::findSignal in O(log n) time.',
  inputFormat: 'First line: n and target. Second line: n sorted frequency readings.',
  outputFormat: 'Print the target index, or -1 when the signal is not present.',
  constraints: '1 <= readings.size() <= 100,000; -1,000,000,000 <= readings[i], target <= 1,000,000,000; all readings are distinct and strictly increasing.',
  starterCode: binarySearchStage.starterCode,
  testCases: [
    ...binarySearchStage.visibleExamples.map((example, index) => ({
      testKey: `visible-${index + 1}`,
      input: `${example.readings.length} ${example.target}\n${example.readings.join(' ')}`,
      expected: String(example.answer),
      hidden: false,
    })),
    { testKey: 'hidden-first-position', input: '5 -8\n-8 -2 0 3 9', expected: '0', hidden: true },
    { testKey: 'hidden-middle-position', input: '5 0\n-8 -2 0 3 9', expected: '2', hidden: true },
    { testKey: 'hidden-last-position', input: '5 9\n-8 -2 0 3 9', expected: '4', hidden: true },
    { testKey: 'hidden-below-minimum', input: '4 -20\n-8 -2 0 3', expected: '-1', hidden: true },
    { testKey: 'hidden-above-maximum', input: '4 20\n-8 -2 0 3', expected: '-1', hidden: true },
    { testKey: 'hidden-between-readings', input: '5 1\n-8 -2 0 3 9', expected: '-1', hidden: true },
    { testKey: 'hidden-single-absent', input: '1 -4\n7', expected: '-1', hidden: true },
    { testKey: 'hidden-two-found', input: '2 8\n2 8', expected: '1', hidden: true },
    { testKey: 'hidden-two-absent', input: '2 3\n2 8', expected: '-1', hidden: true },
    { testKey: 'hidden-negative-target', input: '5 -4\n-9 -4 0 3 10', expected: '1', hidden: true },
    { testKey: 'hidden-zero-target', input: '3 0\n-2 0 5', expected: '1', hidden: true },
    { testKey: 'hidden-large-sorted-array', input: `30000 12345\n${Array.from({ length: 30000 }, (_, index) => index).join(' ')}`, expected: '12345', hidden: true },
  ],
};

async function main() {
  console.log('Seeding regions...');
  for (const [i, r] of regions.entries()) {
    await prisma.region.upsert({
      where: { slug: r.slug },
      update: { name: r.name, description: r.description, orderIndex: i, theme: r.theme },
      create: {
        slug: r.slug,
        name: r.name,
        description: r.description,
        orderIndex: i,
        theme: r.theme,
      },
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

  const slidingWindowPattern = await prisma.pattern.findUniqueOrThrow({
    where: { slug: 'sliding-window' },
    select: { id: true },
  });
  const binarySearchPattern = await prisma.pattern.findUniqueOrThrow({ where: { slug: 'binary-search' }, select: { id: true } });
  const challenge = await prisma.challenge.upsert({
    where: { slug: slidingWindowChallenge.slug },
    update: {
      patternId: slidingWindowPattern.id,
      title: slidingWindowChallenge.title,
      description: slidingWindowChallenge.description,
      inputFormat: slidingWindowChallenge.inputFormat,
      outputFormat: slidingWindowChallenge.outputFormat,
      constraints: slidingWindowChallenge.constraints,
      starterCode: slidingWindowChallenge.starterCode,
      orderIndex: 0,
    },
    create: {
      patternId: slidingWindowPattern.id,
      slug: slidingWindowChallenge.slug,
      title: slidingWindowChallenge.title,
      description: slidingWindowChallenge.description,
      inputFormat: slidingWindowChallenge.inputFormat,
      outputFormat: slidingWindowChallenge.outputFormat,
      constraints: slidingWindowChallenge.constraints,
      starterCode: slidingWindowChallenge.starterCode,
      orderIndex: 0,
    },
  });
  for (const [orderIndex, test] of slidingWindowChallenge.testCases.entries()) {
    await prisma.testCase.upsert({
      where: { challengeId_testKey: { challengeId: challenge.id, testKey: test.testKey } },
      update: { input: test.input, expected: test.expected, hidden: test.hidden, orderIndex },
      create: { challengeId: challenge.id, ...test, orderIndex },
    });
  }

  const greenhouse = await prisma.challenge.upsert({
    where: { slug: greenhouseChallenge.slug },
    update: {
      patternId: slidingWindowPattern.id,
      title: greenhouseChallenge.title,
      description: greenhouseChallenge.description,
      inputFormat: greenhouseChallenge.inputFormat,
      outputFormat: greenhouseChallenge.outputFormat,
      constraints: greenhouseChallenge.constraints,
      starterCode: greenhouseChallenge.starterCode,
      orderIndex: 1,
    },
    create: {
      patternId: slidingWindowPattern.id,
      slug: greenhouseChallenge.slug,
      title: greenhouseChallenge.title,
      description: greenhouseChallenge.description,
      inputFormat: greenhouseChallenge.inputFormat,
      outputFormat: greenhouseChallenge.outputFormat,
      constraints: greenhouseChallenge.constraints,
      starterCode: greenhouseChallenge.starterCode,
      orderIndex: 1,
    },
  });
  for (const [orderIndex, test] of greenhouseChallenge.testCases.entries()) {
    await prisma.testCase.upsert({
      where: { challengeId_testKey: { challengeId: greenhouse.id, testKey: test.testKey } },
      update: { input: test.input, expected: test.expected, hidden: test.hidden, orderIndex },
      create: { challengeId: greenhouse.id, ...test, orderIndex },
    });
  }

  const reliableWindows = await prisma.challenge.upsert({
    where: { slug: reliableWindowsChallenge.slug },
    update: {
      patternId: slidingWindowPattern.id,
      title: reliableWindowsChallenge.title,
      description: reliableWindowsChallenge.description,
      inputFormat: reliableWindowsChallenge.inputFormat,
      outputFormat: reliableWindowsChallenge.outputFormat,
      constraints: reliableWindowsChallenge.constraints,
      starterCode: reliableWindowsChallenge.starterCode,
      orderIndex: 2,
    },
    create: {
      patternId: slidingWindowPattern.id,
      slug: reliableWindowsChallenge.slug,
      title: reliableWindowsChallenge.title,
      description: reliableWindowsChallenge.description,
      inputFormat: reliableWindowsChallenge.inputFormat,
      outputFormat: reliableWindowsChallenge.outputFormat,
      constraints: reliableWindowsChallenge.constraints,
      starterCode: reliableWindowsChallenge.starterCode,
      orderIndex: 2,
    },
  });
  for (const [orderIndex, test] of reliableWindowsChallenge.testCases.entries()) {
    await prisma.testCase.upsert({
      where: { challengeId_testKey: { challengeId: reliableWindows.id, testKey: test.testKey } },
      update: { input: test.input, expected: test.expected, hidden: test.hidden, orderIndex },
      create: { challengeId: reliableWindows.id, ...test, orderIndex },
    });
  }

  const minimumCrystalBurst = await prisma.challenge.upsert({
    where: { slug: minimumCrystalBurstChallenge.slug },
    update: {
      patternId: slidingWindowPattern.id,
      title: minimumCrystalBurstChallenge.title,
      description: minimumCrystalBurstChallenge.description,
      inputFormat: minimumCrystalBurstChallenge.inputFormat,
      outputFormat: minimumCrystalBurstChallenge.outputFormat,
      constraints: minimumCrystalBurstChallenge.constraints,
      starterCode: minimumCrystalBurstChallenge.starterCode,
      orderIndex: 3,
    },
    create: {
      patternId: slidingWindowPattern.id,
      slug: minimumCrystalBurstChallenge.slug,
      title: minimumCrystalBurstChallenge.title,
      description: minimumCrystalBurstChallenge.description,
      inputFormat: minimumCrystalBurstChallenge.inputFormat,
      outputFormat: minimumCrystalBurstChallenge.outputFormat,
      constraints: minimumCrystalBurstChallenge.constraints,
      starterCode: minimumCrystalBurstChallenge.starterCode,
      orderIndex: 3,
    },
  });
  for (const [orderIndex, test] of minimumCrystalBurstChallenge.testCases.entries()) {
    await prisma.testCase.upsert({
      where: { challengeId_testKey: { challengeId: minimumCrystalBurst.id, testKey: test.testKey } },
      update: { input: test.input, expected: test.expected, hidden: test.hidden, orderIndex },
      create: { challengeId: minimumCrystalBurst.id, ...test, orderIndex },
    });
  }

  const longestCrystalBudget = await prisma.challenge.upsert({
    where: { slug: longestCrystalBudgetChallenge.slug },
    update: { patternId: slidingWindowPattern.id, title: longestCrystalBudgetChallenge.title, description: longestCrystalBudgetChallenge.description, inputFormat: longestCrystalBudgetChallenge.inputFormat, outputFormat: longestCrystalBudgetChallenge.outputFormat, constraints: longestCrystalBudgetChallenge.constraints, starterCode: longestCrystalBudgetChallenge.starterCode, orderIndex: 4 },
    create: { patternId: slidingWindowPattern.id, slug: longestCrystalBudgetChallenge.slug, title: longestCrystalBudgetChallenge.title, description: longestCrystalBudgetChallenge.description, inputFormat: longestCrystalBudgetChallenge.inputFormat, outputFormat: longestCrystalBudgetChallenge.outputFormat, constraints: longestCrystalBudgetChallenge.constraints, starterCode: longestCrystalBudgetChallenge.starterCode, orderIndex: 4 },
  });
  for (const [orderIndex, test] of longestCrystalBudgetChallenge.testCases.entries()) {
    await prisma.testCase.upsert({ where: { challengeId_testKey: { challengeId: longestCrystalBudget.id, testKey: test.testKey } }, update: { input: test.input, expected: test.expected, hidden: test.hidden, orderIndex }, create: { challengeId: longestCrystalBudget.id, ...test, orderIndex } });
  }

  const findSignal = await prisma.challenge.upsert({
    where: { slug: binarySearchSignalChallenge.slug },
    update: { patternId: binarySearchPattern.id, title: binarySearchSignalChallenge.title, description: binarySearchSignalChallenge.description, inputFormat: binarySearchSignalChallenge.inputFormat, outputFormat: binarySearchSignalChallenge.outputFormat, constraints: binarySearchSignalChallenge.constraints, starterCode: binarySearchSignalChallenge.starterCode, orderIndex: 1 },
    create: { patternId: binarySearchPattern.id, slug: binarySearchSignalChallenge.slug, title: binarySearchSignalChallenge.title, description: binarySearchSignalChallenge.description, inputFormat: binarySearchSignalChallenge.inputFormat, outputFormat: binarySearchSignalChallenge.outputFormat, constraints: binarySearchSignalChallenge.constraints, starterCode: binarySearchSignalChallenge.starterCode, orderIndex: 1 },
  });
  for (const [orderIndex, test] of binarySearchSignalChallenge.testCases.entries()) {
    await prisma.testCase.upsert({ where: { challengeId_testKey: { challengeId: findSignal.id, testKey: test.testKey } }, update: { input: test.input, expected: test.expected, hidden: test.hidden, orderIndex }, create: { challengeId: findSignal.id, ...test, orderIndex } });
  }

  console.log(
    `Seed complete: ${regions.length} regions, ${patterns.length} patterns, 6 challenges.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
