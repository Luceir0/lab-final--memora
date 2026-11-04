import { describe, expect, it } from 'vitest';

import { Route as CirclesRoute } from './_app.circles';
import { Route as CirclesIndexRoute } from './_app.circles.index';
import { Route as NewCircleRoute } from './_app.circles.new';

async function headTitle(route: { options: { head?: unknown } }): Promise<string> {
  const head = route.options.head;

  if (typeof head !== 'function') {
    throw new Error('La ruta no define head');
  }

  const result = (await head({} as never)) as { meta?: Array<{ title?: string }> } | undefined;

  return result?.meta?.find((meta) => meta.title !== undefined)?.title ?? '';
}

describe('rutas de círculos', () => {
  it('el layout es SPA y no se renderiza en servidor', () => {
    expect(CirclesRoute.options.ssr).toBe(false);
  });

  it('la lista y el alta declaran título propio', async () => {
    expect(await headTitle(CirclesIndexRoute)).toBe('Mis círculos · Memora');
    expect(await headTitle(NewCircleRoute)).toBe('Nuevo círculo · Memora');
  });
});
