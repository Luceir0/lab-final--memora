import { z } from 'zod';

/** Version reported by `/api/health`. Keep in sync with `package.json`. */
export const API_VERSION = '0.0.0';

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  version: z.string().min(1),
  timestamp: z.iso.datetime(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const echoRequestSchema = z.object({
  message: z.string().trim().min(1).max(280),
});

export type EchoRequest = z.infer<typeof echoRequestSchema>;

export const echoResponseSchema = z.object({
  message: z.string(),
  receivedAt: z.iso.datetime(),
});

export type EchoResponse = z.infer<typeof echoResponseSchema>;

export const errorDetailSchema = z.object({
  field: z.string(),
  message: z.string(),
});

export const errorResponseSchema = z.object({
  // TODO(F06): align the spike error catalogue with the shared contract.
  // PAYLOAD_TOO_LARGE and CLIENT_ERROR are spike extensions.
  code: z.enum([
    'VALIDATION_ERROR',
    'UNAUTHENTICATED',
    'FORBIDDEN',
    'NOT_FOUND',
    'CONFLICT',
    'PAYLOAD_TOO_LARGE',
    'UNSUPPORTED_MEDIA_TYPE',
    'RATE_LIMITED',
    'CLIENT_ERROR',
    'INTERNAL_ERROR',
  ]),
  message: z.string(),
  details: z.array(errorDetailSchema),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
