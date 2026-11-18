import { z } from 'zod';

export const resourceUploadSchema = z.object({
  title: z.string().trim().min(2, 'Name / title is required'),
  description: z.string().min(10, 'Description is required'),
  course: z.string().trim().min(2, 'Course or subject is required'),
  topic: z.string().trim().min(2, 'Topic is required'),
  institution: z.string().min(2, 'Institution is required'),
  level: z.string().min(1, 'Level is required'),
  type: z.enum(['lecture_notes', 'past_question', 'research_paper', 'project', 'slides', 'other']),
  license: z.enum(['CC-BY-4.0', 'CC-BY-SA-4.0', 'CC0-1.0', 'ALL-RIGHTS-RESERVED']),
  attribution: z.string().trim().min(2, 'Author is required').max(300, 'Author must be 300 characters or fewer'),
  rightsConfirmed: z.boolean().refine(value => value === true, 'You must confirm you have permission to share this material.'),
  tags: z.string().trim().min(2, 'Add at least one keyword.').max(500, 'Keywords must be 500 characters or fewer').refine(value => value.split(',').some(keyword => keyword.trim().length >= 2), 'Add at least one keyword with 2 or more characters.'),
  coAuthorHandles: z.string().max(1000, 'Co-author handles are too long').optional().default(''),
});
export type ResourceUploadValues = z.infer<typeof resourceUploadSchema>;
