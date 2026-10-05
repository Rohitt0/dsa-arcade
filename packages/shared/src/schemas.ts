import { z } from 'zod';

/** Validation schemas shared between client (form validation) and server (request validation). */

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'At least 3 characters')
    .max(24, 'At most 24 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers and underscore only'),
  email: z.string().email('Enter a valid email').max(254),
  password: z.string().min(8, 'At least 8 characters').max(128),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;
