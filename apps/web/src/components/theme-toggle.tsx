import { IconButton } from '@memora/ui';
import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { useId } from 'react';

import { useTheme } from './theme-provider';
import type { ThemeMode } from '../lib/theme';

export type ThemeToggleVariant = 'section' | 'compact';

export interface ThemeToggleProps {
  /**
   * `section`: grupo de radios con etiquetas (Perfil).
   * `compact`: botón de 44 px que cicla Claro → Oscuro → Sistema (cabeceras).
   */
  readonly variant?: ThemeToggleVariant;
}

const MODES: readonly ThemeMode[] = ['light', 'dark', 'system'];

const LABELS: Readonly<Record<ThemeMode, string>> = {
  light: 'Claro',
  dark: 'Oscuro',
  system: 'Sistema',
};

const ICONS: Readonly<Record<ThemeMode, LucideIcon>> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const NEXT_MODE: Readonly<Record<ThemeMode, ThemeMode>> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
};

/**
 * Control de apariencia. Dos variantes comparten `useTheme` y las mismas
 * opciones; no hay una segunda implementación del tema.
 */
export function ThemeToggle({ variant = 'section' }: ThemeToggleProps) {
  return variant === 'compact' ? <CompactThemeToggle /> : <SectionThemeToggle />;
}

function SectionThemeToggle() {
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
        {MODES.map((optionMode) => {
          const Icon = ICONS[optionMode];

          return (
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
              <span>{LABELS[optionMode]}</span>
            </label>
          );
        })}
      </div>

      <p id={helpId} className="mt-2 text-body-sm text-muted">
        «Sistema» sigue el modo de tu teléfono o equipo.
      </p>
    </section>
  );
}

function CompactThemeToggle() {
  const { mode, setMode } = useTheme();
  const Icon = ICONS[mode];
  const next = NEXT_MODE[mode];

  return (
    <IconButton
      variant="ghost"
      label={`Apariencia: ${LABELS[mode]}. Cambiar a ${LABELS[next]}.`}
      icon={<Icon aria-hidden="true" className="size-5" />}
      onClick={() => setMode(next)}
    />
  );
}
