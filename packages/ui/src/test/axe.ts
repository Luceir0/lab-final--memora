import axe from 'axe-core';
import { expect } from 'vitest';

export interface AxeFinding {
  readonly id: string;
  readonly impact: string | null;
  readonly help: string;
  readonly nodes: readonly string[];
}

/**
 * Reglas que quedan en `incomplete` en jsdom porque dependen de layout real
 * (tamaño, posición, pintado). La cobertura de navegador real es de F37.
 */
const LAYOUT_DEPENDENT_RULES = new Set([
  'color-contrast',
  'color-contrast-enhanced',
  'target-size',
]);

function toFindings(
  results: readonly {
    readonly id: string;
    readonly impact?: string | null;
    readonly help: string;
    readonly nodes: ReadonlyArray<{ readonly target: readonly unknown[] }>;
  }[],
): readonly AxeFinding[] {
  return results.map((result) => ({
    id: result.id,
    impact: result.impact ?? null,
    help: result.help,
    nodes: result.nodes.map((node) => node.target.map(String).join(' ')),
  }));
}

/**
 * Ejecuta axe sobre un fragmento ya renderizado y falla si hay violaciones
 * **o reglas incompletas no dependientes de layout**.
 *
 * `incomplete` es un aviso, no una violación, pero en jsdom una regla como
 * `label-content-name-mismatch` puede quedar ahí y pasar desapercibida; por eso
 * solo se ignoran las que necesitan medidas reales. El contraste se cubre en
 * `src/styles/contrast.test.ts` sobre los hex de `tokens.css`.
 */
export async function expectNoAxeViolations(container: HTMLElement): Promise<void> {
  const results = await axe.run(container, {
    rules: {
      'color-contrast': { enabled: false },
    },
  });

  const violations = toFindings(results.violations);
  const incomplete = toFindings(results.incomplete).filter(
    (finding) => !LAYOUT_DEPENDENT_RULES.has(finding.id),
  );

  expect(violations, JSON.stringify({ violations, incomplete }, null, 2)).toEqual([]);
  expect(incomplete, JSON.stringify({ violations, incomplete }, null, 2)).toEqual([]);
}
