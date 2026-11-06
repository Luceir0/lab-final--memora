import {
  errorResponseSchema,
  myUploadsPhotosQuerySchema,
  myUploadsPhotosResponseSchema,
  myUploadsSummarySchema,
} from '@memora/shared';

import type { AppConfig } from '../../config.ts';
import { ApiError } from '../../errors.ts';
import { SESSION_SECURITY_SCHEME } from '../../plugins/swagger.ts';
import type { MemoraServer } from '../../types.ts';
import { requirePrisma, setPrivateNoStore } from '../auth/guards.ts';
import { resolveSession } from '../auth/session.ts';
import { decodeMyUploadsCursor } from './uploads-cursor.ts';
import {
  findAccessibleAlbum,
  getMyUploadsSummary,
  listMyAlbumPhotosPage,
} from './uploads-service.ts';

const UPLOADS_TAG = 'Uploads';

const sessionSecurity = [{ [SESSION_SECURITY_SCHEME]: [] }];

/**
 * «Mis subidas» (F27).
 *
 * Both endpoints are read-only, session-scoped and `private, no-store`. They
 * only expose photos uploaded by the authenticated user in circles where that
 * user still has a membership row; everything else is a `404`, never a `403`.
 */
export function registerUploadRoutes(app: MemoraServer, config: AppConfig): void {
  app.get(
    '/api/me/uploads',
    {
      schema: {
        tags: [UPLOADS_TAG],
        summary: 'Resumen de mis subidas',
        description:
          'Agrupa las fotos subidas por la persona autenticada por círculo y álbum («carpeta»). Solo cuenta ' +
          'fotos con membresía vigente en su círculo: las de círculos de los que salió o fue expulsada no ' +
          'aparecen. Cada álbum incluye `photosCount`, `lastUploadAt` y hasta 4 `PhotoSummary` como preview, ' +
          'las más recientes (`createdAt desc, id desc`). Círculos y álbumes se ordenan por actividad ' +
          'reciente con desempate por `id` ascendente. `total` es la suma de todos los `photosCount`. Sin ' +
          'parámetros.',
        security: sessionSecurity,
        response: {
          200: myUploadsSummarySchema,
          401: errorResponseSchema,
          429: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const prisma = requirePrisma(app);
      const { user } = await resolveSession(prisma, config, request, reply);
      const summary = await getMyUploadsSummary(prisma, user.id);

      setPrivateNoStore(reply);

      return summary;
    },
  );

  app.get(
    '/api/me/uploads/photos',
    {
      schema: {
        tags: [UPLOADS_TAG],
        summary: 'Mis fotos de un álbum',
        description:
          'Fotos de un álbum subidas por la persona autenticada, con `PhotoDto` completo (autor, etiquetas y ' +
          'URLs `thumb`/`display`). Orden `createdAt desc` con desempate `id desc`, keyset opaco con ' +
          '`?cursor=` y `limit` (1–100, defecto 24). `total` cuenta todas las fotos propias visibles del ' +
          'álbum, no solo la página. Álbum inexistente, de otro círculo o sin membresía → `404 NOT_FOUND`, ' +
          'nunca `403`.',
        security: sessionSecurity,
        querystring: myUploadsPhotosQuerySchema,
        response: {
          200: myUploadsPhotosResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          429: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const prisma = requirePrisma(app);
      const { user } = await resolveSession(prisma, config, request, reply);
      const album = await findAccessibleAlbum(prisma, request.query.albumId, user.id);

      if (album === null) {
        throw new ApiError('NOT_FOUND');
      }

      const { cursor, limit } = request.query;
      const page = await listMyAlbumPhotosPage(prisma, album.id, user.id, {
        cursor: cursor === undefined ? null : decodeMyUploadsCursor(cursor),
        limit,
      });

      setPrivateNoStore(reply);

      return page;
    },
  );
}
