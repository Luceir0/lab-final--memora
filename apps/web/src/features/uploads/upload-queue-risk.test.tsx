import type { PhotoDto } from '@memora/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../../../../../packages/ui/src/test/axe';
import { UploadTransportError } from './errors';
import type { UploadTransport, UploadTransportRequest } from './transport';
import { UploadProvider } from './upload-provider';
import { UploadQueue } from './upload-queue';
import { useUploadQueue } from './upload-queue-context';

/**
 * Riesgos de la cola en pantalla: hoja móvil, cabecera con bytes ponderados,
 * aislamiento visual de errores y accesibilidad del progreso y del cierre.
 */

const { fetchCsrfTokenMock } = vi.hoisted(() => ({
  fetchCsrfTokenMock: vi.fn(async () => 'csrf-token'),
}));

vi.mock('../../lib/csrf', () => ({ fetchCsrfToken: fetchCsrfTokenMock }));

const MEGABYTE = 1024 * 1024;

const photo: PhotoDto = {
  id: 'photo-1',
  circleId: 'circle-1',
  albumId: 'album-1',
  uploader: { id: 'user-1', name: 'Lucía', avatarUrl: null },
  clientUploadId: null,
  description: null,
  takenAt: null,
  placeName: null,
  mimeType: 'image/jpeg',
  size: 10,
  width: 100,
  height: 100,
  thumbUrl: '/api/photos/photo-1/image?size=thumb',
  displayUrl: '/api/photos/photo-1/image?size=display',
  tags: [],
  createdAt: '2026-11-05T10:00:00.000Z',
  updatedAt: '2026-11-05T10:00:00.000Z',
};

interface Deferred<T> {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => void;
  readonly reject: (reason?: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

interface FakeTransport {
  readonly requests: UploadTransportRequest[];
  readonly deferreds: Deferred<PhotoDto>[];
  readonly transport: UploadTransport;
}

function createFakeTransport(): FakeTransport {
  const requests: UploadTransportRequest[] = [];
  const deferreds: Deferred<PhotoDto>[] = [];

  const upload: UploadTransport['upload'] = (request) => {
    requests.push(request);
    const pending = deferred<PhotoDto>();
    deferreds.push(pending);

    request.signal.addEventListener(
      'abort',
      () => {
        pending.reject(new UploadTransportError('CANCELLED', null));
      },
      { once: true },
    );

    return pending.promise;
  };

  return { requests, deferreds, transport: { upload } };
}

function imageFile(name = 'foto.jpg', size?: number): File {
  const file = new File(['contenido'], name, { type: 'image/jpeg' });

  if (size !== undefined) {
    Object.defineProperty(file, 'size', { value: size });
  }

  return file;
}

function Harness({
  files,
  initialOpen = true,
}: {
  readonly files: readonly File[];
  readonly initialOpen?: boolean;
}) {
  const { enqueue } = useUploadQueue();
  const [open, setOpen] = useState(initialOpen);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          enqueue(files, {
            albumId: 'album-1',
            albumTitle: 'Verano en Mallorca',
            source: 'gallery',
          });
          setOpen(true);
        }}
      >
        añadir
      </button>
      <UploadQueue
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        panelId="upload-panel"
      />
    </>
  );
}

function renderQueue(files: readonly File[]) {
  const fake = createFakeTransport();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  const view = render(
    <QueryClientProvider client={queryClient}>
      <UploadProvider transport={fake.transport}>
        <Harness files={files} />
      </UploadProvider>
    </QueryClientProvider>,
  );

  fireEvent.click(screen.getByRole('button', { name: 'añadir' }));

  return { ...view, fake, queryClient };
}

function announcement(): string {
  // La hoja se renderiza en un portal sobre `document.body`, fuera del
  // contenedor de RTL: hay que buscarla en el documento.
  return document.querySelector('[aria-live="polite"]')?.textContent ?? '';
}

beforeEach(() => {
  fetchCsrfTokenMock.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('UploadQueue · presentación y progreso', () => {
  it('en móvil se abre como diálogo con nombre, región desplazable y cierre', async () => {
    const { fake } = renderQueue([imageFile('foto-1.jpg')]);

    await waitFor(() => expect(fake.requests).toHaveLength(1));

    const dialog = screen.getByRole('dialog', { name: 'Subidas' });

    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(within(dialog).getByRole('region', { name: 'Lista de subidas' })).toBeTruthy();
    expect(within(dialog).getByRole('button', { name: 'Cerrar' })).toBeTruthy();
    expect(within(dialog).getByRole('button', { name: 'Cancelar foto-1.jpg' })).toBeTruthy();
  });

  it('la cabecera muestra N de M, porcentaje y bytes ponderados por tamaño', async () => {
    const { fake } = renderQueue([
      imageFile('foto-1.jpg', MEGABYTE),
      imageFile('foto-2.jpg', MEGABYTE),
    ]);

    await waitFor(() => expect(fake.requests).toHaveLength(2));

    expect(screen.getByText('0 de 2 subidas')).toBeTruthy();
    expect(screen.getByText('0 % · 0 de 2 MB')).toBeTruthy();

    act(() => {
      fake.requests[0]?.onProgress(50);
    });

    expect(screen.getByText('25 % · 0,5 de 2 MB')).toBeTruthy();

    await act(async () => {
      fake.deferreds[0]?.resolve(photo);
    });

    expect(await screen.findByText('1 de 2 subidas')).toBeTruthy();
    expect(screen.getByText('50 % · 1 de 2 MB')).toBeTruthy();
  });

  it('cada barra de progreso tiene el nombre accesible del archivo', async () => {
    const { fake } = renderQueue([imageFile('foto-1.jpg'), imageFile('foto-2.jpg')]);

    await waitFor(() => expect(fake.requests).toHaveLength(2));

    expect(screen.getByRole('progressbar', { name: 'Progreso de las subidas' })).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: 'Subida de foto-1.jpg' })).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: 'Subida de foto-2.jpg' })).toBeTruthy();
  });
});

describe('UploadQueue · errores aislados', () => {
  it('dos errores no ocultan al tercer archivo ni pierden sus acciones', async () => {
    const { fake } = renderQueue([
      imageFile('foto-1.jpg'),
      imageFile('foto-2.jpg'),
      imageFile('foto-3.jpg'),
    ]);

    await waitFor(() => expect(fake.requests).toHaveLength(3));

    await act(async () => {
      fake.deferreds[0]?.reject(new UploadTransportError('FILE_TOO_LARGE', 413));
      fake.deferreds[1]?.reject(new UploadTransportError('NETWORK_ERROR', null));
    });

    expect(await screen.findByText('El archivo supera los 25 MB.')).toBeTruthy();
    expect(
      await screen.findByText('No se pudo conectar. Revisa tu conexión y reintenta.'),
    ).toBeTruthy();

    expect(screen.getByText('foto-3.jpg')).toBeTruthy();
    expect(screen.getByText('Subiendo · 0 %')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancelar foto-3.jpg' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reintentar foto-1.jpg' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reintentar foto-2.jpg' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reintentar fallidas (2)' })).toBeTruthy();
    expect(screen.getByText('0 de 3 subidas')).toBeTruthy();
  });
});

describe('UploadQueue · accesibilidad', () => {
  it('la región viva anuncia transiciones y nunca porcentajes', async () => {
    const { fake } = renderQueue([imageFile('foto-1.jpg')]);

    await waitFor(() => {
      expect(announcement()).toContain('Se ha añadido foto-1.jpg a la cola.');
    });

    act(() => {
      fake.requests[0]?.onProgress(57);
    });

    expect(announcement()).toContain('Se ha añadido foto-1.jpg a la cola.');
    expect(announcement()).not.toContain('57');
    expect(announcement()).not.toContain('%');

    await act(async () => {
      fake.deferreds[0]?.resolve(photo);
    });

    await waitFor(() => {
      expect(announcement()).toContain('foto-1.jpg se ha subido.');
    });
  });

  it('no tiene violaciones de axe con la cola abierta en móvil', async () => {
    const { fake } = renderQueue([imageFile('foto-1.jpg'), imageFile('foto-2.jpg')]);

    await waitFor(() => expect(fake.requests).toHaveLength(2));

    await expectNoAxeViolations(screen.getByRole('dialog', { name: 'Subidas' }));
  });

  it('Esc cierra la hoja y devuelve el foco al disparador', async () => {
    const fake = createFakeTransport();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <UploadProvider transport={fake.transport}>
          <Harness files={[imageFile('foto-1.jpg')]} initialOpen={false} />
        </UploadProvider>
      </QueryClientProvider>,
    );

    const trigger = screen.getByRole('button', { name: 'añadir' });

    trigger.focus();
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Subidas' })).toBeTruthy();
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Subidas' })).toBeNull();
    });
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });
});
