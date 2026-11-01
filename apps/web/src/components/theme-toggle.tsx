import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { useId } from 'react';

import { useTheme } from './theme-provider';
import type { ThemeMode } from '../lib/theme';

interface ThemeOption {
  readonly mode: ThemeMode;
  readonly label: string;
  readonly Icon: LucideIcon;
}

const OPTIONS: readonly ThemeOption[] = [
  { mode: 'light', label: 'Claro', Icon: Sun },
  { mode: 'dark', label: 'Oscuro', Icon: Moon },
  { mode: 'system', label: 'Sistema', Icon: Monitor },
];

/**
 * Control de apariencia (Claro / Oscuro / Sistema).
 *
 * Provisional: F11/F34 lo integrarán en Perfil y en el shell. Usa radios
 * nativos dentro de un `radiogroup`, con etiquetas visibles, iconos decorativos
 * y área táctil de 44 px. Solo tokens: ningún color literal.
 */
export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const groupId = useId();
  const titleId = `${groupId}-title`;
  const descriptionId = `${groupId}-description`;
  const helpId = `${groupId}-help`;
  const name = `${groupId}-appearance`;

  return (
    <section aria-labelledby={titleId}>
      <h2 id={titleId} className="text-h3 font-bold text-text">
        Apariencia
      </h2>
      <p id={descriptionId} className="mt-1 text-body-sm text-muted">
        Elige cómo quieres ver Memora.
      </p>

      <div
        role="radiogroup"
        aria-labelledby={titleId}
        aria-describedby={`${descriptionId} ${helpId}`}
        className="mt-3 flex gap-1 rounded-lg bg-surface-2 p-1"
      >
        {OPTIONS.map(({ mode: optionMode, label, Icon }) => (
          /* El input es sr-only: replicamos aquí el foco global de theme.css. */
          <label
            key={optionMode}
            className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1 rounded-md border border-transparent px-2 text-body-sm font-medium text-muted transition-colors hover:text-text has-[:checked]:border-primary has-[:checked]:bg-surface has-[:checked]:font-semibold has-[:checked]:text-text has-[:checked]:shadow-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus"
          >
            <input
              type="radio"
              name={name}
              value={optionMode}
              checked={mode === optionMode}
              onChange={() => setMode(optionMode)}
              className="sr-only"
            />
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <p id={helpId} className="mt-2 text-body-sm text-muted">
        «Sistema» sigue el modo de tu teléfono o equipo.
      </p>
    </section>
  );
}
