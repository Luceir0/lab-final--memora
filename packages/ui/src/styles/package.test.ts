import { describe, expect, it } from 'vitest';

import uiPackageRaw from '../../package.json?raw';

const uiPackage = JSON.parse(uiPackageRaw) as {
  exports?: Record<string, unknown>;
  scripts?: Record<string, string>;
};

describe('paquete @memora/ui', () => {
  it('exporta los tres CSS del sistema visual', () => {
    expect(uiPackage.exports?.['./tokens.css']).toBe('./src/styles/tokens.css');
    expect(uiPackage.exports?.['./theme.css']).toBe('./src/styles/theme.css');
    expect(uiPackage.exports?.['./fonts.css']).toBe('./src/styles/fonts.css');
  });

  it('tiene script de test para el contrato de estilos', () => {
    expect(uiPackage.scripts?.test).toBe('vitest run');
  });
});
