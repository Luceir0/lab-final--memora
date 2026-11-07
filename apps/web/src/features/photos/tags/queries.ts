import {
  addPhotoTagResponseSchema,
  removePhotoTagResponseSchema,
  type AlbumPhotosResponse,
  type ListMembersResponse,
  type PersonPhotosResponse,
  type PhotoDto,
  type UserDto,
} from '@memora/shared';
import {
  useMutation,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
  type QueryKey,
} from '@tanstack/react-query';

import { apiClient } from '../../../lib/api-client';
import { fetchCsrfToken } from '../../../lib/csrf';

/**
 * Prefijos de caché que contienen `PhotoDto.tags` o `MemberDto.photosCount`.
 *
 * Son prefijos, no claves exactas: `['album', id, 'photos']` cubre también la
 * galería filtrada por persona (`['album', id, 'photos', personId]`) y
 * `['circle', id, 'person']` cubre la vista de fotos de una persona.
 */
export const tagKeys = {
  detail: (photoId: string) => ['photo', photoId] as const,
  albumPhotos: (albumId: string) => ['album', albumId, 'photos'] as const,
  personPhotos: (circleId: string) => ['circle', circleId, 'person'] as const,
  members: (circleId: string) => ['circle', circleId, 'members'] as const,
};

export interface SavePhotoTagsInput {
  /** Personas que se añaden; ya validadas como miembros en el diálogo. */
  readonly added: readonly UserDto[];
  /** Ids de personas a las que se quita la etiqueta. */
  readonly removed: readonly string[];
}

export interface SavePhotoTagsOptions {
  readonly photoId: string;
  readonly circleId: string;
  readonly albumId: string;
}

/**
 * Aplica los cambios a un `PhotoDto` conservando el orden del servidor para
 * las etiquetas que ya estaban y añadiendo las nuevas al final. Nunca duplica
 * una persona aunque llegue repetida.
 */
export function applyTagChanges(photo: PhotoDto, input: SavePhotoTagsInput): PhotoDto {
  const removed = new Set(input.removed);
  const existing = new Set(photo.tags.map((tag) => tag.id));
  const tags = photo.tags.filter((tag) => !removed.has(tag.id));

  for (const user of input.added) {
    if (existing.has(user.id) || removed.has(user.id)) {
      continue;
    }

    tags.push(user);
    existing.add(user.id);
  }

  return { ...photo, tags };
}

function updatePhotoPages<T extends { readonly items: readonly PhotoDto[] }>(
  current: InfiniteData<T> | undefined,
  photoId: string,
  input: SavePhotoTagsInput,
): InfiniteData<T> | undefined {
  if (current === undefined) {
    return current;
  }

  return {
    ...current,
    pages: current.pages.map((page) => ({
      ...page,
      items: page.items.map((item) => (item.id === photoId ? applyTagChanges(item, input) : item)),
    })),
  };
}

/**
 * Cuánto cambia el «Aparece en» de cada miembro.
 *
 * Solo cuenta las etiquetas que de verdad cambian: si el detalle ya tenía a la
 * persona, no se incrementa el contador otra vez (el `POST` es idempotente).
 */
function memberCountDelta(
  input: SavePhotoTagsInput,
  previousTags: readonly UserDto[] | undefined,
): ReadonlyMap<string, number> {
  const previous = previousTags === undefined ? null : new Set(previousTags.map((tag) => tag.id));
  const delta = new Map<string, number>();

  const adjust = (userId: string, amount: number) => {
    delta.set(userId, (delta.get(userId) ?? 0) + amount);
  };

  for (const user of input.added) {
    if (previous === null || !previous.has(user.id)) {
      adjust(user.id, 1);
    }
  }

  for (const userId of input.removed) {
    if (previous === null || previous.has(userId)) {
      adjust(userId, -1);
    }
  }

  return delta;
}

function updateMemberPages(
  current: InfiniteData<ListMembersResponse> | undefined,
  delta: ReadonlyMap<string, number>,
): InfiniteData<ListMembersResponse> | undefined {
  if (current === undefined || delta.size === 0) {
    return current;
  }

  return {
    ...current,
    pages: current.pages.map((page) => ({
      ...page,
      items: page.items.map((member) => {
        const amount = delta.get(member.user.id);

        if (amount === undefined) {
          return member;
        }

        return {
          ...member,
          photosCount: Math.max(0, member.photosCount + amount),
        };
      }),
    })),
  };
}

interface SavePhotoTagsContext {
  readonly detail: PhotoDto | undefined;
  readonly albums: ReadonlyArray<
    readonly [QueryKey, InfiniteData<AlbumPhotosResponse> | undefined]
  >;
  readonly people: ReadonlyArray<
    readonly [QueryKey, InfiniteData<PersonPhotosResponse> | undefined]
  >;
  readonly members: InfiniteData<ListMembersResponse> | undefined;
}

function invalidateTagQueries(
  queryClient: QueryClient,
  options: SavePhotoTagsOptions,
  includeDetail: boolean,
): void {
  const keys: QueryKey[] = [
    tagKeys.albumPhotos(options.albumId),
    tagKeys.personPhotos(options.circleId),
    tagKeys.members(options.circleId),
  ];

  if (includeDetail) {
    keys.push(tagKeys.detail(options.photoId));
  }

  for (const queryKey of keys) {
    void queryClient.invalidateQueries({ queryKey });
  }
}

/**
 * `POST /photos/:photoId/tags` y `DELETE /photos/:photoId/tags/:userId` (F32).
 *
 * El lote es optimista: `onMutate` cancela las consultas afectadas, guarda un
 * snapshot y pinta las etiquetas y los contadores al instante. Si una sola
 * petición falla, `onError` restaura todos los snapshots e invalida las claves
 * para reconciliar el caso en el que parte del lote sí llegó al servidor. En
 * éxito se invalidan las listas y los miembros; el detalle conserva el estado
 * optimista, que ya coincide con la respuesta.
 *
 * El `POST` es idempotente (`200`/`201`): el cliente no distingue ambos y los
 * trata igual. El `DELETE` también (`204` aunque la etiqueta no existiera).
 */
export function useSavePhotoTagsMutation({ photoId, circleId, albumId }: SavePhotoTagsOptions) {
  const queryClient = useQueryClient();
  const options = { photoId, circleId, albumId };

  return useMutation<void, unknown, SavePhotoTagsInput, SavePhotoTagsContext>({
    mutationFn: async (input) => {
      const csrfToken = await fetchCsrfToken(queryClient);
      const headers = { 'X-CSRF-Token': csrfToken };
      const tagPath = `/photos/${encodeURIComponent(photoId)}/tags`;

      // `allSettled` espera a que TODO el lote termine antes de devolver el
      // control. Con `all` el primer rechazo dispararía `onError` mientras otras
      // peticiones siguen en vuelo; una que confirmase después dejaría la caché
      // desincronizada respecto al servidor.
      const results = await Promise.allSettled([
        ...input.added.map((user) =>
          apiClient.post(
            tagPath,
            { userId: user.id },
            { schema: addPhotoTagResponseSchema, headers },
          ),
        ),
        ...input.removed.map((userId) =>
          apiClient.delete(`${tagPath}/${encodeURIComponent(userId)}`, {
            schema: removePhotoTagResponseSchema,
            headers,
          }),
        ),
      ]);

      const failure = results.find(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      );

      if (failure !== undefined) {
        throw failure.reason;
      }
    },

    onMutate: async (input) => {
      const detailKey = tagKeys.detail(photoId);
      const albumKey = tagKeys.albumPhotos(albumId);
      const personKey = tagKeys.personPhotos(circleId);
      const memberKey = tagKeys.members(circleId);

      await Promise.all([
        queryClient.cancelQueries({ queryKey: detailKey }),
        queryClient.cancelQueries({ queryKey: albumKey }),
        queryClient.cancelQueries({ queryKey: personKey }),
        queryClient.cancelQueries({ queryKey: memberKey }),
      ]);

      const detail = queryClient.getQueryData<PhotoDto>(detailKey);
      const albums = queryClient.getQueriesData<InfiniteData<AlbumPhotosResponse>>({
        queryKey: albumKey,
      });
      const people = queryClient.getQueriesData<InfiniteData<PersonPhotosResponse>>({
        queryKey: personKey,
      });
      const members = queryClient.getQueryData<InfiniteData<ListMembersResponse>>(memberKey);
      const delta = memberCountDelta(input, detail?.tags);

      if (detail !== undefined) {
        queryClient.setQueryData<PhotoDto>(detailKey, applyTagChanges(detail, input));
      }

      queryClient.setQueriesData<InfiniteData<AlbumPhotosResponse>>(
        { queryKey: albumKey },
        (current) => updatePhotoPages(current, photoId, input),
      );
      queryClient.setQueriesData<InfiniteData<PersonPhotosResponse>>(
        { queryKey: personKey },
        (current) => updatePhotoPages(current, photoId, input),
      );
      queryClient.setQueryData<InfiniteData<ListMembersResponse>>(memberKey, (current) =>
        updateMemberPages(current, delta),
      );

      return { detail, albums, people, members };
    },

    onError: (_error, _input, context) => {
      if (context !== undefined) {
        if (context.detail !== undefined) {
          queryClient.setQueryData<PhotoDto>(tagKeys.detail(photoId), context.detail);
        }

        for (const [queryKey, data] of context.albums) {
          queryClient.setQueryData(queryKey, data);
        }

        for (const [queryKey, data] of context.people) {
          queryClient.setQueryData(queryKey, data);
        }

        queryClient.setQueryData<InfiniteData<ListMembersResponse> | undefined>(
          tagKeys.members(circleId),
          context.members,
        );
      }

      invalidateTagQueries(queryClient, options, true);
    },

    onSuccess: () => {
      invalidateTagQueries(queryClient, options, false);
    },
  });
}
