import { Avatar, type AvatarAccent, type AvatarSize } from './avatar';
import { cn } from './utils';

export interface AvatarGroupItem {
  readonly name: string;
  readonly src?: string | undefined;
  readonly accent?: AvatarAccent | undefined;
}

export interface AvatarGroupProps {
  readonly avatars: readonly AvatarGroupItem[];
  /** Avatares visibles antes del contador. Por defecto, 4. */
  readonly max?: number;
  readonly size?: AvatarSize;
  readonly className?: string;
}

const counterSizeClasses: Record<AvatarSize, string> = {
  24: 'size-6 text-caption',
  28: 'size-7 text-caption',
  32: 'size-8 text-caption',
  40: 'size-10 text-body-sm',
  44: 'size-11 text-body-sm',
  48: 'size-12 text-body',
  56: 'size-14 text-h3',
  64: 'size-16 text-h3',
};

/**
 * Grupo de avatares solapados. El grupo anuncia el total («3 personas») y el
 * contador `+N` sigue el `size` del grupo y es decorativo para no duplicar el
 * anuncio.
 */
export function AvatarGroup({ avatars, max = 4, size = 40, className }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const hiddenCount = avatars.length - visible.length;
  const total = avatars.length;

  return (
    <div
      role="group"
      aria-label={`${total} ${total === 1 ? 'persona' : 'personas'}`}
      className={cn('flex items-center', className)}
    >
      {visible.map((avatar, index) => (
        <span
          key={`${avatar.name}-${index}`}
          className={cn('rounded-full ring-2 ring-surface', index > 0 && '-ml-2')}
        >
          <Avatar name={avatar.name} src={avatar.src} accent={avatar.accent} size={size} />
        </span>
      ))}
      {hiddenCount > 0 && (
        <span
          aria-hidden="true"
          className={cn(
            'inline-flex items-center justify-center rounded-full bg-surface-2 font-bold text-muted ring-2 ring-surface',
            '-ml-2',
            counterSizeClasses[size],
          )}
        >
          +{hiddenCount}
        </span>
      )}
    </div>
  );
}
