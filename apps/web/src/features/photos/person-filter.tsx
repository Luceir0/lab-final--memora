import type { MemberDto } from '@memora/shared';
import { Avatar, Chip, Skeleton } from '@memora/ui';

export interface PersonFilterProps {
  readonly members: readonly MemberDto[];
  readonly selectedId: string | null;
  readonly onSelect: (userId: string | null) => void;
  readonly loading?: boolean;
  readonly className?: string | undefined;
}

/**
 * Filtro por persona del álbum.
 *
 * Solo lista miembros del círculo (AC-03): la lista sale de
 * `GET /circles/:circleId/members` y el `personId` que llega al servidor se
 * valida allí. El contador es el «Aparece en» del contrato de miembros, no un
 * recuento del cliente.
 */
export function PersonFilter({
  members,
  selectedId,
  onSelect,
  loading = false,
  className,
}: PersonFilterProps) {
  if (loading) {
    return (
      <div aria-busy="true" className={className}>
        <p role="status" className="sr-only">
          Cargando personas…
        </p>
        <div aria-hidden="true" className="flex gap-2 overflow-x-auto pb-1">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} shape="rect" className="h-9 w-28 shrink-0 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return null;
  }

  return (
    <div
      role="group"
      aria-label="Filtrar las fotos por persona"
      className={`flex gap-2 overflow-x-auto px-0.5 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className ?? ''}`}
    >
      <Chip selected={selectedId === null} onClick={() => onSelect(null)}>
        Todas
      </Chip>

      {members.map((member) => (
        <Chip
          key={member.user.id}
          selected={selectedId === member.user.id}
          onClick={() => onSelect(member.user.id)}
          avatar={
            <Avatar
              name={member.user.name}
              src={member.user.avatarUrl ?? undefined}
              size={24}
              decorative
            />
          }
        >
          <span className="truncate">{member.user.name}</span>
          <span className="tabular-nums text-muted">{member.photosCount}</span>
        </Chip>
      ))}
    </div>
  );
}
