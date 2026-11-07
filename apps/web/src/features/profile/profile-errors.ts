import { isApiError, isApiTransportError } from '@memora/api-client';

import { getErrorMessage } from '../../lib/error-message';

export interface ProfileErrorCopy {
  readonly title: string;
  readonly description: string;
}

export interface UpdateNameErrorMapping {
  /** Error del campo «Nombre», si el `400` lo identifica. */
  readonly fieldError?: string;
  /** Aviso completo; se pinta y se enfoca cuando no hay error de campo. */
  readonly alert: ProfileErrorCopy | null;
}

const SESSION_EXPIRED_COPY: ProfileErrorCopy = {
  title: 'Tu sesión ha caducado',
  description: 'Vuelve a entrar para seguir editando tu perfil.',
};

const CONNECTION_COPY: ProfileErrorCopy = {
  title: 'No hemos podido guardar tus datos',
  description: 'Se ha perdido la conexión. No has perdido lo que has escrito: vuelve a intentarlo.',
};

const SERVER_COPY: ProfileErrorCopy = {
  title: 'No hemos podido guardar tus datos',
  description:
    'Parece un problema del servidor. No has perdido lo que has escrito: vuelve a intentarlo.',
};

const GENERIC_SAVE_COPY: ProfileErrorCopy = {
  title: 'No hemos podido guardar tus datos',
  description: 'Vuelve a intentarlo en unos segundos.',
};

/** Traduce el fallo de carga de `/me` a texto visible en el perfil. */
export function getProfileLoadErrorCopy(error: unknown): ProfileErrorCopy {
  if (isApiError(error)) {
    if (error.status === 401) {
      return SESSION_EXPIRED_COPY;
    }

    if (error.status === 429) {
      return {
        title: 'Demasiadas peticiones',
        description: 'Espera unos segundos antes de volver a cargar tu perfil.',
      };
    }

    if (error.status >= 500) {
      return {
        title: 'No hemos podido cargar tu perfil',
        description: 'Parece un problema del servidor. Vuelve a intentarlo en unos segundos.',
      };
    }

    return { title: 'No hemos podido cargar tu perfil', description: error.message };
  }

  if (isApiTransportError(error)) {
    return {
      title: 'No hemos podido cargar tu perfil',
      description: 'Parece un problema de conexión. Vuelve a intentarlo en unos segundos.',
    };
  }

  return { title: 'No hemos podido cargar tu perfil', description: getErrorMessage(error) };
}

/**
 * Mapea el `PATCH /me` del nombre.
 *
 * Un `400` con detalle del campo `name` se asocia al `TextField`; sin detalle,
 * el mensaje canónico de la API se muestra en el aviso del bloque. El resto de
 * estados no se copia nunca: se usan textos propios y seguros.
 */
export function mapUpdateNameError(error: unknown): UpdateNameErrorMapping {
  if (isApiError(error)) {
    if (error.status === 400) {
      const nameDetail = (error.details ?? []).find((detail) => detail.field === 'name');

      if (nameDetail !== undefined) {
        return {
          fieldError: nameDetail.message ?? error.message,
          alert: null,
        };
      }

      return {
        alert: {
          title: 'Revisa tu nombre',
          description: error.message,
        },
      };
    }

    if (error.status === 401) {
      return { alert: SESSION_EXPIRED_COPY };
    }

    if (error.status === 429) {
      return {
        alert: {
          title: 'Demasiadas peticiones',
          description: 'Espera unos segundos antes de volver a guardar tu nombre.',
        },
      };
    }

    if (error.status >= 500) {
      return { alert: SERVER_COPY };
    }

    return { alert: { ...GENERIC_SAVE_COPY, description: getErrorMessage(error) } };
  }

  if (isApiTransportError(error)) {
    return { alert: CONNECTION_COPY };
  }

  return { alert: GENERIC_SAVE_COPY };
}

/** Texto visible si falla el `POST /auth/logout`. */
export function getLogoutErrorCopy(error: unknown): ProfileErrorCopy {
  if (isApiError(error) && error.status === 429) {
    return {
      title: 'No hemos podido cerrar la sesión',
      description: 'Espera unos segundos antes de volver a intentarlo.',
    };
  }

  if (isApiTransportError(error)) {
    return {
      title: 'No hemos podido cerrar la sesión',
      description: 'Parece un problema de conexión. Vuelve a intentarlo.',
    };
  }

  return {
    title: 'No hemos podido cerrar la sesión',
    description: getErrorMessage(error),
  };
}
