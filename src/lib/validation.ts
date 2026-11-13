import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your email address or username').max(320, 'Email address or username is too long'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Enter a valid email address'),
  referralCode: z.string().trim().max(32, 'Referral code is too long').optional(),
  handle: z.string().trim().transform((value) => value.replace(/^@/, '').toLowerCase()).pipe(z.string().min(3, 'Academic handle must be at least 3 characters').max(30, 'Academic handle must be 30 characters or fewer').regex(/^[a-z0-9](?:[a-z0-9._]*[a-z0-9])$/, 'Start and end with a letter or number; use only letters, numbers, periods, and underscores')),

});

export type RegisterValues = z.infer<typeof registerSchema>;
