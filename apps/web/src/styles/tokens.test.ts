import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const webRoot = process.cwd();
const repoRoot = path.resolve(webRoot, '../..');
const uiRoot = path.join(repoRoot, 'packages/ui');
const appCssPath = path.join(webRoot, 'src/styles/app.css');
const uiPackagePath = path.join(uiRoot, 'package.json');

describe('CSS global de la app', () => {
  it('importa Tailwind, tokens, tema y fuentes desde @memora/ui', () => {
    const appCss = readFileSync(appCssPath, 'utf8');

    expect(appCss).toContain("@import 'tailwindcss'");
    expect(appCss).toContain("@import '@memora/ui/tokens.css'");
    expect(appCss).toContain("@import '@memora/ui/theme.css'");
    expect(appCss).toContain("@import '@memora/ui/fonts.css'");
  });

  it('declara @source para los componentes del paquete UI', () => {
    const appCss = readFileSync(appCssPath, 'utf8');

    expect(appCss).toContain('@source');
    expect(appCss).toContain('../../../../packages/ui/src');
  });

  it('no duplica el foco visible: vive en theme.css', () => {
    const appCss = readFileSync(appCssPath, 'utf8');
    const themeCss = readFileSync(path.join(uiRoot, 'src/styles/theme.css'), 'utf8');

    expect(appCss).not.toContain(':focus-visible');
    expect(themeCss).toContain(':focus-visible');
  });

  it('exporta los CSS del sistema visual desde @memora/ui', () => {
    const uiPackage = JSON.parse(readFileSync(uiPackagePath, 'utf8')) as {
      exports?: Record<string, unknown>;
    };

    expect(uiPackage.exports?.['./tokens.css']).toBe('./src/styles/tokens.css');
    expect(uiPackage.exports?.['./theme.css']).toBe('./src/styles/theme.css');
    expect(uiPackage.exports?.['./fonts.css']).toBe('./src/styles/fonts.css');
  });

  it('no usa ningún preset JS de Tailwind ni configuración de PostCSS', () => {
    const configNames = [
      'tailwind.config.ts',
      'tailwind.config.js',
      'tailwind.config.mjs',
      'tailwind.config.cjs',
      'postcss.config.ts',
      'postcss.config.js',
      'postcss.config.mjs',
      'postcss.config.cjs',
    ];
    const roots = [repoRoot, webRoot, uiRoot];

    for (const root of roots) {
      for (const name of configNames) {
        const candidate = path.join(root, name);
        expect(existsSync(candidate), `No debería existir ${candidate}`).toBe(false);
      }
    }
  });
});
