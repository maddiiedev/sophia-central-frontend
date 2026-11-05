import { z } from 'zod';

export const resourceUploadSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().min(10, 'Description is required'),
  course: z.string().min(2, 'Course or subject is required'),
  topic: z.string().min(2, 'Topic is required'),
  institution: z.string().min(2, 'Institution is required'),
  level: z.string().min(1, 'Level is required'),
  type: z.enum(['lecture_notes', 'past_question', 'research_paper', 'project', 'slides', 'other']),
  license: z.enum(['CC-BY-4.0', 'CC-BY-SA-4.0', 'CC0-1.0', 'ALL-RIGHTS-RESERVED']),
  attribution: z.string().min(2, 'Attribution is required').max(300),
  rightsConfirmed: z.boolean().refine(value => value === true, 'You must confirm you have permission to share this material.'),
  tags: z.string().optional().default(''),
});
export type ResourceUploadValues = z.infer<typeof resourceUploadSchema>;
