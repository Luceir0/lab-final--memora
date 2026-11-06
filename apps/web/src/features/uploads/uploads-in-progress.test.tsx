import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectNoAxeViolations } from '../../../../../packages/ui/src/test/axe';
import {
  cancelledUploadItem,
  createFakeUploadQueue,
  doneUploadItem,
  errorUploadItem,
  pendingUploadItem,
  uploadingUploadItem,
} from '../../test/fixtures/upload-queue-fixtures';
import { UPLOADS_TITLE_ID } from './history/ids';
import { UploadQueueContext } from './upload-queue-context';
import { UploadsInProgress } from './uploads-in-progress';

function blockTree(queue: ReturnType<typeof createFakeUploadQueue>) {
  return (
    <UploadQueueContext.Provider value={queue}>
      <h1 id={UPLOADS_TITLE_ID} tabIndex={-1}>
        Subidas
      </h1>
      <UploadsInProgress />
    </UploadQueueContext.Provider>
  );
}

function renderBlock(
  items: Parameters<typeof createFakeUploadQueue>[0] = [],
  overrides: Parameters<typeof createFakeUploadQueue>[1] = {},
) {
  const queue = createFakeUploadQueue(items, overrides);

  const result = render(blockTree(queue));

  return { ...result, queue };
}

describe('UploadsInProgress', () => {
  it('pinta nombre, álbum, estado y motivo del error de la cola', () => {
    renderBlock([
      pendingUploadItem({ id: 'p1', originalName: 'costa-1.jpg' }),
      uploadingUploadItem({ id: 'p2', originalName: 'costa-2.jpg', progress: 40 }),
      errorUploadItem({ id: 'p3', originalName: 'costa-3.jpg' }),
    ]);

    const region = screen.getByRole('region', { name: 'En curso' });
    const heading = within(region).getByRole('heading', { level: 2, name: 'En curso' });

    expect(heading.className).toContain('font-bold');
    expect(heading.className).not.toContain('font-extrabold');
    expect(within(region).getByText('costa-1.jpg')).toBeTruthy();
    expect(within(region).getByText('En cola')).toBeTruthy();
    expect(within(region).getByText('costa-2.jpg')).toBeTruthy();
    expect(within(region).getByText('Subiendo · 40 %')).toBeTruthy();
    expect(within(region).getByText('costa-3.jpg')).toBeTruthy();
    expect(within(region).getByText('Error')).toBeTruthy();
    expect(within(region).getByText('El archivo supera los 25 MB.')).toBeTruthy();
    expect(within(region).getAllByText('Costa Brava')).toHaveLength(3);
  });

  it('no se renderiza cuando solo hay subidas completadas o canceladas', () => {
    const { container } = renderBlock([
      doneUploadItem({ id: 'd1' }),
      cancelledUploadItem({ id: 'c1' }),
    ]);

    expect(screen.queryByRole('heading', { name: 'En curso' })).toBeNull();
    expect(container.querySelector('section')).toBeNull();
  });

  it('muestra como máximo tres filas y resume el resto', () => {
    renderBlock([
      pendingUploadItem({ id: 'p1', originalName: 'foto-1.jpg' }),
      pendingUploadItem({ id: 'p2', originalName: 'foto-2.jpg' }),
      pendingUploadItem({ id: 'p3', originalName: 'foto-3.jpg' }),
      pendingUploadItem({ id: 'p4', originalName: 'foto-4.jpg' }),
      pendingUploadItem({ id: 'p5', originalName: 'foto-5.jpg' }),
    ]);

    const region = screen.getByRole('region', { name: 'En curso' });

    expect(within(region).getAllByRole('listitem')).toHaveLength(3);
    expect(within(region).getByText('foto-3.jpg')).toBeTruthy();
    expect(within(region).queryByText('foto-4.jpg')).toBeNull();
    expect(within(region).getByText('y 2 más en la cola')).toBeTruthy();
  });

  it('abre el panel existente con «Abrir cola» y no ofrece acciones de la cola', () => {
    const { queue } = renderBlock([pendingUploadItem()]);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir cola' }));

    expect(queue.openPanel).toHaveBeenCalledTimes(1);
    expect(queue.openPanel).toHaveBeenCalledWith({ focus: true });
    expect(screen.queryByRole('button', { name: /Reintentar/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Cancelar/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Descartar/ })).toBeNull();
  });

  it('comunica que «Abrir cola» despliega un diálogo y si está abierto', () => {
    const items = [pendingUploadItem()];
    const { rerender } = renderBlock(items);
    const button = screen.getByRole('button', { name: 'Abrir cola' });

    expect(button.getAttribute('aria-haspopup')).toBe('dialog');
    expect(button.getAttribute('aria-expanded')).toBe('false');

    rerender(blockTree(createFakeUploadQueue(items, { isPanelOpen: true })));

    expect(screen.getByRole('button', { name: 'Abrir cola' }).getAttribute('aria-expanded')).toBe(
      'true',
    );
  });

  it('devuelve el foco al título si el bloque desaparece con el foco dentro', () => {
    const { rerender } = renderBlock([pendingUploadItem()]);
    const button = screen.getByRole('button', { name: 'Abrir cola' });

    button.focus();
    expect(document.activeElement).toBe(button);

    rerender(blockTree(createFakeUploadQueue([])));

    expect(screen.queryByRole('button', { name: 'Abrir cola' })).toBeNull();
    expect(document.activeElement?.id).toBe(UPLOADS_TITLE_ID);
  });

  it('no mueve el foco al título si el bloque desaparece sin tenerlo dentro', () => {
    const { rerender } = renderBlock([pendingUploadItem()]);

    rerender(blockTree(createFakeUploadQueue([])));

    expect(document.activeElement).toBe(document.body);
  });

  it('iguala la fila a la cola y muestra progreso solo en las subidas en curso', () => {
    renderBlock([
      pendingUploadItem({ id: 'p1', originalName: 'foto-pendiente.jpg' }),
      uploadingUploadItem({ id: 'p2', originalName: 'foto-subiendo.jpg', progress: 62 }),
      errorUploadItem({ id: 'p3', originalName: 'foto-error.jpg' }),
    ]);

    const region = screen.getByRole('region', { name: 'En curso' });
    const rows = within(region).getAllByRole('listitem');

    expect(rows).toHaveLength(3);

    for (const row of rows) {
      expect(row.className).toContain('border-b');
      expect(row.className).toContain('border-border');
      expect(row.className).toContain('last:border-b-0');

      const thumbnail = row.querySelector('div');

      expect(thumbnail?.className).toContain('size-14');
      expect(thumbnail?.className).toContain('rounded-lg');
    }

    expect(within(rows[0] as HTMLElement).queryByRole('progressbar')).toBeNull();
    expect(within(rows[2] as HTMLElement).queryByRole('progressbar')).toBeNull();

    const bars = within(region).getAllByRole('progressbar');

    expect(bars).toHaveLength(1);

    const bar = within(region).getByRole('progressbar', { name: 'Subida de foto-subiendo.jpg' });

    expect(bar.getAttribute('aria-valuenow')).toBe('62');
  });

  it('no crea una región viva propia', () => {
    const { container } = renderBlock([pendingUploadItem()]);

    expect(container.querySelector('[aria-live]')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('no tiene violaciones de axe', async () => {
    const { container } = renderBlock([
      pendingUploadItem(),
      uploadingUploadItem(),
      errorUploadItem(),
    ]);

    await expectNoAxeViolations(container);
  });
});
