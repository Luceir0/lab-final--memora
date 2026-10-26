import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { readHelpContent, resolveSnapshotPath, sortByOrder } from './content.server';

const GENERIC_ERROR =
  'No se pudo leer el snapshot de Content Island. Revisa CONTENT_ISLAND_SNAPSHOT_PATH o regenera el snapshot.';

function isMonotonic(orders: number[]): boolean {
  return orders.every((order, index) => index === 0 || (orders[index - 1] ?? 0) <= order);
}

async function captureError(promise: Promise<unknown>): Promise<Error> {
  const result = await promise.then(
    () => null,
    (error: unknown) => error,
  );

  expect(result).toBeInstanceOf(Error);
  return result as Error;
}

describe('sortByOrder', () => {
  it('ordena una lista desordenada por order sin mutar la original', () => {
    const input = [
      { id: 'c', order: 3 },
      { id: 'a', order: 1 },
      { id: 'b', order: 2 },
    ];

    const sorted = sortByOrder(input);

    expect(sorted.map((item) => item.id)).toEqual(['a', 'b', 'c']);
    expect(input.map((item) => item.id)).toEqual(['c', 'a', 'b']);
  });
});

describe('readHelpContent', () => {
  it('lee el snapshot real con artículos y preguntas ordenados por order', async () => {
    const { articles, faqs } = await readHelpContent();

    expect(articles.length).toBeGreaterThanOrEqual(1);
    expect(faqs.length).toBeGreaterThanOrEqual(1);

    const articleOrders = articles.map((article) => article.order);
    expect(isMonotonic(articleOrders)).toBe(true);

    const faqOrders = faqs.map((faq) => faq.order);
    expect(isMonotonic(faqOrders)).toBe(true);

    expect(articles.some((article) => article.title === 'Primeros pasos en Memora')).toBe(true);
  });

  it('resuelve el snapshot por defecto desde el cwd de apps/web', () => {
    expect(resolveSnapshotPath()).toBe(
      path.resolve(process.cwd(), '../../content-island-snapshot.json'),
    );
  });

  it('falla con un mensaje genérico, sin ruta, cuando el snapshot no existe', async () => {
    const missingPath = resolveSnapshotPath('/snapshot-que-no-existe.json');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const error = await captureError(readHelpContent(missingPath));

      expect(error.message).toBe(GENERIC_ERROR);
      expect(error.message).not.toContain(missingPath);
      expect(errorSpy).toHaveBeenCalled();
      expect(errorSpy.mock.calls.some((call) => String(call[0]).includes(missingPath))).toBe(true);
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('rechaza un snapshot no publicado sin filtrar la ruta en el mensaje', async () => {
    const realSnapshotPath = resolveSnapshotPath();
    const snapshot = JSON.parse(readFileSync(realSnapshotPath, 'utf8')) as {
      meta: { view: 'published' | 'preview' };
    };
    snapshot.meta.view = 'preview';

    const tempDir = mkdtempSync(path.join(tmpdir(), 'memora-f05-snapshot-'));
    const previewPath = path.join(tempDir, 'preview.json');
    writeFileSync(previewPath, JSON.stringify(snapshot), 'utf8');

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const error = await captureError(readHelpContent(previewPath));

      expect(error.message).toBe(GENERIC_ERROR);
      expect(error.message).not.toContain(previewPath);
      expect(errorSpy).toHaveBeenCalled();
      expect(errorSpy.mock.calls.some((call) => String(call[0]).includes(previewPath))).toBe(true);
    } finally {
      errorSpy.mockRestore();
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
