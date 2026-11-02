import { describe, expect, it } from 'vitest';

import tokensCss from './tokens.css?raw';

/**
 * Contraste WCAG 2.2 calculado sobre los hex reales de `tokens.css`.
 *
 * Umbrales del contrato (`docs/02-design/accessibility.md`):
 * - texto normal ≥ 4.5:1 (AA) y 7:1 (AAA) cuando se cumple;
 * - componentes gráficos y anillo de foco ≥ 3:1.
 */

type Theme = 'light' | 'dark';
type TokenMap = ReadonlyMap<string, string>;

function declarations(selectorPattern: RegExp): TokenMap {
  const block = tokensCss.match(selectorPattern)?.[1];

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

const themes: Record<Theme, TokenMap> = {
  light: declarations(/:root\s*\{([\s\S]*?)\n\}/),
  dark: declarations(/\[data-theme='dark'\]\s*\{([\s\S]*?)\n\}/),
};

function requireColor(theme: Theme, token: string): string {
  const value = themes[theme].get(token);

  if (!value || !/^#[0-9a-f]{6}$/i.test(value)) {
    throw new Error(`Token ${token} de ${theme} no es un hex de 6 dígitos: ${String(value)}`);
  }

  return value;
}

function channels(hex: string): [number, number, number] {
  const value = hex.slice(1);

  return [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16)) as [
    number,
    number,
    number,
  ];
}

function linear(channel: number): number {
  const normalized = channel / 255;

  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const [red, green, blue] = channels(hex).map(linear) as [number, number, number];

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastRatio(foreground: string, background: string): number {
  const first = luminance(foreground);
  const second = luminance(background);

  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

interface Pair {
  readonly label: string;
  readonly theme: Theme;
  readonly foreground: string;
  readonly background: string;
  readonly minimum: number;
}

const textPairs: readonly Pair[] = [
  {
    label: 'texto sobre fondo',
    theme: 'light',
    foreground: '--memora-text',
    background: '--memora-bg',
    minimum: 4.5,
  },
  {
    label: 'texto sobre fondo',
    theme: 'dark',
    foreground: '--memora-text',
    background: '--memora-bg',
    minimum: 4.5,
  },
  {
    label: 'texto secundario sobre fondo',
    theme: 'light',
    foreground: '--memora-muted',
    background: '--memora-bg',
    minimum: 4.5,
  },
  {
    label: 'texto secundario sobre fondo',
    theme: 'dark',
    foreground: '--memora-muted',
    background: '--memora-bg',
    minimum: 4.5,
  },
  {
    label: 'texto de acción sobre fondo',
    theme: 'light',
    foreground: '--memora-primary-text',
    background: '--memora-bg',
    minimum: 4.5,
  },
  {
    label: 'texto de acción sobre fondo',
    theme: 'dark',
    foreground: '--memora-primary-text',
    background: '--memora-bg',
    minimum: 4.5,
  },
  {
    label: 'texto sobre acción principal',
    theme: 'light',
    foreground: '--memora-on-primary',
    background: '--memora-primary',
    minimum: 4.5,
  },
  {
    label: 'texto sobre acción principal',
    theme: 'dark',
    foreground: '--memora-on-primary',
    background: '--memora-primary',
    minimum: 4.5,
  },
  {
    label: 'texto de éxito sobre su fondo suave',
    theme: 'light',
    foreground: '--memora-success-text',
    background: '--memora-success-soft',
    minimum: 4.5,
  },
  {
    label: 'texto de éxito sobre su fondo suave',
    theme: 'dark',
    foreground: '--memora-success-text',
    background: '--memora-success-soft',
    minimum: 4.5,
  },
  {
    label: 'texto de aviso sobre su fondo suave',
    theme: 'light',
    foreground: '--memora-warning-text',
    background: '--memora-warning-soft',
    minimum: 4.5,
  },
  {
    label: 'texto de aviso sobre su fondo suave',
    theme: 'dark',
    foreground: '--memora-warning-text',
    background: '--memora-warning-soft',
    minimum: 4.5,
  },
  {
    label: 'texto de información sobre su fondo suave',
    theme: 'light',
    foreground: '--memora-info-text',
    background: '--memora-info-soft',
    minimum: 4.5,
  },
  {
    label: 'texto de información sobre su fondo suave',
    theme: 'dark',
    foreground: '--memora-info-text',
    background: '--memora-info-soft',
    minimum: 4.5,
  },
  {
    label: 'texto de peligro sobre su fondo suave',
    theme: 'light',
    foreground: '--memora-danger-text',
    background: '--memora-danger-soft',
    minimum: 4.5,
  },
  {
    label: 'texto de peligro sobre su fondo suave',
    theme: 'dark',
    foreground: '--memora-danger-text',
    background: '--memora-danger-soft',
    minimum: 4.5,
  },
];

const graphicalPairs: readonly Pair[] = [
  {
    label: 'anillo de foco sobre fondo',
    theme: 'light',
    foreground: '--memora-focus',
    background: '--memora-bg',
    minimum: 3,
  },
  {
    label: 'anillo de foco sobre fondo',
    theme: 'dark',
    foreground: '--memora-focus',
    background: '--memora-bg',
    minimum: 3,
  },
  {
    label: 'anillo de foco sobre superficie',
    theme: 'light',
    foreground: '--memora-focus',
    background: '--memora-surface',
    minimum: 3,
  },
  {
    label: 'anillo de foco sobre superficie',
    theme: 'dark',
    foreground: '--memora-focus',
    background: '--memora-surface',
    minimum: 3,
  },
  {
    label: 'acción principal como componente gráfico',
    theme: 'light',
    foreground: '--memora-primary',
    background: '--memora-bg',
    minimum: 3,
  },
  {
    label: 'acción principal como componente gráfico',
    theme: 'dark',
    foreground: '--memora-primary',
    background: '--memora-bg',
    minimum: 3,
  },
  {
    label: 'borde de selección sobre superficie 2',
    theme: 'light',
    foreground: '--memora-primary',
    background: '--memora-surface-2',
    minimum: 3,
  },
  {
    label: 'borde de selección sobre superficie 2',
    theme: 'dark',
    foreground: '--memora-primary',
    background: '--memora-surface-2',
    minimum: 3,
  },
  // F11: `--memora-border-strong` delimita controles (inputs, chips), así que
  // necesita 3:1 sobre las tres superficies donde se dibuja.
  ...(['light', 'dark'] as const).flatMap((theme) =>
    ['--memora-bg', '--memora-surface', '--memora-surface-2'].map((background) => ({
      label: `borde fuerte sobre ${background.replace('--memora-', '')}`,
      theme,
      foreground: '--memora-border-strong',
      background,
      minimum: 3,
    })),
  ),
];

/** Acentos de identidad: texto sobre su propio fondo (avatares y etiquetas). */
const identityPairs: readonly Pair[] = (['violet', 'pink', 'green', 'orange', 'sky'] as const).map(
  (accent) => ({
    label: `texto de acento ${accent}`,
    theme: 'light',
    foreground: `--memora-accent-${accent}-text`,
    background: `--memora-accent-${accent}`,
    minimum: 4.5,
  }),
);

/** Texto de interfaz sobre fondos de estado y componentes (F11, revisión). */
const uiTextPairs: readonly Pair[] = [
  {
    label: 'texto sobre acción principal en hover (oscuro)',
    theme: 'dark',
    foreground: '--memora-on-primary',
    background: '--memora-primary-hover',
    minimum: 4.5,
  },
  {
    label: 'texto sobre acción principal en hover (claro)',
    theme: 'light',
    foreground: '--memora-on-primary',
    background: '--memora-primary-hover',
    minimum: 4.5,
  },
  {
    label: 'texto sobre fondo suave primario',
    theme: 'light',
    foreground: '--memora-on-primary-soft',
    background: '--memora-primary-soft',
    minimum: 4.5,
  },
  {
    label: 'texto sobre fondo suave primario',
    theme: 'dark',
    foreground: '--memora-on-primary-soft',
    background: '--memora-primary-soft',
    minimum: 4.5,
  },
  {
    label: 'texto sobre peligro',
    theme: 'light',
    foreground: '--memora-on-inverse',
    background: '--memora-danger',
    minimum: 4.5,
  },
  {
    label: 'texto sobre peligro',
    theme: 'dark',
    foreground: '--memora-on-inverse',
    background: '--memora-danger',
    minimum: 4.5,
  },
  {
    label: 'texto sobre peligro en hover',
    theme: 'light',
    foreground: '--memora-on-inverse',
    background: '--memora-danger-text',
    minimum: 4.5,
  },
  {
    label: 'texto sobre peligro en hover',
    theme: 'dark',
    foreground: '--memora-on-inverse',
    background: '--memora-danger-text',
    minimum: 4.5,
  },
  {
    label: 'texto secundario sobre superficie',
    theme: 'light',
    foreground: '--memora-muted',
    background: '--memora-surface',
    minimum: 4.5,
  },
  {
    label: 'texto secundario sobre superficie',
    theme: 'dark',
    foreground: '--memora-muted',
    background: '--memora-surface',
    minimum: 4.5,
  },
  {
    label: 'texto secundario sobre superficie 2',
    theme: 'light',
    foreground: '--memora-muted',
    background: '--memora-surface-2',
    minimum: 4.5,
  },
  {
    label: 'texto secundario sobre superficie 2',
    theme: 'dark',
    foreground: '--memora-muted',
    background: '--memora-surface-2',
    minimum: 4.5,
  },
];

/** Pares añadidos en la revisión de accesibilidad/diseño (2026-11-02). */
const reviewPairs: readonly Pair[] = [
  ...(['light', 'dark'] as const).flatMap((theme) => [
    {
      label: 'texto sobre toast/CTA inversa',
      theme,
      foreground: '--memora-on-inverse',
      background: '--memora-inverse',
      minimum: 4.5,
    },
    {
      label: 'anillo de foco sobre toast/CTA inversa',
      theme,
      foreground: '--memora-on-inverse',
      background: '--memora-inverse',
      minimum: 3,
    },
    {
      label: 'texto sobre CTA inversa deshabilitada',
      theme,
      foreground: '--memora-on-inverse',
      background: '--memora-muted',
      minimum: 4.5,
    },
  ]),
  ...(['light', 'dark'] as const).flatMap((theme) => [
    {
      label: 'texto de peligro sobre fondo suave en hover',
      theme,
      foreground: '--memora-danger-text',
      background: '--memora-danger-soft-hover',
      minimum: 4.5,
    },
    {
      label: 'texto de peligro sobre fondo suave pulsado',
      theme,
      foreground: '--memora-danger-text',
      background: '--memora-danger-soft-active',
      minimum: 4.5,
    },
    {
      label: 'borde de peligro sobre fondo suave',
      theme,
      foreground: '--memora-danger',
      background: '--memora-danger-soft',
      minimum: 3,
    },
  ]),
  ...(['light', 'dark'] as const).flatMap((theme) => [
    {
      label: 'texto sobre acción principal pulsada',
      theme,
      foreground: '--memora-on-primary',
      background: '--memora-primary-active',
      minimum: 4.5,
    },
    {
      label: 'texto sobre fondo suave primario en hover',
      theme,
      foreground: '--memora-on-primary-soft',
      background: '--memora-primary-soft-hover',
      minimum: 4.5,
    },
    {
      label: 'texto sobre fondo suave primario pulsado',
      theme,
      foreground: '--memora-on-primary-soft',
      background: '--memora-primary-soft-active',
      minimum: 4.5,
    },
  ]),
  {
    // En claro el knob se delimita con sombra y borde; en oscuro necesita
    // contraste propio contra la pista.
    label: 'knob del switch sobre la pista (oscuro)',
    theme: 'dark',
    foreground: '--memora-control-knob',
    background: '--memora-surface-2',
    minimum: 3,
  },
  {
    label: 'texto sobre superficie elevada (oscuro)',
    theme: 'dark',
    foreground: '--memora-text',
    background: '--memora-elevated',
    minimum: 4.5,
  },
  ...(['light', 'dark'] as const).flatMap((theme) => [
    {
      label: 'texto sobre superficie activa',
      theme,
      foreground: '--memora-text',
      background: '--memora-surface-active',
      minimum: 4.5,
    },
    {
      label: 'texto de acción sobre superficie activa',
      theme,
      foreground: '--memora-primary-text',
      background: '--memora-surface-active',
      minimum: 4.5,
    },
    {
      label: 'anillo de hover del avatar sobre superficie',
      theme,
      foreground: '--memora-primary',
      background: '--memora-surface',
      minimum: 3,
    },
  ]),
  {
    // El knob claro se delimita con este borde; 1,11:1 no se percibía y se
    // subió a ~2:1 contra el knob y ~1,7:1 contra la pista.
    label: 'borde del knob del switch (claro)',
    theme: 'light',
    foreground: '--memora-control-knob-border',
    background: '--memora-control-knob',
    minimum: 1.5,
  },
  {
    label: 'borde del knob contra la pista (claro)',
    theme: 'light',
    foreground: '--memora-control-knob-border',
    background: '--memora-surface-2',
    minimum: 1.5,
  },
];

describe.each([...textPairs, ...graphicalPairs, ...identityPairs, ...uiTextPairs, ...reviewPairs])(
  'contraste $theme · $label',
  ({ theme, foreground, background, minimum }) => {
    const ratio = contrastRatio(requireColor(theme, foreground), requireColor(theme, background));

    it(`${ratio.toFixed(2)}:1 cumple el mínimo ${minimum}:1`, () => {
      expect(ratio).toBeGreaterThanOrEqual(minimum);
    });
  },
);

describe('informe AAA', () => {
  it('los pares que alcanzan 7:1 se reportan como AAA sin rebajar el umbral AA', () => {
    const aaa = textPairs
      .map((pair) => ({
        ...pair,
        ratio: contrastRatio(
          requireColor(pair.theme, pair.foreground),
          requireColor(pair.theme, pair.background),
        ),
      }))
      .filter((pair) => pair.ratio >= 7);

    // Se actualiza al cambiar los tokens; se compara sin orden para que el
    // informe sea estable ante reordenaciones del array de pares.
    expect(new Set(aaa.map((pair) => `${pair.theme}:${pair.label}`))).toEqual(
      new Set([
        'light:texto sobre fondo',
        'dark:texto sobre fondo',
        'dark:texto secundario sobre fondo',
        'light:texto de acción sobre fondo',
        'dark:texto de acción sobre fondo',
        'dark:texto de peligro sobre su fondo suave',
      ]),
    );
  });
});
