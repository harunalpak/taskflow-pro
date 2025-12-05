import { z } from 'zod';

export const updateProfileDto = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  avatarUrl: z.string().url('Invalid URL').optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileDto>;

