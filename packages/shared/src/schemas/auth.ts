import { z } from 'zod';

import { createPageSchema, pageQuerySchema } from '../pagination.js';
import { VALIDATION_MESSAGES } from '../validation-messages.js';
import {
  displayNameSchema,
  emailSchema,
  emptyResponseSchema,
  passwordSchema,
  themePreferenceSchema,
} from './common.js';
import { currentUserDtoSchema, photoDtoSchema } from './dto.js';

export const registerRequestSchema = z.object({
  name: displayNameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;

/** Session endpoints agree on this envelope so the web can store the user once. */
export const sessionUserResponseSchema = z.object({
  user: currentUserDtoSchema,
});

export type SessionUserResponse = z.infer<typeof sessionUserResponseSchema>;

export const registerResponseSchema = sessionUserResponseSchema;

export type RegisterResponse = z.infer<typeof registerResponseSchema>;

export const loginRequestSchema = z.object({
  email: emailSchema,
  // Never enforce the registration rules on login: a short password is a
  // failed authentication (401), not a validation error that leaks policy.
  password: z
    .string()
    .min(1, 'Introduce tu contraseña.')
    .max(128, VALIDATION_MESSAGES.passwordTooLong),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const loginResponseSchema = sessionUserResponseSchema;

export type LoginResponse = z.infer<typeof loginResponseSchema>;

/** `POST /auth/logout` → 204. */
export const logoutResponseSchema = emptyResponseSchema;

export type LogoutResponse = z.infer<typeof logoutResponseSchema>;

export const csrfResponseSchema = z.object({
  csrfToken: z.string().min(1),
});

export type CsrfResponse = z.infer<typeof csrfResponseSchema>;

export const meResponseSchema = sessionUserResponseSchema;

export type MeResponse = z.infer<typeof meResponseSchema>;

/** Email is immutable and the avatar is not editable in the MVP. */
export const updateMeRequestSchema = z
  .object({
    name: displayNameSchema.optional(),
    themePreference: themePreferenceSchema.optional(),
  })
  .refine((value) => value.name !== undefined || value.themePreference !== undefined, {
    message: 'Indica al menos un campo para actualizar.',
  });

export type UpdateMeRequest = z.infer<typeof updateMeRequestSchema>;

export const meUploadsQuerySchema = pageQuerySchema;

export type MeUploadsQuery = z.infer<typeof meUploadsQuerySchema>;

export const meUploadsResponseSchema = createPageSchema(photoDtoSchema);

export type MeUploadsResponse = z.infer<typeof meUploadsResponseSchema>;
