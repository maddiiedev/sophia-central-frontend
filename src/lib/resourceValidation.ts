import { z } from 'zod';

const resourceTypes = ['lecture_notes', 'past_question', 'research_paper', 'project', 'slides', 'other'] as const;
const resourceLicenses = ['CC-BY-4.0', 'CC-BY-SA-4.0', 'CC0-1.0', 'ALL-RIGHTS-RESERVED'] as const;

export const resourceUploadSchema = z.object({
  title: z.string().trim().min(2, 'Resource title is required').max(200, 'Resource title must be 200 characters or fewer'),
  description: z.string().trim().max(5000, 'Description must be 5,000 characters or fewer').optional().default(''),
  course: z.string().trim().min(2, 'Course code or subject is required').max(200, 'Course code or subject must be 200 characters or fewer'),
  topic: z.string().trim().max(200, 'Topic must be 200 characters or fewer').optional().default(''),
  institution: z.string().trim().min(2, 'Institution is required').max(200, 'Institution must be 200 characters or fewer'),
  level: z.string().trim().min(1, 'Academic level is required').max(100, 'Academic level must be 100 characters or fewer'),
  type: z.enum(resourceTypes),
  license: z.union([z.literal(''), z.enum(resourceLicenses)]).optional().default(''),
  attribution: z.string().trim().max(300, 'Original author must be 300 characters or fewer').optional().default(''),
  rightsConfirmed: z.boolean().refine(value => value === true, 'Confirm that you created this material or have permission to share it.'),
  tags: z.string().trim().max(500, 'Keywords must be 500 characters or fewer').optional().default(''),
  coAuthorHandles: z.string().max(1000, 'Co-author handles are too long').optional().default(''),
});
export type ResourceUploadValues = z.infer<typeof resourceUploadSchema>;
