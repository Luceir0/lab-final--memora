import { describe, expect, it } from 'vitest';

import tokensCss from './tokens.css?raw';

function declarations(css: string, selectorPattern: RegExp): Map<string, string> {
  const block = css.match(selectorPattern)?.[1];

  if (!block) {
    throw new Error(`No se encontró el bloque ${selectorPattern}`);
  }

  const result = new Map<string, string>();

  for (const match of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    const [, name, value] = match;

    if (name && value) {
      result.set(name, value.trim());
    }
  }

  return result;
}

const light = declarations(tokensCss, /:root\s*\{([\s\S]*?)\n\}/);
const dark = declarations(tokensCss, /\[data-theme='dark'\]\s*\{([\s\S]*?)\n\}/);

function inlineTheme(): Map<string, string> {
  return declarations(tokensCss, /@theme inline\s*\{([\s\S]*?)\n\}/);
}

describe('contrato de tokens', () => {
  it('define los colores semánticos en claro y oscuro', () => {
    expect(light.get('--memora-bg')).toBe('#f6f6fa');
    expect(light.get('--memora-text')).toBe('#14132b');
    expect(light.get('--memora-primary')).toBe('#5b47e0');
    expect(light.get('--memora-focus')).toBe('#7c6cf2');

    expect(dark.get('--memora-bg')).toBe('#0b0f1e');
    expect(dark.get('--memora-text')).toBe('#eef0fa');
    expect(dark.get('--memora-primary')).toBe('#6a58f0');
    expect(dark.get('--memora-focus')).toBe('#a99cff');
  });

  it('define los tres tokens de texto de estado en ambos temas', () => {
    expect(light.get('--memora-success-text')).toBe('#145c3d');
    expect(light.get('--memora-warning-text')).toBe('#8a4510');
    expect(light.get('--memora-info-text')).toBe('#1c4f8a');

    expect(dark.get('--memora-success-text')).toBe('#4cc38a');
    expect(dark.get('--memora-warning-text')).toBe('#f0a04b');
    expect(dark.get('--memora-info-text')).toBe('#6fa4ff');
  });

  it('mapea los tres textos de estado en @theme inline', () => {
    const theme = inlineTheme();

    expect(theme.get('--color-success-text')).toBe('var(--memora-success-text)');
    expect(theme.get('--color-warning-text')).toBe('var(--memora-warning-text)');
    expect(theme.get('--color-info-text')).toBe('var(--memora-info-text)');
  });

  it('mapea radios, sombras y tipografía sin autorreferencias', () => {
    const theme = inlineTheme();

    expect(theme.get('--radius-xl')).toBe('var(--memora-radius-xl)');
    expect(theme.get('--shadow-md')).toBe('var(--memora-shadow-md)');
    expect(theme.get('--text-h1')).toBe('var(--memora-text-h1)');
    expect(theme.get('--font-sans')).toBe('var(--memora-font-sans)');

    for (const [name, value] of theme) {
      expect(value, `${name} se referencia a sí mismo`).not.toBe(`var(${name})`);
    }
  });

  it('define los breakpoints de Memora en un @theme no inline', () => {
    const block = tokensCss.match(/@theme\s*\{([\s\S]*?)\n\}/)?.[1];

    expect(block).toBeDefined();
    expect(block).toContain('--breakpoint-sm: 30rem;');
    expect(block).toContain('--breakpoint-md: 48rem;');
    expect(block).toContain('--breakpoint-lg: 64rem;');
    expect(block).toContain('--breakpoint-xl: 80rem;');
    expect(block).toContain('--breakpoint-2xl: initial;');
    expect(block).not.toContain('inline');
  });

  it('reduce el h1 a 26/32 px por debajo de 480 px', () => {
    const mobile = tokensCss.match(/@media \(max-width: 29\.99rem\)\s*\{([\s\S]*?)\n\}/)?.[1];

    expect(mobile).toBeDefined();
    expect(mobile).toContain('--memora-text-h1: 1.625rem;');
    expect(mobile).toContain('--memora-text-h1--line-height: 2rem;');
  });

  it('define las capas y las expone como utilidades z-index', () => {
    expect(light.get('--memora-z-nav')).toBe('40');
    expect(light.get('--memora-z-sheet')).toBe('60');
    expect(light.get('--memora-z-modal')).toBe('70');
    expect(light.get('--memora-z-toast')).toBe('80');

    const theme = inlineTheme();
    expect(theme.get('--z-index-nav')).toBe('var(--memora-z-nav)');
    expect(theme.get('--z-index-sheet')).toBe('var(--memora-z-sheet)');
    expect(theme.get('--z-index-modal')).toBe('var(--memora-z-modal)');
    expect(theme.get('--z-index-toast')).toBe('var(--memora-z-toast)');
  });

  it('conserva los radios y las sombras del contrato', () => {
    expect(light.get('--memora-radius-sm')).toBe('8px');
    expect(light.get('--memora-radius-md')).toBe('12px');
    expect(light.get('--memora-radius-lg')).toBe('16px');
    expect(light.get('--memora-radius-xl')).toBe('24px');
    expect(light.get('--memora-radius-2xl')).toBe('32px');
    expect(light.get('--memora-radius-full')).toBe('999px');

    expect(light.get('--memora-shadow-sm')).toMatch(/^0 1px 2px rgba/);
    expect(light.get('--memora-shadow-md')).toMatch(/^0 4px 12px rgba/);
    expect(dark.get('--memora-shadow-lg')).toBe('0 16px 40px rgba(0, 0, 0, 0.45)');
  });
});
