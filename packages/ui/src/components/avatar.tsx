import { initialsOf, cn } from './utils';
import { VisuallyHidden } from './visually-hidden';

export type AvatarSize = 24 | 28 | 32 | 40 | 44 | 48 | 56 | 64;

export type AvatarAccent = 'violet' | 'pink' | 'green' | 'orange' | 'sky';

export interface AvatarProps {
  readonly name: string;
  readonly src?: string | undefined;
  /** Diámetro en px. Del diseño: 24–64. */
  readonly size?: AvatarSize;
  /** Acento de identidad. Por defecto, estable a partir del nombre. */
  readonly accent?: AvatarAccent | undefined;
  /** Si se pasa, el avatar se convierte en un botón con área táctil de 44 px. */
  readonly onPress?: () => void;
  /**
   * Decorativo: sin nombre accesible, para filas donde el nombre ya está en
   * texto. Tiene prioridad sobre `onPress` (un botón `aria-hidden` sería un
   * error de accesibilidad).
   */
  readonly decorative?: boolean;
  readonly className?: string;
}

const ACCENTS: readonly AvatarAccent[] = ['violet', 'pink', 'green', 'orange', 'sky'];

const sizeClasses: Record<AvatarSize, string> = {
  24: 'size-6 text-caption',
  28: 'size-7 text-caption',
  32: 'size-8 text-caption',
  40: 'size-10 text-body-sm',
  44: 'size-11 text-body-sm',
  48: 'size-12 text-body',
  56: 'size-14 text-h3',
  64: 'size-16 text-h3',
};

const accentClasses: Record<AvatarAccent, string> = {
  violet: 'bg-accent-violet text-accent-violet-text',
  pink: 'bg-accent-pink text-accent-pink-text',
  green: 'bg-accent-green text-accent-green-text',
  orange: 'bg-accent-orange text-accent-orange-text',
  sky: 'bg-accent-sky text-accent-sky-text',
};

/** Acento estable por nombre, mismo criterio que el hash del contrato. */
export function accentFor(name: string): AvatarAccent {
  let hash = 0;

  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) % 997;
  }

  return ACCENTS[hash % ACCENTS.length] ?? 'violet';
}

/**
 * Avatar con imagen o iniciales.
 *
 * - Con `src`, el `alt` es el nombre.
 * - Sin `src`, el círculo expone `role="img"` y `aria-label` con el nombre.
 * - Interactivo (`onPress`), las iniciales quedan decorativas y el nombre va en
 *   un `VisuallyHidden` dentro del botón: mismo nombre accesible, sin
 *   `aria-label` que choque con el contenido visible (`label-content-name-mismatch`).
 * - `decorative` quita el nombre por completo y pinta `alt=""`/`aria-hidden`.
 */
export function Avatar({
  name,
  src,
  size = 40,
  accent,
  onPress,
  decorative = false,
  className,
}: AvatarProps) {
  const tone = accent ?? accentFor(name);
  const initials = initialsOf(name) || '?';
  const accessibleName = name.trim() ? name : 'Persona sin nombre';
  const interactive = typeof onPress === 'function' && !decorative;

  const circleClasses = cn(
    'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold leading-none',
    sizeClasses[size],
    src ? 'bg-surface-2' : accentClasses[tone],
  );

  const image = (alt: string) => (
    <img src={src} alt={alt} className="size-full object-cover" draggable={false} />
  );

  if (decorative) {
    return (
      <span aria-hidden="true" className={cn('inline-flex shrink-0', className)}>
        <span className={circleClasses}>
          {src ? image('') : <span aria-hidden="true">{initials}</span>}
        </span>
      </span>
    );
  }

  if (interactive && onPress) {
    return (
      <button
        type="button"
        onClick={onPress}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-full',
          'transition-[box-shadow] duration-(--memora-duration-fast) ease-standard',
          'hover:ring-2 hover:ring-primary',
          size >= 44 ? sizeClasses[size] : 'size-11',
          className,
        )}
      >
        <span aria-hidden="true" className={circleClasses}>
          {src ? image('') : initials}
        </span>
        <VisuallyHidden>{accessibleName}</VisuallyHidden>
      </button>
    );
  }

  if (src) {
    return (
      <span className={cn('inline-flex shrink-0', className)}>
        <span className={circleClasses}>{image(accessibleName)}</span>
      </span>
    );
  }

  return (
    <span role="img" aria-label={accessibleName} className={cn('inline-flex shrink-0', className)}>
      <span className={circleClasses}>
        <span aria-hidden="true">{initials}</span>
      </span>
    </span>
  );
}
