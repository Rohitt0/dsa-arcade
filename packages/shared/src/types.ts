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
