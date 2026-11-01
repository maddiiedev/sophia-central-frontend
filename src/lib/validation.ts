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
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  institution: z.string().trim().max(160, 'Institution name is too long').optional(),
  faculty: z.string().trim().max(160, 'Faculty name is too long').optional(),
  department: z.string().trim().max(160, 'Department name is too long').optional(),
  handle: z.string().trim().transform((value) => value.replace(/^@/, '').toLowerCase()).pipe(z.string().min(3, 'Academic handle must be at least 3 characters').max(30, 'Academic handle must be 30 characters or fewer').regex(/^[a-z0-9._]+$/, 'Use only letters, numbers, periods, and underscores')),
  socialLinks: z.object({
    linkedin: z.string().optional(),
    instagram: z.string().optional(),
    twitter: z.string().optional(),
  }).default({ linkedin: '', instagram: '', twitter: '' }),
}).refine((values) => values.password === values.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type RegisterValues = z.infer<typeof registerSchema>;
