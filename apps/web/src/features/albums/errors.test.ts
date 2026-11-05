import { ApiError, ApiTransportError } from '@memora/api-client';
import type { ErrorCode, ErrorDetail } from '@memora/shared';
import { describe, expect, it } from 'vitest';

import {
  ALBUM_RATE_LIMITED_MESSAGE,
  collectAlbumFieldErrors,
  getAlbumsErrorCopy,
  isAlbumNotEmptyError,
  mapAlbumFormError,
} from './errors';

function apiError(
  status: number,
  code: ErrorCode,
  message = 'Mensaje del servidor.',
  details: ErrorDetail[] | null = null,
): ApiError {
  return new ApiError(status, { code, message, details });
}

describe('getAlbumsErrorCopy · 401', () => {
  it('pide volver a entrar en cualquier contexto', () => {
    for (const context of ['list', 'detail', 'create', 'update', 'delete', 'empty'] as const) {
      const copy = getAlbumsErrorCopy(apiError(401, 'UNAUTHENTICATED'), context);

      expect(copy.title).toBe('Tu sesión ha caducado');
      expect(copy.description).toBe('Vuelve a entrar para seguir con tus recuerdos.');
    }
  });
});

describe('getAlbumsErrorCopy · 403', () => {
  it('explica que solo el owner puede vaciar o eliminar', () => {
    const copy = getAlbumsErrorCopy(apiError(403, 'FORBIDDEN'), 'delete');

    expect(copy.title).toBe('No tienes permiso para esta acción');
    expect(copy.description).toBe(
      'Solo quien creó el círculo o el álbum puede vaciar o eliminar álbumes.',
    );
    expect(getAlbumsErrorCopy(apiError(403, 'FORBIDDEN'), 'empty').description).toBe(
      'Solo quien creó el círculo o el álbum puede vaciar o eliminar álbumes.',
    );
  });

  it('usa un mensaje de permiso genérico en el resto de contextos', () => {
    const copy = getAlbumsErrorCopy(apiError(403, 'FORBIDDEN'), 'list');

    expect(copy.title).toBe('No tienes permiso para esta acción');
    expect(copy.description).toBe('Tu cuenta no tiene permiso para hacerlo en este círculo.');
  });

  it('en el formulario culpa al guardado, no a la sesión', () => {
    const copy = getAlbumsErrorCopy(apiError(403, 'FORBIDDEN'), 'create');

    expect(copy.title).toBe('No puedes guardar este álbum');
  });
});

describe('getAlbumsErrorCopy · 404', () => {
  it('distingue círculo y álbum', () => {
    expect(getAlbumsErrorCopy(apiError(404, 'NOT_FOUND'), 'list').description).toBe(
      'El círculo ya no existe o ya no tienes acceso.',
    );
    expect(getAlbumsErrorCopy(apiError(404, 'NOT_FOUND'), 'detail').description).toBe(
      'El álbum ya no existe o ya no tienes acceso.',
    );
    expect(getAlbumsErrorCopy(apiError(404, 'NOT_FOUND'), 'detail').title).toBe(
      'No hemos podido cargar el álbum',
    );
  });
});

describe('getAlbumsErrorCopy · 409 ALBUM_NOT_EMPTY', () => {
  it('explica que hay que vaciar antes de eliminar', () => {
    const copy = getAlbumsErrorCopy(apiError(409, 'ALBUM_NOT_EMPTY'), 'delete');

    expect(copy.title).toBe('El álbum todavía tiene fotos');
    expect(copy.description).toBe('Vacíalo antes de eliminarlo.');
  });

  it('no confunde otros 409 con ALBUM_NOT_EMPTY', () => {
    const copy = getAlbumsErrorCopy(apiError(409, 'CONFLICT', 'Conflicto.'), 'delete');

    expect(copy.title).toBe('No hemos podido eliminar el álbum');
    expect(copy.description).toBe('Conflicto.');
  });
});

describe('getAlbumsErrorCopy · 429', () => {
  it('usa el texto de espera compartido', () => {
    const copy = getAlbumsErrorCopy(apiError(429, 'RATE_LIMITED'), 'create');

    expect(copy.title).toBe('Demasiadas peticiones');
    expect(copy.description).toBe(ALBUM_RATE_LIMITED_MESSAGE);
  });
});

describe('getAlbumsErrorCopy · 5xx', () => {
  it('tranquiliza sobre las fotos al cargar', () => {
    const copy = getAlbumsErrorCopy(apiError(500, 'INTERNAL_ERROR'), 'detail');

    expect(copy.title).toBe('No hemos podido cargar el álbum');
    expect(copy.description).toContain('Tus fotos siguen a salvo');
  });

  it('tranquiliza sobre lo escrito en el formulario', () => {
    const copy = getAlbumsErrorCopy(apiError(503, 'INTERNAL_ERROR'), 'update');

    expect(copy.title).toBe('No hemos podido guardar los cambios');
    expect(copy.description).toContain('No has perdido nada de lo que has escrito');
  });

  it('en vaciar y eliminar aclara que el álbum no ha cambiado', () => {
    const empty = getAlbumsErrorCopy(apiError(500, 'INTERNAL_ERROR'), 'empty');
    const remove = getAlbumsErrorCopy(apiError(502, 'INTERNAL_ERROR'), 'delete');

    for (const copy of [empty, remove]) {
      expect(copy.description).toBe(
        'Parece un problema del servidor. El álbum no ha cambiado: vuelve a intentarlo en unos segundos.',
      );
      expect(copy.description).not.toContain('No has perdido nada de lo que has escrito');
    }

    expect(empty.title).toBe('No hemos podido vaciar el álbum');
    expect(remove.title).toBe('No hemos podido eliminar el álbum');
  });
});

describe('getAlbumsErrorCopy · 400 de formulario', () => {
  it('muestra el mensaje seguro del servidor', () => {
    const copy = getAlbumsErrorCopy(
      apiError(400, 'VALIDATION_ERROR', 'El título no es válido.'),
      'create',
    );

    expect(copy.title).toBe('Revisa los datos del álbum');
    expect(copy.description).toBe('El título no es válido.');
  });
});

describe('getAlbumsErrorCopy · errores de transporte y desconocidos', () => {
  it('distingue la pérdida de conexión en el formulario', () => {
    const copy = getAlbumsErrorCopy(new ApiTransportError('network'), 'create');

    expect(copy.title).toBe('No hemos podido crear el álbum');
    expect(copy.description).toContain('Se ha perdido la conexión');
  });

  it('usa un texto de reintento fuera del formulario', () => {
    const copy = getAlbumsErrorCopy(new ApiTransportError('network'), 'list');

    expect(copy.description).toBe(
      'Parece un problema de conexión. Vuelve a intentarlo en unos segundos.',
    );
  });

  it('nunca copia el mensaje de un Error arbitrario', () => {
    const copy = getAlbumsErrorCopy(new Error('/srv/app/secret.ts:42'), 'list');

    expect(copy.description).toBe(
      'Ha ocurrido un error inesperado. Inténtalo de nuevo en unos segundos.',
    );
    expect(copy.description).not.toContain('/srv/app');
  });
});

describe('collectAlbumFieldErrors', () => {
  it('solo acepta title, description y date', () => {
    const fieldErrors = collectAlbumFieldErrors(
      [
        { field: 'title', message: 'Título inválido.' },
        { field: 'description', message: 'Descripción inválida.' },
        { field: 'date', message: 'Fecha inválida.' },
        { field: 'coverPhotoId', message: 'Portada ajena.' },
        { field: 'circleId', message: 'Círculo ajeno.' },
      ],
      'Revisa los datos.',
    );

    expect(fieldErrors).toEqual({
      title: 'Título inválido.',
      description: 'Descripción inválida.',
      date: 'Fecha inválida.',
    });
  });

  it('usa el mensaje de respaldo cuando el detalle no trae uno', () => {
    expect(collectAlbumFieldErrors([{ field: 'title' }], 'Revisa los datos.')).toEqual({
      title: 'Revisa los datos.',
    });
  });

  it('devuelve un objeto vacío sin detalles', () => {
    expect(collectAlbumFieldErrors(null, 'Revisa los datos.')).toEqual({});
  });
});

describe('mapAlbumFormError', () => {
  it('mapea resumen y campos de un 400', () => {
    const mapping = mapAlbumFormError(
      apiError(400, 'VALIDATION_ERROR', 'Revisa los datos.', [
        { field: 'title', message: 'Ese título ya existe.' },
        { field: 'coverPhotoId', message: 'Portada ajena.' },
      ]),
      'create',
    );

    expect(mapping.title).toBe('Revisa los datos del álbum');
    expect(mapping.description).toBe('Revisa los datos.');
    expect(mapping.fieldErrors).toEqual({ title: 'Ese título ya existe.' });
  });

  it('no inventa errores por campo en errores que no son 400', () => {
    const mapping = mapAlbumFormError(apiError(500, 'INTERNAL_ERROR'), 'update');

    expect(mapping.fieldErrors).toEqual({});
  });
});

describe('isAlbumNotEmptyError', () => {
  it('reconoce el 409 ALBUM_NOT_EMPTY', () => {
    expect(isAlbumNotEmptyError(apiError(409, 'ALBUM_NOT_EMPTY'))).toBe(true);
  });

  it('rechaza otros códigos y errores que no vienen de la API', () => {
    expect(isAlbumNotEmptyError(apiError(409, 'CONFLICT'))).toBe(false);
    expect(isAlbumNotEmptyError(apiError(404, 'NOT_FOUND'))).toBe(false);
    expect(isAlbumNotEmptyError(new Error('ALBUM_NOT_EMPTY'))).toBe(false);
    expect(isAlbumNotEmptyError(null)).toBe(false);
  });
});
