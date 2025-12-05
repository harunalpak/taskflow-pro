import { z } from 'zod';

export const createProjectDto = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
});

export const updateProjectDto = z.object({
  name: z.string().min(1, 'Project name is required').optional(),
  description: z.string().optional(),
});

export const addMemberDto = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: z.enum(['OWNER', 'MEMBER']).default('MEMBER'),
});

export type CreateProjectDto = z.infer<typeof createProjectDto>;
export type UpdateProjectDto = z.infer<typeof updateProjectDto>;
export type AddMemberDto = z.infer<typeof addMemberDto>;

