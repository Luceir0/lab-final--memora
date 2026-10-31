import { z } from 'zod';

import { VALIDATION_MESSAGES } from '../validation-messages.js';

/**
 * Opaque identifier (cuid). Validated as a non-empty token, not by shape.
 */
export const idSchema = z
  .string()
  .min(1, VALIDATION_MESSAGES.idRequired)
  .max(64, VALIDATION_MESSAGES.idTooLong);

/** ISO 8601 datetime in UTC, e.g. `2026-10-25T10:00:00.000Z`. */
export const isoDateTimeSchema = z.iso.datetime();

/** Formats accepted by the upload pipeline. */
export const imageMimeTypeSchema = z.enum(['image/jpeg', 'image/png', 'image/webp']);

export const themePreferenceSchema = z.enum(['light', 'dark', 'system']);

export type ThemePreference = z.infer<typeof themePreferenceSchema>;

/** Normalised to lowercase, as stored in `User.email`. */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Introduce un email válido.').max(254));

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, 'El nombre es obligatorio.')
  .max(80, 'El nombre no puede superar los 80 caracteres.');

export const passwordSchema = z
  .string()
  .min(8, VALIDATION_MESSAGES.passwordTooShort)
  .max(128, VALIDATION_MESSAGES.passwordTooLong);

/** Body of `204 No Content` responses: there is no payload at all. */
export const emptyResponseSchema = z.void();

export type EmptyResponse = z.infer<typeof emptyResponseSchema>;
