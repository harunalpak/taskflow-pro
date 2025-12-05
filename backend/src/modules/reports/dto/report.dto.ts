import { z } from 'zod';

export const createReportDto = z.object({
  reportType: z.enum(['WEEKLY', 'MONTHLY']).default('WEEKLY'),
});

export type CreateReportDto = z.infer<typeof createReportDto>;

