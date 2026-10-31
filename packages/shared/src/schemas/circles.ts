import { z } from 'zod';

import { createPageSchema, pageQuerySchema } from '../pagination.js';
import { circleSettingsSchema } from '../permissions.js';
import { VALIDATION_MESSAGES } from '../validation-messages.js';
import { displayNameSchema, emptyResponseSchema, idSchema } from './common.js';
import { circleDetailDtoSchema, circleDtoSchema, memberDtoSchema } from './dto.js';

/** `:circleId` route param. */
export const circleParamsSchema = z.object({
  circleId: idSchema,
});

export type CircleParams = z.infer<typeof circleParamsSchema>;

/** `:circleId` + `:userId` route params. */
export const circleMemberParamsSchema = z.object({
  circleId: idSchema,
  userId: idSchema,
});

export type CircleMemberParams = z.infer<typeof circleMemberParamsSchema>;

export const listCirclesQuerySchema = pageQuerySchema;

export type ListCirclesQuery = z.infer<typeof listCirclesQuerySchema>;

export const listCirclesResponseSchema = createPageSchema(circleDtoSchema);

export type ListCirclesResponse = z.infer<typeof listCirclesResponseSchema>;

export const createCircleRequestSchema = z.object({
  name: displayNameSchema,
  description: z.string().max(500, VALIDATION_MESSAGES.circleDescriptionTooLong).optional(),
});

export type CreateCircleRequest = z.infer<typeof createCircleRequestSchema>;

export const circleResponseSchema = circleDtoSchema;

export type CircleResponse = z.infer<typeof circleResponseSchema>;

export const circleDetailResponseSchema = circleDetailDtoSchema;

export type CircleDetailResponse = z.infer<typeof circleDetailResponseSchema>;

/**
 * `PATCH /circles/:circleId`. `null` clears the description or the cover.
 * `settings` is replaced as a whole, never merged.
 */
export const updateCircleRequestSchema = z
  .object({
    name: displayNameSchema.optional(),
    description: z
      .string()
      .max(500, VALIDATION_MESSAGES.circleDescriptionTooLong)
      .nullable()
      .optional(),
    coverPhotoId: idSchema.nullable().optional(),
    settings: circleSettingsSchema.optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'Indica al menos un campo para actualizar.',
  });

export type UpdateCircleRequest = z.infer<typeof updateCircleRequestSchema>;

/** `DELETE /circles/:circleId` → 204. */
export const deleteCircleResponseSchema = emptyResponseSchema;

export type DeleteCircleResponse = z.infer<typeof deleteCircleResponseSchema>;

export const listMembersResponseSchema = createPageSchema(memberDtoSchema);

export type ListMembersResponse = z.infer<typeof listMembersResponseSchema>;

export const listMembersQuerySchema = pageQuerySchema;

export type ListMembersQuery = z.infer<typeof listMembersQuerySchema>;

/** `DELETE /circles/:circleId/members/:userId` → 204. */
export const removeMemberResponseSchema = emptyResponseSchema;

export type RemoveMemberResponse = z.infer<typeof removeMemberResponseSchema>;

/** `POST /circles/:circleId/leave` → 204. */
export const leaveCircleResponseSchema = emptyResponseSchema;

export type LeaveCircleResponse = z.infer<typeof leaveCircleResponseSchema>;
