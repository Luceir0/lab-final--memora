import type { PhotoDto } from '@memora/shared';
import { describe, expect, it, vi } from 'vitest';

import { isUploadCancelledError, isUploadTransportError } from './errors';
import { buildUploadUrl, createXhrUploadTransport } from './transport';

const photo: PhotoDto = {
  id: 'photo-1',
  circleId: 'circle-1',
  albumId: 'album-1',
  uploader: { id: 'user-1', name: 'Lucía', avatarUrl: null },
  clientUploadId: 'client-1',
  description: null,
  takenAt: null,
  placeName: null,
  mimeType: 'image/jpeg',
  size: 1234,
  width: 1200,
  height: 800,
  thumbUrl: '/api/photos/photo-1/image?size=thumb',
  displayUrl: '/api/photos/photo-1/image?size=display',
  tags: [],
  createdAt: '2026-11-05T10:00:00.000Z',
  updatedAt: '2026-11-05T10:00:00.000Z',
};

class FakeXhr {
  method = '';
  url = '';
  withCredentials = false;
  headers: Record<string, string> = {};
  status = 0;
  responseText = '';
  sentBody: FormData | null = null;

  upload: {
    onprogress: ((event: ProgressEvent) => void) | null;
  } = { onprogress: null };

  onload: (() => void) | null = null;

  onerror: (() => void) | null = null;

  onabort: (() => void) | null = null;

  ontimeout: (() => void) | null = null;

  open(method: string, url: string): void {
    this.method = method;
    this.url = url;
  }

  setRequestHeader(name: string, value: string): void {
    this.headers[name] = value;
  }

  send(body?: unknown): void {
    if (body instanceof FormData) {
      this.sentBody = body;
    }
  }

  abort(): void {
    // El aborto real dispara `onabort`; el transporte ya rechaza al abortar.
  }

  emitProgress(loaded: number, total: number): void {
    this.upload.onprogress?.({
      lengthComputable: true,
      loaded,
      total,
    } as ProgressEvent);
  }

  respond(status: number, body: unknown): void {
    this.status = status;
    this.responseText = JSON.stringify(body);
    this.onload?.();
  }

  respondRaw(status: number, body: string): void {
    this.status = status;
    this.responseText = body;
    this.onload?.();
  }

  networkError(): void {
    this.onerror?.();
  }
}

function setup() {
  const fake = new FakeXhr();
  const transport = createXhrUploadTransport({
    basePath: '/api',
    createXhr: () => fake as unknown as XMLHttpRequest,
  });
  const file = new File(['contenido'], 'foto.jpg', { type: 'image/jpeg' });
  const controller = new AbortController();

  return { fake, transport, file, controller };
}

function uploadWith(
  context: ReturnType<typeof setup>,
  onProgress: (percent: number) => void = () => {},
) {
  return context.transport.upload({
    albumId: 'album 1',
    file: context.file,
    fields: { clientUploadId: 'client-1' },
    csrfToken: 'csrf-token',
    signal: context.controller.signal,
    onProgress,
  });
}

describe('createXhrUploadTransport', () => {
  it('envía multipart con CSRF, credenciales y progreso monótono', async () => {
    const context = setup();
    const progress: number[] = [];

    const promise = uploadWith(context, (percent) => progress.push(percent));

    expect(context.fake.method).toBe('POST');
    expect(context.fake.url).toBe('/api/albums/album%201/photos');
    expect(context.fake.withCredentials).toBe(true);
    expect(context.fake.headers['Accept']).toBe('application/json');
    expect(context.fake.headers['X-CSRF-Token']).toBe('csrf-token');
    expect(context.fake.sentBody?.get('clientUploadId')).toBe('client-1');
    expect(context.fake.sentBody?.get('file')).toBeInstanceOf(File);

    context.fake.emitProgress(20, 100);
    context.fake.emitProgress(60, 100);
    // Un evento tardío con menos bytes no puede hacer retroceder la barra.
    context.fake.emitProgress(40, 100);
    expect(progress).toEqual([20, 60]);

    context.fake.respond(201, photo);

    await expect(promise).resolves.toEqual(photo);
    expect(progress).toEqual([20, 60, 100]);
  });

  it('añade los campos de texto opcionales', () => {
    const context = setup();

    void context.transport.upload({
      albumId: 'album-1',
      file: context.file,
      fields: {
        clientUploadId: 'client-1',
        takenAt: '2026-11-05T10:00:00.000Z',
        description: 'Un día bonito',
      },
      csrfToken: 'csrf-token',
      signal: context.controller.signal,
      onProgress: () => {},
    });

    expect(context.fake.sentBody?.get('takenAt')).toBe('2026-11-05T10:00:00.000Z');
    expect(context.fake.sentBody?.get('description')).toBe('Un día bonito');
  });

  it('mapea un error HTTP del contrato a un error tipado en español', async () => {
    const context = setup();
    const promise = uploadWith(context);

    context.fake.respond(413, {
      code: 'FILE_TOO_LARGE',
      message: 'El archivo supera el tamaño máximo permitido.',
      details: null,
    });

    const error: unknown = await promise.catch((reason: unknown) => reason);

    expect(isUploadTransportError(error)).toBe(true);
    expect(error).toMatchObject({
      code: 'FILE_TOO_LARGE',
      status: 413,
      message: 'El archivo supera el tamaño máximo permitido.',
    });
  });

  it('usa un mensaje seguro si el cuerpo de error no valida', async () => {
    const context = setup();
    const promise = uploadWith(context);

    context.fake.respondRaw(500, '<html>error</html>');

    await expect(promise).rejects.toMatchObject({
      code: 'INTERNAL_ERROR',
      status: 500,
      message: 'Ha ocurrido un error inesperado.',
    });
  });

  it('marca como INVÁLIDA una respuesta 2xx que no cumple PhotoDto', async () => {
    const context = setup();
    const promise = uploadWith(context);

    context.fake.respond(201, { id: 'photo-1' });

    await expect(promise).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
      status: 201,
    });
  });

  it('reconoce un fallo de red', async () => {
    const context = setup();
    const promise = uploadWith(context);

    context.fake.networkError();

    await expect(promise).rejects.toMatchObject({ code: 'NETWORK_ERROR', status: null });
  });

  it('abortar produce un error de cancelación reconocible', async () => {
    const context = setup();
    const promise = uploadWith(context);

    context.controller.abort();

    const error: unknown = await promise.catch((reason: unknown) => reason);

    expect(isUploadCancelledError(error)).toBe(true);
  });

  it('no crea XHR si la señal ya está abortada', async () => {
    const context = setup();
    context.controller.abort();
    const createXhr = vi.fn(() => context.fake as unknown as XMLHttpRequest);
    const transport = createXhrUploadTransport({ basePath: '/api', createXhr });

    const error: unknown = await transport
      .upload({
        albumId: 'album-1',
        file: context.file,
        fields: { clientUploadId: 'client-1' },
        csrfToken: 'csrf-token',
        signal: context.controller.signal,
        onProgress: () => {},
      })
      .catch((reason: unknown) => reason);

    expect(isUploadCancelledError(error)).toBe(true);
    expect(createXhr).not.toHaveBeenCalled();
  });
});

describe('buildUploadUrl', () => {
  it('codifica el id y elimina barras finales de la base', () => {
    expect(buildUploadUrl('album/1', '/api/')).toBe('/api/albums/album%2F1/photos');
  });
});
