import type { MemberDto } from '@memora/shared';
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  InlineAlert,
  Menu,
  Skeleton,
  VisuallyHidden,
} from '@memora/ui';
import { UserMinus, Users } from 'lucide-react';
import { useId, type RefObject } from 'react';

import { getErrorMessage } from '../../lib/error-message';
import { formatCount } from '../circles/format';

import { formatJoinedAt, formatMemberPhotos, formatRole } from './format';

export interface MemberListProps {
  readonly members: readonly MemberDto[];
  /** Id de la persona autenticada, para «(tú)» y para ocultar quitarse a sí misma. */
  readonly meId: string | null;
  readonly isOwner: boolean;
  readonly totalCount: number;
  readonly loading: boolean;
  readonly error: unknown;
  readonly onRetry: () => void;
  readonly hasMore: boolean;
  readonly loadingMore: boolean;
  readonly onLoadMore: () => void;
  readonly onRemove: (member: MemberDto) => void;
  /** Permite devolver el foco a «Miembros» tras quitar a una persona. */
  readonly headingRef?: RefObject<HTMLHeadingElement | null> | undefined;
}

function canRemoveMember(member: MemberDto, isOwner: boolean, meId: string | null): boolean {
  return isOwner && member.role !== 'owner' && member.user.id !== meId;
}

interface MemberNameProps {
  readonly member: MemberDto;
  readonly meId: string | null;
}

/** Nombre con «(tú)» cuando es la persona autenticada. */
function MemberName({ member, meId }: MemberNameProps) {
  const isSelf = member.user.id === meId;

  return (
    // `block` es lo que hace efectivo el `truncate`: en una fila móvil el
    // padre es un bloque normal y un `span` inline ignoraba `overflow`.
    <span title={member.user.name} className="block min-w-0 truncate font-semibold text-text">
      {member.user.name}
      {isSelf ? <span className="font-normal text-muted"> (tú)</span> : null}
    </span>
  );
}

interface MemberMenuProps {
  readonly member: MemberDto;
  readonly onRemove: (member: MemberDto) => void;
}

function MemberMenu({ member, onRemove }: MemberMenuProps) {
  return (
    <Menu
      label={`Acciones de ${member.user.name}`}
      align="end"
      items={[
        {
          label: 'Quitar del círculo',
          danger: true,
          icon: <UserMinus />,
          onSelect: () => onRemove(member),
        },
      ]}
    />
  );
}

function MemberSkeleton() {
  return (
    <div aria-busy="true" className="mt-3">
      <VisuallyHidden>Cargando miembros</VisuallyHidden>
      <div className="lg:hidden">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
          >
            <Skeleton shape="circle" size="md" />
            <div className="flex-1">
              <Skeleton shape="text" size="md" className="w-2/3" />
              <Skeleton shape="text" size="sm" className="mt-1.5 w-1/3" />
            </div>
            <Skeleton shape="text" size="sm" className="w-16" />
          </div>
        ))}
      </div>
      <div className="hidden lg:block">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-b-0"
          >
            <Skeleton shape="circle" size="md" />
            <Skeleton shape="text" size="md" className="w-1/3" />
            <Skeleton shape="text" size="sm" className="w-20" />
            <Skeleton shape="text" size="sm" className="w-16" />
            <Skeleton shape="text" size="sm" className="w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Lista de miembros: filas en móvil y tabla semántica en escritorio.
 *
 * Los dos árboles existen en el DOM y se alternan con CSS; los tests usan
 * `within`/`data-testid` porque jsdom no aplica Tailwind. El email nunca se
 * pinta: el contrato de miembros no lo expone.
 */
export function MemberList({
  members,
  meId,
  isOwner,
  totalCount,
  loading,
  error,
  onRetry,
  hasMore,
  loadingMore,
  onLoadMore,
  onRemove,
  headingRef,
}: MemberListProps) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="mt-8 min-w-0 lg:mt-2">
      <div className="min-w-0 lg:rounded-xl lg:border lg:border-border lg:bg-surface">
        <h2
          ref={headingRef}
          id={titleId}
          tabIndex={-1}
          className="text-caption font-semibold uppercase text-muted lg:px-4 lg:pt-4 lg:text-h3 lg:font-bold lg:normal-case lg:text-text"
        >
          Miembros{' '}
          <span className="font-semibold text-muted lg:ml-1 lg:text-body-sm">
            · {formatCount(totalCount)}
          </span>
        </h2>

        {error ? (
          <InlineAlert
            tone="danger"
            title="No hemos podido cargar los miembros"
            description={getErrorMessage(error)}
            className="mt-3 lg:mx-4 lg:mb-4 lg:mt-4"
            action={
              <Button variant="secondary" size="sm" onClick={onRetry}>
                Reintentar
              </Button>
            }
          />
        ) : loading ? (
          <MemberSkeleton />
        ) : members.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title="Todavía no hay nadie en este círculo"
            description="Invita a tu gente para empezar a compartir recuerdos."
            headingLevel={3}
            className="mt-6 rounded-xl border border-dashed border-border-strong px-5 py-8 lg:m-4"
          />
        ) : (
          <>
            <ul
              data-testid="members-list-mobile"
              className="mt-3 min-w-0 divide-y divide-border rounded-xl border border-border bg-surface lg:hidden"
            >
              {members.map((member) => {
                const removable = canRemoveMember(member, isOwner, meId);

                return (
                  <li
                    key={member.user.id}
                    className="flex min-w-0 flex-wrap items-center gap-3 px-4 py-3"
                  >
                    <Avatar
                      name={member.user.name}
                      src={member.user.avatarUrl ?? undefined}
                      size={40}
                      decorative
                    />
                    <div className="min-w-0 flex-1">
                      <MemberName member={member} meId={meId} />
                      <p className="text-caption text-muted">{formatRole(member.role)}</p>
                    </div>
                    <span
                      className={
                        member.photosCount === 0
                          ? 'shrink-0 text-caption text-muted'
                          : 'shrink-0 text-body-sm font-semibold text-text lg:text-primary-text'
                      }
                    >
                      {formatMemberPhotos(member.photosCount)}
                    </span>
                    {/*
                     * Hueco fijo de 44 px (el tamaño de `IconButton`) también
                     * cuando no hay menú: así los contadores de fotos quedan
                     * alineados en columna en todas las filas.
                     */}
                    <div
                      data-testid="member-action-slot"
                      className="flex size-11 shrink-0 items-center justify-center"
                    >
                      {removable ? <MemberMenu member={member} onRemove={onRemove} /> : null}
                    </div>
                  </li>
                );
              })}
            </ul>

            <div data-testid="members-table-desktop" className="hidden lg:block">
              <table className="w-full table-fixed border-collapse text-left">
                <caption className="sr-only">Miembros del círculo</caption>
                <colgroup>
                  <col />
                  <col className="w-36" />
                  <col className="w-28" />
                  <col className="w-20" />
                  <col className="w-14" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border text-caption uppercase text-muted">
                    <th scope="col" className="whitespace-nowrap px-3 py-3 font-semibold">
                      Persona
                    </th>
                    <th scope="col" className="whitespace-nowrap px-3 py-3 font-semibold">
                      Rol
                    </th>
                    <th scope="col" className="whitespace-nowrap px-3 py-3 font-semibold">
                      Aparece en
                    </th>
                    <th scope="col" className="whitespace-nowrap px-3 py-3 font-semibold">
                      Se unió
                    </th>
                    <th scope="col" className="whitespace-nowrap px-2 py-3">
                      <VisuallyHidden>Acciones</VisuallyHidden>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => {
                    const removable = canRemoveMember(member, isOwner, meId);

                    return (
                      <tr key={member.user.id} className="border-b border-border last:border-b-0">
                        <td className="max-w-0 overflow-hidden px-3 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar
                              name={member.user.name}
                              src={member.user.avatarUrl ?? undefined}
                              size={32}
                              decorative
                            />
                            <MemberName member={member} meId={meId} />
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <Badge variant={member.role === 'owner' ? 'primary' : 'neutral'}>
                            {formatRole(member.role)}
                          </Badge>
                        </td>
                        <td
                          className={
                            member.photosCount === 0
                              ? 'whitespace-nowrap px-3 py-3 text-caption text-muted'
                              : 'whitespace-nowrap px-3 py-3 text-body-sm font-semibold text-primary-text'
                          }
                        >
                          {formatMemberPhotos(member.photosCount)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-body-sm text-muted">
                          {formatJoinedAt(member.joinedAt)}
                        </td>
                        <td className="px-2 py-3 text-right">
                          {removable ? <MemberMenu member={member} onRemove={onRemove} /> : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {hasMore ? (
              <div className="mt-4 flex justify-center lg:pb-4">
                <Button variant="secondary" onClick={onLoadMore} loading={loadingMore}>
                  Cargar más
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
