/**
 * Shared domain types used by both the API and the web client.
 * These intentionally mirror (a serializable view of) the Prisma models.
 */

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface User {
  id: string;
  username: string;
  email: string;
  xp: number;
  createdAt: string; // ISO-8601
}

export interface RegionTheme {
  accent?: string;
  biome?: string;
}

export interface Pattern {
  id: string;
  regionId: string;
  slug: string;
  name: string;
  description: string;
  analogy: string | null;
  pseudocode: string | null;
  complexity: string | null;
  difficulty: Difficulty;
  orderIndex: number;
}

export interface Region {
  id: string;
  slug: string;
  name: string;
  description: string;
  orderIndex: number;
  theme: RegionTheme | null;
  /** Phase 1: computed server-side (progress system arrives in Phase 6). */
  unlocked: boolean;
  patterns: Pattern[];
}

export interface ChallengeTestCase {
  caseNumber: number;
  input: string;
  expected: string;
}

export interface Challenge {
  id: string;
  patternId: string;
  slug: string;
  title: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  difficulty: Difficulty;
  starterCode: string;
  sampleTests: ChallengeTestCase[];
  savedSolution?: { code: string; completed: boolean };
}

export type SubmissionStatus =
  'ACCEPTED' | 'WRONG_ANSWER' | 'COMPILE_ERROR' | 'RUNTIME_ERROR' | 'TIME_LIMIT' | 'RUNNER_ERROR';

export interface SubmissionTestResult {
  caseNumber: number;
  hidden: boolean;
  passed: boolean;
  expected: string | null;
  actual: string | null;
}

export interface SubmissionResult {
  submissionId: string;
  status: SubmissionStatus;
  passed: number;
  total: number;
  message?: string;
  tests: SubmissionTestResult[];
  xpAward?: { stageId: string; awarded: boolean; amount: number; totalXp: number };
}

/** Standard success envelopes. */
export interface AuthResponse {
  user: User;
  accessToken: string;
}

/** Standard error envelope returned by the API. */
export interface ApiError {
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}
