import bcrypt from 'bcryptjs';
import type { LoginInput, RegisterInput, User } from '@dsa/shared';
import { prisma } from '../../lib/prisma';
import { conflict, unauthorized } from '../../lib/errors';
import { signAccessToken, signRefreshToken } from '../../lib/jwt';

type DbUser = {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  xp: number;
  createdAt: Date;
};

function toUser(u: DbUser): User {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    xp: u.xp,
    createdAt: u.createdAt.toISOString(),
  };
}

function issueTokens(user: DbUser) {
  return {
    user: toUser(user),
    accessToken: signAccessToken({ sub: user.id, username: user.username }),
    refreshToken: signRefreshToken({ sub: user.id }),
  };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { username: input.username }] },
    select: { email: true },
  });
  if (existing) {
    throw conflict(
      existing.email === input.email ? 'Email already registered' : 'Username already taken',
    );
  }
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: { username: input.username, email: input.email, passwordHash },
  });
  return issueTokens(user);
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw unauthorized('Invalid email or password');
  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw unauthorized('Invalid email or password');
  return issueTokens(user);
}

export async function getUserById(id: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw unauthorized('User no longer exists');
  return toUser(user);
}
