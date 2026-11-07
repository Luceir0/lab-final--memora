import type { UserDto } from '@memora/shared';
import { Avatar } from '@memora/ui';
import { useId } from 'react';

export interface TagListProps {
  readonly tags: readonly UserDto[];
  readonly className?: string | undefined;
}

/**
 * Personas etiquetadas en la foto (F32).
 *
 * No renderiza nada si no hay etiquetas: el panel no debe reservar espacio en
 * las fotos sin personas. La lista es semántica y el encabezado da contexto
 * al lector de pantalla sin competir con el título del visor.
 */
export function TagList({ tags, className }: TagListProps) {
  const titleId = useId();

  if (tags.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby={titleId} className={className} data-testid="photo-tag-list">
      <h3 id={titleId} className="text-body-sm font-semibold text-text">
        Personas etiquetadas
      </h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <li key={tag.id}>
            <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-surface-2 py-1 pl-1 pr-3">
              <Avatar name={tag.name} src={tag.avatarUrl ?? undefined} size={24} decorative />
              <span className="truncate text-body-sm text-text">{tag.name}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
