import { z } from 'zod';

import { emptyResponseSchema, idSchema } from './common.js';
import { photoTagDtoSchema } from './dto.js';

/** `POST /photos/:photoId/tags`. Tags are created for an existing circle member. */
export const addPhotoTagRequestSchema = z.object({
  userId: idSchema,
});

export type AddPhotoTagRequest = z.infer<typeof addPhotoTagRequestSchema>;

export const addPhotoTagResponseSchema = photoTagDtoSchema;

export type AddPhotoTagResponse = z.infer<typeof addPhotoTagResponseSchema>;

/** `DELETE /photos/:photoId/tags/:userId` route params. */
export const photoTagParamsSchema = z.object({
  photoId: idSchema,
  userId: idSchema,
});

export type PhotoTagParams = z.infer<typeof photoTagParamsSchema>;

/** `DELETE /photos/:photoId/tags/:userId` → 204. */
export const removePhotoTagResponseSchema = emptyResponseSchema;

export type RemovePhotoTagResponse = z.infer<typeof removePhotoTagResponseSchema>;
