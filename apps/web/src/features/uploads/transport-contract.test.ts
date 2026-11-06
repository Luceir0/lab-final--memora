import type { PhotoDto } from '@memora/shared';
import { describe, expect, it } from 'vitest';

import { isUploadCancelledError } from './errors';
import { createXhrUploadTransport, type UploadTransportRequest } from './transport';

/**
 * Contrato del transporte XHR que no cubre la suite base: ambos 2xx, el tope
 * del 99 % antes de la respuesta y el aborto real del objeto XHR.
 */

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
  aborted = false;

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
    this.aborted = true;
    this.onabort?.();
  }

  emitProgress(loaded: number, total: number, lengthComputable = true): void {
    this.upload.onprogress?.({
      lengthComputable,
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
}

function setup(fields: UploadTransportRequest['fields'] = { clientUploadId: 'client-1' }) {
  const fake = new FakeXhr();
  const transport = createXhrUploadTransport({
    basePath: '/api',
    createXhr: () => fake as unknown as XMLHttpRequest,
  });
  const file = new File(['contenido'], 'foto.jpg', { type: 'image/jpeg' });
  const controller = new AbortController();

  const start = (onProgress: (percent: number) => void = () => {}) =>
    transport.upload({
      albumId: 'album-1',
      file,
      fields,
      csrfToken: 'csrf-token',
      signal: controller.signal,
      onProgress,
    });

  return { fake, transport, file, controller, start };
}

describe('createXhrUploadTransport · respuestas correctas', () => {
  it('acepta 200 y 201 como subida completada', async () => {
    for (const status of [200, 201]) {
      const context = setup();

      const promise = context.start();
      context.fake.respond(status, photo);

      await expect(promise).resolves.toEqual(photo);
    }
  });

  it('acota el progreso a 99 hasta el 2xx y solo llega a 100 al completar', async () => {
    const context = setup();
    const progress: number[] = [];

    const promise = context.start((percent) => progress.push(percent));

    context.fake.emitProgress(100, 100);
    // Repetir el mismo valor no vuelve a notificar.
    context.fake.emitProgress(100, 100);
    // Un evento tardío menor tampoco hace retroceder la barra.
    context.fake.emitProgress(10, 100);

    expect(progress).toEqual([99]);

    context.fake.respond(200, photo);

    await expect(promise).resolves.toEqual(photo);
    expect(progress).toEqual([99, 100]);
  });

  it('ignora eventos sin total o no computables', async () => {
    const context = setup();
    const progress: number[] = [];

    void context.start((percent) => progress.push(percent));

    context.fake.emitProgress(50, 0);
    context.fake.emitProgress(50, 100, false);

    expect(progress).toEqual([]);
  });
});

describe('createXhrUploadTransport · errores', () => {
  it('mapea estados HTTP sin cuerpo contractual a un código seguro', async () => {
    const cases = [
      [400, 'VALIDATION_ERROR'],
      [429, 'RATE_LIMITED'],
      [418, 'INTERNAL_ERROR'],
    ] as const;

    for (const [status, code] of cases) {
      const context = setup();
      const promise = context.start();

      context.fake.respondRaw(status, '<html>sin contrato</html>');

      await expect(promise).rejects.toMatchObject({ code, status });
    }
  });

  it('abortar llama al abort del XHR y rechaza con CANCELLED', async () => {
    const context = setup();
    const promise = context.start();

    context.controller.abort();

    const error: unknown = await promise.catch((reason: unknown) => reason);

    expect(context.fake.aborted).toBe(true);
    expect(isUploadCancelledError(error)).toBe(true);
  });
});

describe('createXhrUploadTransport · formulario', () => {
  it('solo añade los campos de texto presentes y conserva el nombre del archivo', async () => {
    const context = setup();
    const promise = context.start();

    expect(context.fake.sentBody?.get('clientUploadId')).toBe('client-1');
    expect(context.fake.sentBody?.get('takenAt')).toBeNull();
    expect(context.fake.sentBody?.get('description')).toBeNull();

    const sentFile = context.fake.sentBody?.get('file');

    expect(sentFile).toBeInstanceOf(File);
    expect((sentFile as File).name).toBe('foto.jpg');

    context.fake.respond(201, photo);

    await expect(promise).resolves.toEqual(photo);
  });
});
