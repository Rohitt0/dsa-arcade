import { Prisma, SubmissionStatus } from '@prisma/client';
import type {
  Challenge,
  SubmissionResult,
  SubmissionStatus as SharedSubmissionStatus,
} from '@dsa/shared';
import { getStageRewardByChallenge } from '@dsa/shared';
import { prisma } from '../../lib/prisma';
import { AppError, notFound } from '../../lib/errors';
import { env } from '../../config/env';
import { z } from 'zod';

const runnerReplySchema = z.object({
  status: z.string().max(40),
  message: z.string().max(8_000).optional(),
  results: z
    .array(z.object({ passed: z.boolean(), actual: z.string().max(16_384) }))
    .max(20)
    .optional(),
});

export async function getChallengeBySlug(slug: string, userId?: string): Promise<Challenge> {
  const challenge = await prisma.challenge.findUnique({
    where: { slug },
    include: { testCases: { orderBy: { orderIndex: 'asc' } } },
  });
  if (!challenge) throw notFound('Challenge not found');

  // Resume only this authenticated player's submissions; never include hidden test data.
  const [latest, accepted] = userId ? await Promise.all([
    prisma.submission.findFirst({ where: { userId, challengeId: challenge.id }, orderBy: { createdAt: 'desc' }, select: { code: true } }),
    prisma.submission.findFirst({ where: { userId, challengeId: challenge.id, status: 'ACCEPTED' }, select: { id: true } }),
  ]) : [null, null];

  return {
    id: challenge.id,
    patternId: challenge.patternId,
    slug: challenge.slug,
    title: challenge.title,
    description: challenge.description,
    inputFormat: challenge.inputFormat,
    outputFormat: challenge.outputFormat,
    constraints: challenge.constraints,
    difficulty: challenge.difficulty,
    starterCode: challenge.starterCode,
    ...(latest ? { savedSolution: { code: latest.code, completed: Boolean(accepted) } } : {}),
    sampleTests: challenge.testCases
      .filter((testCase) => !testCase.hidden)
      .map((testCase) => ({
        caseNumber: testCase.orderIndex + 1,
        input: testCase.input,
        expected: testCase.expected,
      })),
  };
}

async function executeInRunner(
  slug: string,
  sourceCode: string,
  testCases: Array<{ input: string; expected: string }>,
) {
  let response: Response;
  try {
    response = await fetch(`${env.RUNNER_URL}/execute`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-runner-token': env.RUNNER_TOKEN,
      },
      body: JSON.stringify({ sourceCode: toRunnerSource(slug, sourceCode), testCases }),
      signal: AbortSignal.timeout(55_000),
    });
  } catch {
    throw new AppError(
      503,
      'The C++ runner is unavailable. Start the isolated runner and try again.',
      'RUNNER_UNAVAILABLE',
    );
  }
  if (response.status === 429) {
    throw new AppError(429, 'The C++ runner is busy. Try again shortly.', 'RUNNER_BUSY');
  }
  if (!response.ok) {
    throw new AppError(
      503,
      'The C++ runner could not execute this submission.',
      'RUNNER_UNAVAILABLE',
    );
  }
  const parsed = runnerReplySchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new AppError(503, 'The C++ runner returned an invalid response.', 'RUNNER_UNAVAILABLE');
  }
  return parsed.data;
}

/** Append a normal judge harness for LeetCode-style function submissions. */
function toRunnerSource(slug: string, sourceCode: string) {
  if (slug === 'find-the-signal') {
    return `${sourceCode}

int main() {
    int n, target;
    if (!(cin >> n >> target)) return 0;
    vector<int> readings(n);
    for (int& reading : readings) cin >> reading;
    cout << Solution().findSignal(readings, target) << "\\n";
    return 0;
}
`;
  }
  if (slug === 'longest-crystal-budget') {
    return `${sourceCode}

int main() {
    int n;
    long long budget;
    if (!(cin >> n >> budget)) return 0;
    vector<int> crystals(n);
    for (int& crystal : crystals) cin >> crystal;
    cout << Solution().longestWarmStretch(crystals, budget) << endl;
    return 0;
}
`;
  }
  if (slug === 'minimum-crystal-burst') {
    return `${sourceCode}

int main() {
    int n;
    long long target;
    if (!(cin >> n >> target)) return 0;
    vector<int> crystals(n);
    for (int& crystal : crystals) cin >> crystal;
    cout << Solution().minCrystalBurst(crystals, target) << endl;
    return 0;
}
`;
  }
  if (slug === 'reliable-crystal-windows') {
    return `${sourceCode}

int main() {
    int n, k;
    long long target;
    if (!(cin >> n >> k >> target)) return 0;
    vector<int> crystals(n);
    for (int& crystal : crystals) cin >> crystal;
    cout << Solution().countPowerWindows(crystals, k, target) << endl;
    return 0;
}
`;
  }
  if (slug !== 'maximum-sum-k-consecutive-crystals') return sourceCode;
  return `${sourceCode}

int main() {
    int n, k;
    if (!(cin >> n >> k)) return 0;
    vector<int> crystals(n);
    for (int& crystal : crystals) cin >> crystal;
    cout << Solution().maxCrystalEnergy(crystals, k) << "\\n";
    return 0;
}
`;
}

const supportedStatuses = new Set<SharedSubmissionStatus>([
  'ACCEPTED',
  'WRONG_ANSWER',
  'COMPILE_ERROR',
  'RUNTIME_ERROR',
  'TIME_LIMIT',
  'RUNNER_ERROR',
]);

export async function submitChallenge(
  userId: string,
  slug: string,
  sourceCode: string,
): Promise<SubmissionResult> {
  const challenge = await prisma.challenge.findUnique({
    where: { slug },
    include: { testCases: { orderBy: { orderIndex: 'asc' } } },
  });
  if (!challenge) throw notFound('Challenge not found');
  if (challenge.testCases.length === 0) {
    throw new AppError(503, 'This challenge has no configured tests.', 'CHALLENGE_UNAVAILABLE');
  }

  const run = await executeInRunner(
    slug,
    sourceCode,
    challenge.testCases.map(({ input, expected }) => ({ input, expected })),
  );
  const status: SharedSubmissionStatus = supportedStatuses.has(run.status as SharedSubmissionStatus)
    ? (run.status as SharedSubmissionStatus)
    : run.status === 'COMPILE_TIMEOUT'
      ? 'TIME_LIMIT'
      : 'RUNNER_ERROR';
  const runnerTests = Array.isArray(run.results) ? run.results : [];
  const tests = runnerTests.map((test, index) => {
    const testCase = challenge.testCases[index];
    return {
      caseNumber: (testCase?.orderIndex ?? index) + 1,
      hidden: testCase?.hidden ?? true,
      passed: test.passed === true,
      expected: testCase && !testCase.hidden ? testCase.expected : null,
      actual: testCase && !testCase.hidden ? String(test.actual ?? '').slice(0, 16_384) : null,
    };
  });
  const passed = tests.filter((test) => test.passed).length;
  const result: SubmissionResult = {
    submissionId: '',
    status,
    passed,
    total: challenge.testCases.length,
    ...(run.message ? { message: run.message.slice(0, 8_000) } : {}),
    tests,
  };
  const persistedResult = {
    status: result.status,
    passed: result.passed,
    total: result.total,
    ...(result.message ? { message: result.message } : {}),
    tests: result.tests,
  };

  const saved = await prisma.submission.create({
    data: {
      userId,
      challengeId: challenge.id,
      code: sourceCode,
      status: status as SubmissionStatus,
      result: JSON.parse(JSON.stringify(persistedResult)) as Prisma.InputJsonValue,
    },
    select: { id: true },
  });
  const xpAward = status === 'ACCEPTED' ? await grantStageXp(userId, slug) : undefined;
  return { ...result, submissionId: saved.id, ...(xpAward ? { xpAward } : {}) };
}

/** A unique grant row and the user's XP update commit or roll back together. */
async function grantStageXp(userId: string, challengeSlug: string) {
  const stage = getStageRewardByChallenge(challengeSlug);
  if (!stage) return undefined;
  try {
    const totalXp = await prisma.$transaction(async (tx) => {
      await tx.stageXpGrant.create({ data: { userId, stageId: stage.stageId, amount: stage.xp } });
      const user = await tx.user.update({ where: { id: userId }, data: { xp: { increment: stage.xp } }, select: { xp: true } });
      return user.xp;
    });
    return { stageId: stage.stageId, awarded: true, amount: stage.xp, totalXp };
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { xp: true } });
    return { stageId: stage.stageId, awarded: false, amount: 0, totalXp: user?.xp ?? 0 };
  }
}

export async function runChallenge(slug: string, sourceCode: string): Promise<SubmissionResult> {
  const challenge = await prisma.challenge.findUnique({
    where: { slug },
    include: { testCases: { where: { hidden: false }, orderBy: { orderIndex: 'asc' } } },
  });
  if (!challenge) throw notFound('Challenge not found');
  if (challenge.testCases.length === 0) {
    throw new AppError(503, 'This challenge has no examples configured.', 'CHALLENGE_UNAVAILABLE');
  }

  const run = await executeInRunner(
    slug,
    sourceCode,
    challenge.testCases.map(({ input, expected }) => ({ input, expected })),
  );
  const status: SharedSubmissionStatus = supportedStatuses.has(run.status as SharedSubmissionStatus)
    ? (run.status as SharedSubmissionStatus)
    : run.status === 'COMPILE_TIMEOUT' ? 'TIME_LIMIT' : 'RUNNER_ERROR';
  const runnerTests = Array.isArray(run.results) ? run.results : [];
  const tests = runnerTests.map((test, index) => {
    const testCase = challenge.testCases[index];
    return {
      caseNumber: (testCase?.orderIndex ?? index) + 1,
      hidden: false,
      passed: test.passed === true,
      expected: testCase?.expected ?? null,
      actual: String(test.actual ?? '').slice(0, 16_384),
    };
  });
  return {
    submissionId: '',
    status,
    passed: tests.filter((test) => test.passed).length,
    total: challenge.testCases.length,
    ...(run.message ? { message: run.message.slice(0, 8_000) } : {}),
    tests,
  };
}
