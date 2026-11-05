import { isApiError, isApiTransportError } from '@memora/api-client';
import type { ErrorDetail } from '@memora/shared';

import { getErrorMessage } from '../../lib/error-message';

export type AlbumErrorContext = 'list' | 'detail' | 'create' | 'update' | 'delete' | 'empty';

export type AlbumFormField = 'title' | 'description' | 'date';

export const ALBUM_FORM_FIELDS: readonly AlbumFormField[] = ['title', 'description', 'date'];

export interface AlbumsErrorCopy {
  readonly title: string;
  readonly description: string;
}

export interface AlbumFormErrorMapping extends AlbumsErrorCopy {
  readonly fieldErrors: Partial<Record<AlbumFormField, string>>;
}

export const ALBUM_RATE_LIMITED_MESSAGE =
  'Hemos bloqueado temporalmente las peticiones desde esta conexión. Espera unos segundos antes de volver a intentarlo.';

function isAlbumFormField(value: string | undefined): value is AlbumFormField {
  return value !== undefined && (ALBUM_FORM_FIELDS as readonly string[]).includes(value);
}

/** Extrae los errores por campo de un `400` sin aceptar campos ajenos. */
export function collectAlbumFieldErrors(
  details: ErrorDetail[] | null,
  fallbackMessage: string,
): Partial<Record<AlbumFormField, string>> {
  const fieldErrors: Partial<Record<AlbumFormField, string>> = {};

  for (const detail of details ?? []) {
    if (!isAlbumFormField(detail.field)) {
      continue;
    }

    fieldErrors[detail.field] = detail.message ?? fallbackMessage;
  }

  return fieldErrors;
}

function genericTitle(context: AlbumErrorContext): string {
  switch (context) {
    case 'list':
      return 'No hemos podido cargar los álbumes';
    case 'detail':
      return 'No hemos podido cargar el álbum';
    case 'create':
      return 'No hemos podido crear el álbum';
    case 'update':
      return 'No hemos podido guardar los cambios';
    case 'delete':
      return 'No hemos podido eliminar el álbum';
    case 'empty':
      return 'No hemos podido vaciar el álbum';
  }
}

/** `409 ALBUM_NOT_EMPTY`: el álbum tiene fotos y debe vaciarse antes. */
export function isAlbumNotEmptyError(error: unknown): boolean {
  return isApiError(error) && error.code === 'ALBUM_NOT_EMPTY';
}

/**
 * Traduce un fallo de álbumes a texto visible.
 *
 * Solo se copian los mensajes de `ApiError`/`ApiTransportError`, que el
 * contrato define como seguros. El resto de errores nunca se muestran.
 */
export function getAlbumsErrorCopy(error: unknown, context: AlbumErrorContext): AlbumsErrorCopy {
  const title = genericTitle(context);
  const isForm = context === 'create' || context === 'update';

  if (isApiError(error)) {
    if (error.status === 401) {
      return {
        title: 'Tu sesión ha caducado',
        description: 'Vuelve a entrar para seguir con tus recuerdos.',
      };
    }

    if (error.status === 403) {
      return {
        title: isForm ? 'No puedes guardar este álbum' : 'No tienes permiso para esta acción',
        description:
          context === 'empty' || context === 'delete'
            ? 'Solo quien creó el círculo o el álbum puede vaciar o eliminar álbumes.'
            : 'Tu cuenta no tiene permiso para hacerlo en este círculo.',
      };
    }

    if (error.status === 404) {
      return {
        title,
        description:
          context === 'list'
            ? 'El círculo ya no existe o ya no tienes acceso.'
            : 'El álbum ya no existe o ya no tienes acceso.',
      };
    }

    if (isAlbumNotEmptyError(error)) {
      return {
        title: 'El álbum todavía tiene fotos',
        description: 'Vacíalo antes de eliminarlo.',
      };
    }

    if (error.status === 429) {
      return { title: 'Demasiadas peticiones', description: ALBUM_RATE_LIMITED_MESSAGE };
    }

    if (error.status >= 500) {
      if (context === 'empty' || context === 'delete') {
        return {
          title,
          description:
            'Parece un problema del servidor. El álbum no ha cambiado: vuelve a intentarlo en unos segundos.',
        };
      }

      return {
        title,
        description:
          context === 'list' || context === 'detail'
            ? 'Parece un problema del servidor. Tus fotos siguen a salvo: vuelve a intentarlo en unos segundos.'
            : 'Parece un problema del servidor. No has perdido nada de lo que has escrito: vuelve a intentarlo.',
      };
    }

    if (isForm && error.status === 400) {
      return { title: 'Revisa los datos del álbum', description: error.message };
    }

    return { title, description: getErrorMessage(error) };
  }

  if (isApiTransportError(error)) {
    return {
      title,
      description: isForm
        ? 'Se ha perdido la conexión. No has perdido nada de lo que has escrito: vuelve a intentarlo.'
        : 'Parece un problema de conexión. Vuelve a intentarlo en unos segundos.',
    };
  }

  return { title, description: getErrorMessage(error) };
}

/** Mapeo completo del formulario: resumen y errores por campo. */
export function mapAlbumFormError(
  error: unknown,
  context: 'create' | 'update',
): AlbumFormErrorMapping {
  const copy = getAlbumsErrorCopy(error, context);
  const fieldErrors =
    isApiError(error) && error.status === 400
      ? collectAlbumFieldErrors(error.details, error.message)
      : {};

  return { ...copy, fieldErrors };
}
