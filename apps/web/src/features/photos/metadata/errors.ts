import { isApiError } from '@memora/api-client';

export interface PhotoMetadataErrorCopy {
  readonly title: string;
  readonly description: string;
}

/**
 * Traduce un fallo del `PATCH` a texto visible.
 *
 * Solo se copian mensajes canónicos de la API; el resto de errores nunca se
 * muestran. El servidor decide de verdad los permisos: aquí solo se explica.
 */
export function getPhotoMetadataErrorCopy(error: unknown): PhotoMetadataErrorCopy {
  if (isApiError(error)) {
    switch (error.status) {
      case 403:
        return {
          title: 'No puedes editar esta foto',
          description:
            'Solo quien la subió o la persona que creó el círculo pueden cambiar su descripción, fecha y lugar.',
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
      case 400:
        return {
          title: 'Revisa los datos de la foto',
          description: error.message,
        };
      default:
        return {
          title: 'No hemos podido guardar los cambios',
          description:
            error.status >= 500
              ? 'Parece un problema del servidor. No has perdido lo que has escrito: vuelve a intentarlo.'
              : error.message,
        };
    }
  }

  return {
    title: 'No hemos podido guardar los cambios',
    description:
      'Se ha perdido la conexión. No has perdido lo que has escrito: vuelve a intentarlo.',
  };
}
