import { z } from 'zod';

import { isoDateTimeSchema } from './common.js';

/** `GET /health`. Never includes session data. */
export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  version: z.string().min(1),
  timestamp: isoDateTimeSchema,
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
