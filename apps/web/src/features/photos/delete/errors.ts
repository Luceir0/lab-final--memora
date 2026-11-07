import { isApiError } from '@memora/api-client';

export interface PhotoDeleteErrorCopy {
  readonly title: string;
  readonly description: string;
}

/**
 * Traduce un fallo del `DELETE` a texto visible.
 *
 * Solo se copian mensajes canónicos de la API; el resto de errores nunca se
 * muestran. El servidor decide de verdad los permisos: aquí solo se explica.
 */
export function getPhotoDeleteErrorCopy(error: unknown): PhotoDeleteErrorCopy {
  if (isApiError(error)) {
    switch (error.status) {
      case 403:
        return {
          title: 'No puedes eliminar esta foto',
          description: 'Solo quien la subió o la persona que creó el círculo pueden eliminarla.',
        };
      case 404:
        return {
          title: 'La foto ya no está disponible',
          description: 'Puede que la hayan eliminado o que ya no tengas acceso a ella.',
        };
      case 429:
        return {
          title: 'Demasiadas peticiones',
          description:
            'Hemos bloqueado temporalmente las peticiones desde esta conexión. Espera unos segundos antes de volver a intentarlo.',
        };
      default:
        return {
          title: 'No hemos podido eliminar la foto',
          description:
            error.status >= 500
              ? 'Parece un problema del servidor. La foto sigue ahí: vuelve a intentarlo.'
              : error.message,
        };
    }
  }

  return {
    title: 'No hemos podido eliminar la foto',
    description: 'Se ha perdido la conexión. La foto sigue ahí: vuelve a intentarlo.',
  };
}
