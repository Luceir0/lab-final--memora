import type { MemberDto, PhotoDto, Role, UserDto } from '@memora/shared';
import {
  Avatar,
  Button,
  Checkbox,
  EmptyState,
  InlineAlert,
  LinkButton,
  ResponsiveDialog,
  SearchField,
  Skeleton,
} from '@memora/ui';
import { Search, UserPlus } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';

import { flattenMemberPages, useMembersQuery } from '../../members/queries';
import { isUnauthorizedError, useUnauthorizedRedirect } from '../../circles/session';

import { getPhotoTagErrorCopy, type PhotoTagErrorCopy } from './errors';
import { filterMembersByName } from './member-search';
import { useSavePhotoTagsMutation } from './queries';

/** Tope de páginas que el diálogo carga al abrirse (24 por página). */
export const MAX_MEMBER_PAGES = 20;

export interface TagPeopleDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly photo: PhotoDto;
  readonly circleId: string;
  readonly albumId: string;
  readonly circleName: string;
  readonly circleRole: Role;
  /** Cuenta autenticada; `null` mientras `/me` carga. */
  readonly meId: string | null;
  /** Se llama justo después de guardar, antes de cerrar. */
  readonly onSaved?: (() => void) | undefined;
}

function photoCountLabel(count: number): string {
  return count === 1 ? '1 foto' : `${count} fotos`;
}

function memberLabel(count: number): string {
  return count === 1 ? '1 miembro' : `${count} miembros`;
}

function selectedLabel(count: number): string {
  return count === 1 ? '1 elegido' : `${count} elegidos`;
}

/**
 * «Etiquetar personas» (F32).
 *
 * Hoja inferior en móvil y diálogo en escritorio con el mismo árbol. La lista
 * sale de `GET /circles/:circleId/members`: al abrir se piden las páginas
 * restantes (hasta 20) y la búsqueda filtra en cliente, de modo que nunca se
 * bloquea mientras llegan más miembros. Los checkboxes son nativos y el
 * estado seleccionado se aplica de forma optimista al guardar.
 */
export function TagPeopleDialog({
  open,
  onClose,
  photo,
  circleId,
  albumId,
  circleName,
  circleRole,
  meId,
  onSaved,
}: TagPeopleDialogProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set(photo.tags.map((tag) => tag.id)),
  );
  const [saveError, setSaveError] = useState<PhotoTagErrorCopy | null>(null);

  // Snapshot de las etiquetas al abrir: el estado optimista cambia `photo`
  // mientras se guarda, pero el lote debe compararse contra lo que había.
  const initialTagIdsRef = useRef<ReadonlySet<string>>(new Set(photo.tags.map((tag) => tag.id)));
  const latestTagsRef = useRef(photo.tags);
  latestTagsRef.current = photo.tags;

  useEffect(() => {
    if (!open) {
      return;
    }

    const initial = new Set(latestTagsRef.current.map((tag) => tag.id));
    initialTagIdsRef.current = initial;
    setSelectedIds(initial);
    setQuery('');
    setSaveError(null);
  }, [open, photo.id]);

  const membersQuery = useMembersQuery(circleId, open);
  const mutation = useSavePhotoTagsMutation({ photoId: photo.id, circleId, albumId });
  const saving = mutation.isPending;
  const { hasNextPage, isFetchingNextPage, isError: membersFailed, fetchNextPage } = membersQuery;

  useUnauthorizedRedirect(membersQuery.error);
  useUnauthorizedRedirect(mutation.error);

  const allMembers: readonly MemberDto[] =
    membersQuery.data === undefined ? [] : flattenMemberPages(membersQuery.data.pages);
  const pageCount = membersQuery.data?.pages.length ?? 0;

  // Carga las páginas restantes al abrir, sin bloquear la búsqueda sobre lo
  // que ya está en caché. El tope evita recorrer círculos enormes sin fin.
  useEffect(() => {
    if (!open || !hasNextPage || isFetchingNextPage) {
      return;
    }

    if (membersFailed || pageCount >= MAX_MEMBER_PAGES) {
      return;
    }

    void fetchNextPage();
  }, [open, hasNextPage, isFetchingNextPage, membersFailed, fetchNextPage, pageCount]);

  const filteredMembers = filterMembersByName(allMembers, query);
  const added: readonly UserDto[] = allMembers
    .filter(
      (member) => selectedIds.has(member.user.id) && !initialTagIdsRef.current.has(member.user.id),
    )
    .map((member) => member.user);
  const removed = [...initialTagIdsRef.current].filter((userId) => !selectedIds.has(userId));
  const pendingCount = added.length + removed.length;
  const selectedCount = selectedIds.size;
  const reachedPageCap = pageCount >= MAX_MEMBER_PAGES && hasNextPage;
  const searchIsComplete =
    reachedPageCap || (!membersQuery.isPending && !isFetchingNextPage && !hasNextPage);
  const showNoResults =
    !reachedPageCap &&
    searchIsComplete &&
    membersQuery.data !== undefined &&
    filteredMembers.length === 0;
  const showLoadingMore = !membersQuery.isPending && isFetchingNextPage;
  const circleNameLabel = circleName.trim() === '' ? 'este círculo' : circleName;

  const requestClose = () => {
    if (!saving) {
      onClose();
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }

      return next;
    });
  };

  const onSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const save = async () => {
    if (saving || pendingCount === 0) {
      return;
    }

    setSaveError(null);

    try {
      await mutation.mutateAsync({ added, removed });
      onSaved?.();
      onClose();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        return;
      }

      setSaveError(getPhotoTagErrorCopy(error));
    }
  };

  const footer = (
    <div className="flex w-full flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <p role="status" className="sr-only">
        {saving ? 'Guardando etiquetas…' : ''}
      </p>
      {saving ? (
        <p aria-hidden="true" className="hidden text-body-sm text-muted md:block">
          Guardando {pendingCount} {pendingCount === 1 ? 'etiqueta' : 'etiquetas'}…
        </p>
      ) : null}
      <div className="flex w-full gap-2 md:w-auto">
        <Button variant="secondary" onClick={requestClose} disabled={saving} className="shrink-0">
          <span className="md:hidden">Cancelar</span>
          <span className="hidden md:inline">Volver a la foto</span>
        </Button>
        <Button
          onClick={() => {
            void save();
          }}
          loading={saving}
          disabled={saving || pendingCount === 0}
          className="flex-1 md:flex-none"
        >
          {saving ? 'Guardando…' : 'Guardar etiquetas'}
        </Button>
      </div>
    </div>
  );

  return (
    <ResponsiveDialog
      open={open}
      onClose={requestClose}
      title="Etiquetar personas"
      description={`Marca quién aparece en esta foto. Solo puedes elegir miembros de ${circleNameLabel}.`}
      dismissible={!saving}
      initialFocusRef={searchRef}
      footer={footer}
    >
      <div aria-busy={saving} data-testid="tag-people-body" className="flex flex-col">
        <div className="flex items-center gap-3">
          <img
            data-testid="tag-photo-thumb"
            src={photo.thumbUrl}
            alt=""
            aria-hidden="true"
            className="hidden size-11 shrink-0 rounded-md border border-border object-cover md:block"
          />
          <div className="min-w-0 flex-1">
            <SearchField
              ref={searchRef}
              label="Buscar por nombre"
              placeholder="Buscar por nombre"
              value={query}
              onChange={onSearchChange}
              onClear={() => {
                setQuery('');
              }}
              autoComplete="off"
            />
          </div>
        </div>

        {saveError === null ? null : (
          <InlineAlert
            tone="danger"
            title={saveError.title}
            description={saveError.description}
            className="mt-3"
          />
        )}

        {membersQuery.isError ? (
          <InlineAlert
            tone="danger"
            title="No hemos podido cargar los miembros"
            description="Comprueba la conexión y vuelve a intentarlo."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  void membersQuery.refetch();
                }}
              >
                Reintentar
              </Button>
            }
            className="mt-3"
          />
        ) : null}

        {membersQuery.isPending ? (
          <div className="mt-4">
            <p role="status" className="sr-only">
              Cargando miembros…
            </p>
            <div aria-hidden="true" className="space-y-2">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="flex items-center gap-3 py-2">
                  <Skeleton shape="circle" size="md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton shape="text" size="sm" className="w-40" />
                    <Skeleton shape="text" size="sm" className="w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : membersQuery.data === undefined ? null : (
          <>
            {filteredMembers.length === 0 ? null : (
              <p
                aria-live="polite"
                aria-atomic="true"
                className="mt-4 text-caption font-semibold uppercase tracking-wide text-muted"
              >
                {memberLabel(filteredMembers.length)} · {selectedLabel(selectedCount)}
              </p>
            )}

            {showNoResults ? (
              <div role="status" className="mt-6">
                <EmptyState
                  headingLevel={3}
                  icon={<Search />}
                  title={`Nadie se llama «${query.trim()}» en este círculo`}
                  description={`Solo puedes etiquetar a miembros de ${circleNameLabel}. Invita al círculo para poder etiquetarla.`}
                  action={
                    circleRole === 'owner' ? (
                      <LinkButton
                        variant="secondary"
                        size="sm"
                        icon={<UserPlus />}
                        href={`/circles/${encodeURIComponent(circleId)}/people`}
                      >
                        Invitar al círculo
                      </LinkButton>
                    ) : undefined
                  }
                />
              </div>
            ) : filteredMembers.length === 0 ? null : (
              <ul className="mt-2 grid gap-1 md:grid-cols-2 md:gap-2">
                {filteredMembers.map((member) => {
                  const isMe = member.user.id === meId;
                  const label = isMe ? `${member.user.name} (tú)` : member.user.name;
                  const checked = selectedIds.has(member.user.id);

                  return (
                    <li
                      key={member.user.id}
                      className={`flex items-center gap-2 rounded-lg border px-3 ${
                        checked ? 'border-primary bg-primary-soft' : 'border-border'
                      }`}
                    >
                      <Avatar
                        name={member.user.name}
                        src={member.user.avatarUrl ?? undefined}
                        size={32}
                        decorative
                      />
                      <div className="min-w-0 flex-1">
                        <Checkbox
                          className="flex-row-reverse justify-between"
                          label={label}
                          description={`Aparece en ${photoCountLabel(member.photosCount)}`}
                          checked={checked}
                          disabled={saving}
                          onChange={() => {
                            toggleMember(member.user.id);
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {showLoadingMore ? (
              <p role="status" className="mt-3 text-body-sm text-muted">
                Cargando más miembros…
              </p>
            ) : null}

            {reachedPageCap ? (
              <p className="mt-3 text-body-sm text-muted">
                Hay más miembros de los que se pueden buscar en este diálogo.
              </p>
            ) : null}
          </>
        )}
      </div>
    </ResponsiveDialog>
  );
}
