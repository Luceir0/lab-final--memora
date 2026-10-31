import { z } from 'zod';

import { createPageSchema, pageQuerySchema } from '../pagination.js';
import { VALIDATION_MESSAGES } from '../validation-messages.js';
import { circleParamsSchema } from './circles.js';
import { emailSchema, emptyResponseSchema, idSchema } from './common.js';
import {
  circleDtoSchema,
  createdInvitationDtoSchema,
  invitationDtoSchema,
  invitationPreviewDtoSchema,
  invitationStateSchema,
} from './dto.js';

/** `:token` of a public invitation link. */
export const invitationTokenParamsSchema = z.object({
  token: z
    .string()
    .min(1, VALIDATION_MESSAGES.invitationTokenRequired)
    .max(256, VALIDATION_MESSAGES.invitationTokenTooLong),
});

export type InvitationTokenParams = z.infer<typeof invitationTokenParamsSchema>;

/** `:circleId` + `:invitationId`. */
export const circleInvitationParamsSchema = z.object({
  circleId: idSchema,
  invitationId: idSchema,
});

export type CircleInvitationParams = z.infer<typeof circleInvitationParamsSchema>;

/** Re-exported for routers that mount invitation creation under a circle. */
export const createInvitationParamsSchema = circleParamsSchema;

export type CreateInvitationParams = z.infer<typeof createInvitationParamsSchema>;

/** The email is optional; when present it is only a hint, never a hard gate. */
export const createInvitationRequestSchema = z.object({
  invitedEmail: emailSchema.optional(),
});

export type CreateInvitationRequest = z.infer<typeof createInvitationRequestSchema>;

/** `POST /circles/:circleId/invitations` → 201, token shown exactly once. */
export const createInvitationResponseSchema = createdInvitationDtoSchema;

export type CreateInvitationResponse = z.infer<typeof createInvitationResponseSchema>;

export const listInvitationsQuerySchema = pageQuerySchema;

export type ListInvitationsQuery = z.infer<typeof listInvitationsQuerySchema>;

export const listInvitationsResponseSchema = createPageSchema(invitationDtoSchema);

export type ListInvitationsResponse = z.infer<typeof listInvitationsResponseSchema>;

/** `DELETE /circles/:circleId/invitations/:invitationId` → 204. */
export const revokeInvitationResponseSchema = emptyResponseSchema;

export type RevokeInvitationResponse = z.infer<typeof revokeInvitationResponseSchema>;

/** `GET /invitations/:token`: minimal data for the preview. */
export const invitationPreviewResponseSchema = invitationPreviewDtoSchema;

export type InvitationPreviewResponse = z.infer<typeof invitationPreviewResponseSchema>;

/**
 * `POST /invitations/:token/accept`: idempotent. `state` is `valid` when the
 * user has just joined and `already_member` when they were already in the
 * circle; there is no parallel boolean.
 */
export const acceptInvitationResponseSchema = z.object({
  circle: circleDtoSchema,
  state: invitationStateSchema,
});

export type AcceptInvitationResponse = z.infer<typeof acceptInvitationResponseSchema>;
