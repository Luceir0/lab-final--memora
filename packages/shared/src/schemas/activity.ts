import type { z } from 'zod';

import { createPageSchema, pageQuerySchema } from '../pagination.js';
import { circleParamsSchema } from './circles.js';
import { activityItemDtoSchema } from './dto.js';

/** `GET /circles/:circleId/activity?cursor=&limit=`. */
export const circleActivityParamsSchema = circleParamsSchema;

export type CircleActivityParams = z.infer<typeof circleActivityParamsSchema>;

export const activityQuerySchema = pageQuerySchema;

export type ActivityQuery = z.infer<typeof activityQuerySchema>;

export const activityResponseSchema = createPageSchema(activityItemDtoSchema);

export type ActivityResponse = z.infer<typeof activityResponseSchema>;

/** `GET /activity`: same page shape, across every circle the user belongs to. */
export const globalActivityResponseSchema = activityResponseSchema;

export type GlobalActivityResponse = z.infer<typeof globalActivityResponseSchema>;
