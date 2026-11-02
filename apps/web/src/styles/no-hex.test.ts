import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { THEME_COLORS } from '../lib/theme';

const webRoot = process.cwd();
const repoRoot = path.resolve(webRoot, '../..');
const sourceRoots = [path.join(webRoot, 'src'), path.join(repoRoot, 'packages/ui/src')];
const themeFile = path.join(webRoot, 'src/lib/theme.ts');

const COLOR_PATTERNS = [/#[0-9a-f]{3,8}\b/gi, /\b(?:rgb|rgba|hsl|hsla|oklch)\(/gi];

function sourceFiles(directory: string): readonly string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return sourceFiles(fullPath);
    }

    return entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') ? [fullPath] : [];
  });
}

describe('guard anti-hex', () => {
  it('no hay colores literales (hex/rgb/hsl/oklch) en el código fuente (solo lib/theme.ts)', () => {
    const offenders = sourceRoots
      .flatMap((root) => sourceFiles(root))
      .filter((file) => !/\.test\.tsx?$/.test(file))
      .filter((file) => file !== themeFile)
      .flatMap((file) => {
        const content = readFileSync(file, 'utf8');

        return COLOR_PATTERNS.flatMap((pattern) =>
          [...content.matchAll(new RegExp(pattern.source, pattern.flags))].map(
            (match) => `${path.relative(repoRoot, file)}: ${match[0]}`,
          ),
        );
      });

    expect(offenders).toEqual([]);
  });

  it('THEME_COLORS coincide con --memora-bg de tokens.css', () => {
    const tokensCss = readFileSync(
      path.join(repoRoot, 'packages/ui/src/styles/tokens.css'),
      'utf8',
    );
    const light = tokensCss.match(/:root\s*\{[\s\S]*?--memora-bg:\s*(#[0-9a-f]{6})/i)?.[1];
    const dark = tokensCss.match(
      /\[data-theme='dark'\]\s*\{[\s\S]*?--memora-bg:\s*(#[0-9a-f]{6})/i,
    )?.[1];

    expect(light?.toLowerCase()).toBe(THEME_COLORS.light.toLowerCase());
    expect(dark?.toLowerCase()).toBe(THEME_COLORS.dark.toLowerCase());
  });
});
