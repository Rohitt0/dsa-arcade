import { Prisma, SubmissionStatus } from '@prisma/client';
import type {
  Challenge,
  SubmissionResult,
  SubmissionStatus as SharedSubmissionStatus,
} from '@dsa/shared';
import { prisma } from '../../lib/prisma';
import { AppError, notFound } from '../../lib/errors';
import { env } from '../../config/env';
import { z } from 'zod';

const runnerReplySchema = z.object({
  status: z.string().max(40),
  message: z.string().max(8_000).optional(),
  results: z
    .array(z.object({ passed: z.boolean(), actual: z.string().max(16_384) }))
    .max(10)
    .optional(),
});

export async function getChallengeBySlug(slug: string): Promise<Challenge> {
  const challenge = await prisma.challenge.findUnique({
    where: { slug },
    include: { testCases: { orderBy: { orderIndex: 'asc' } } },
  });
  if (!challenge) throw notFound('Challenge not found');

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
      body: JSON.stringify({ sourceCode, testCases }),
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
  return { ...result, submissionId: saved.id };
}
