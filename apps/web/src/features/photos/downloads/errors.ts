import { isApiError, isApiTransportError } from '@memora/api-client';
import type { DownloadJobDto } from '@memora/shared';

import { getErrorMessage } from '../../../lib/error-message';

export interface DownloadErrorCopy {
  readonly title: string;
  readonly description: string;
}

const RATE_LIMITED_MESSAGE =
  'Hemos bloqueado temporalmente las peticiones desde esta conexión. Espera unos segundos antes de volver a intentarlo.';

const JOB_ERROR_TITLE = 'No hemos podido generar el ZIP';

/**
 * Traduce el fallo al crear el job.
 *
 * Solo se muestran mensajes canónicos de la API. Los límites de 500 fotos o
 * 2 GB llegan como `400`/`413` con un mensaje seguro que se copia tal cual.
 */
export function getDownloadCreateErrorCopy(error: unknown): DownloadErrorCopy {
  if (isApiError(error)) {
    if (error.status === 403) {
      return {
        title: 'No puedes descargar en este círculo',
        description: 'La descarga está desactivada o tu cuenta ya no forma parte del círculo.',
      };
    }

    if (error.status === 404) {
      return {
        title: 'El álbum ya no está disponible',
        description: 'Puede que lo hayan eliminado o que ya no tengas acceso a él.',
      };
    }

    if (error.status === 429) {
      return { title: 'Demasiadas peticiones', description: RATE_LIMITED_MESSAGE };
    }

    if (error.status === 400 || error.status === 413) {
      return { title: 'No se puede preparar esta descarga', description: error.message };
    }

    return {
      title: 'No hemos podido preparar la descarga',
      description:
        error.status >= 500
          ? 'Parece un problema del servidor. Las fotos siguen a salvo: vuelve a intentarlo en unos segundos.'
          : error.message,
    };
  }

  if (isApiTransportError(error)) {
    return {
      title: 'No hemos podido preparar la descarga',
      description: 'Parece un problema de conexión. Vuelve a intentarlo en unos segundos.',
    };
  }

  return {
    title: 'No hemos podido preparar la descarga',
    description: getErrorMessage(error),
  };
}

/**
 * Traduce un job en `error` o un fallo al consultarlo.
 *
 * `errorMessage` forma parte del contrato y la API lo construye sin PII, así
 * que se prefiere a un texto genérico.
 */
export function getDownloadJobErrorCopy(
  job: DownloadJobDto | null,
  error: unknown,
): DownloadErrorCopy {
  if (job?.status === 'error') {
    return {
      title: JOB_ERROR_TITLE,
      description:
        job.errorMessage ??
        'Algo ha fallado al preparar el archivo. Las fotos siguen a salvo: vuelve a intentarlo.',
    };
  }

  if (job === null) {
    return getDownloadCreateErrorCopy(error);
  }

  return { title: JOB_ERROR_TITLE, description: getDownloadCreateErrorCopy(error).description };
}
