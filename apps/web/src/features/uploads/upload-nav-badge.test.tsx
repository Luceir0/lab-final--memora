import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  createFakeUploadQueue,
  doneUploadItem,
  errorUploadItem,
  pendingUploadItem,
  uploadingUploadItem,
} from '../../test/fixtures/upload-queue-fixtures';
import { UploadNavBadge } from './upload-nav-badge';
import { UploadQueueContext } from './upload-queue-context';

function renderBadge(items: Parameters<typeof createFakeUploadQueue>[0] = []) {
  const queue = createFakeUploadQueue(items);

  const result = render(
    <UploadQueueContext.Provider value={queue}>
      <a href="/uploads">
        Subidas
        <UploadNavBadge />
      </a>
    </UploadQueueContext.Provider>,
  );

  return { ...result, queue };
}

function badgeText(): string | null {
  const link = screen.getByRole('link');

  return link.querySelector('[aria-hidden="true"]')?.textContent ?? null;
}

describe('UploadNavBadge', () => {
  it('cuenta pendientes y en curso, y lo suma al nombre accesible del enlace', () => {
    renderBadge([
      pendingUploadItem({ id: 'p1' }),
      pendingUploadItem({ id: 'p2' }),
      uploadingUploadItem({ id: 'u1' }),
      errorUploadItem({ id: 'e1' }),
      doneUploadItem({ id: 'd1' }),
    ]);

    expect(screen.getByRole('link', { name: 'Subidas, 3 en curso' })).toBeTruthy();
    expect(badgeText()).toBe('3');
  });

  it('se oculta en cero y deja el nombre del enlace sin contador', () => {
    const { container } = renderBadge([doneUploadItem(), errorUploadItem()]);

    expect(screen.getByRole('link', { name: 'Subidas' })).toBeTruthy();
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    expect(container.textContent).toBe('Subidas');
  });

  it('no cuenta las subidas fallidas ni las completadas', () => {
    renderBadge([
      errorUploadItem({ id: 'e1' }),
      errorUploadItem({ id: 'e2' }),
      doneUploadItem({ id: 'd1' }),
      doneUploadItem({ id: 'd2' }),
      pendingUploadItem({ id: 'p1' }),
    ]);

    expect(screen.getByRole('link', { name: 'Subidas, 1 en curso' })).toBeTruthy();
    expect(badgeText()).toBe('1');
  });

  it('limita lo visible y el nombre accesible a «99+» al superar el tope', () => {
    const items = Array.from({ length: 120 }, (_, index) =>
      pendingUploadItem({ id: `p${index}`, originalName: `foto-${index}.jpg` }),
    );

    renderBadge(items);

    expect(screen.getByRole('link', { name: 'Subidas, 99+ en curso' })).toBeTruthy();
    expect(badgeText()).toBe('99+');
  });

  it('usa una píldora neutra alineada al final en escritorio', () => {
    renderBadge([pendingUploadItem({ id: 'p1' })]);

    const pill = screen.getByRole('link').querySelector('[aria-hidden="true"]');

    expect(pill?.className).toContain('bg-surface-2');
    expect(pill?.className).toContain('text-muted');
    expect(pill?.className).toContain('lg:ml-auto');
    expect(pill?.className).not.toContain('bg-primary');
  });

  it('no renderiza nada fuera de un enlace cuando no hay subidas activas', () => {
    const { container } = render(
      <UploadQueueContext.Provider value={createFakeUploadQueue()}>
        <UploadNavBadge />
      </UploadQueueContext.Provider>,
    );

    expect(container.firstChild).toBeNull();
  });
});
