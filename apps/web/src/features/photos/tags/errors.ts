import { isApiError } from '@memora/api-client';

export interface PhotoTagErrorCopy {
  readonly title: string;
  readonly description: string;
}

/**
 * Traduce un fallo de etiquetado a texto visible.
 *
 * Solo se copian mensajes canónicos de la API; el resto de errores nunca se
 * muestran. El servidor decide de verdad los permisos: aquí solo se explica.
 */
export function getPhotoTagErrorCopy(error: unknown): PhotoTagErrorCopy {
  if (isApiError(error)) {
    switch (error.status) {
      case 403:
        return {
          title: 'No puedes etiquetar en este círculo',
          description:
            'Solo el propietario o los miembros con permiso pueden etiquetar personas en las fotos.',
        };
      case 404:
        return {
          title: 'No se pudo etiquetar',
          description: 'La foto o la persona ya no están disponibles en este círculo.',
        };
      case 429:
        return {
          title: 'Demasiadas peticiones',
          description: 'Espera unos segundos antes de volver a intentarlo.',
        };
      default:
        return {
          title: 'No hemos podido guardar las etiquetas',
          description:
            error.status >= 500
              ? 'Parece un problema del servidor. Vuelve a intentarlo.'
              : error.message,
        };
    }
  }

  return {
    title: 'No hemos podido guardar las etiquetas',
    description: 'Se ha perdido la conexión. Vuelve a intentarlo.',
  };
}
