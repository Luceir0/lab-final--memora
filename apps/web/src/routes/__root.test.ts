import { describe, expect, it } from 'vitest';

import { Route } from './__root';

describe('head de la ruta raíz', () => {
  it('declara viewport-fit=cover para que existan las safe areas', async () => {
    const head = Route.options.head;

    if (typeof head !== 'function') {
      throw new Error('La ruta raíz no define head');
    }

    const result = await head({} as never);

    expect(JSON.stringify(result?.meta)).toContain('viewport-fit=cover');
  });
});
