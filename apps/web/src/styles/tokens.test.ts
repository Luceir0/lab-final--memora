import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const webRoot = process.cwd();
const repoRoot = path.resolve(webRoot, '../..');
const uiRoot = path.join(repoRoot, 'packages/ui');
const tokensPath = path.join(uiRoot, 'src/styles/tokens.css');
const appCssPath = path.join(webRoot, 'src/styles/app.css');
const uiPackagePath = path.join(uiRoot, 'package.json');

describe('tokens de diseño', () => {
  it('define tokens semánticos de runtime en claro y oscuro y los mapea con @theme inline', () => {
    const tokensCss = readFileSync(tokensPath, 'utf8');

    expect(tokensCss).toContain('@theme inline');
    expect(tokensCss).toMatch(/--memora-bg:\s*#f6f6fa/i);
    expect(tokensCss).toContain("[data-theme='dark']");
    expect(tokensCss).toMatch(/\[data-theme='dark'\]\s*\{[\s\S]*--memora-bg:\s*#0b0f1e/i);
    expect(tokensCss).toMatch(/--memora-radius-xl:\s*24px/);
    expect(tokensCss).toMatch(/--memora-shadow-md:/);

    expect(tokensCss).toMatch(/--color-bg:\s*var\(--memora-bg\)/);
    expect(tokensCss).toMatch(/--radius-xl:\s*var\(--memora-radius-xl\)/);
    expect(tokensCss).toMatch(/--shadow-md:\s*var\(--memora-shadow-md\)/);
  });

  it('no genera autorreferencias en @theme inline', () => {
    const tokensCss = readFileSync(tokensPath, 'utf8');

    expect(tokensCss).not.toMatch(/--color-bg:\s*var\(--color-bg\)/);
    expect(tokensCss).not.toMatch(/--radius-xl:\s*var\(--radius-xl\)/);
    expect(tokensCss).not.toMatch(/--shadow-md:\s*var\(--shadow-md\)/);
  });

  it('importa Tailwind y los tokens desde el CSS de la app, con @source del paquete UI', () => {
    const appCss = readFileSync(appCssPath, 'utf8');

    expect(appCss).toContain("@import 'tailwindcss'");
    expect(appCss).toContain("@import '@memora/ui/tokens.css'");
    expect(appCss).toContain('@source');
    expect(appCss).toContain('../../../../packages/ui/src');
  });

  it('exporta los tokens desde @memora/ui', () => {
    const uiPackage = JSON.parse(readFileSync(uiPackagePath, 'utf8')) as {
      exports?: Record<string, unknown>;
    };

    expect(uiPackage.exports?.['./tokens.css']).toBe('./src/styles/tokens.css');
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
