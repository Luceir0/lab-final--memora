import type {
  AddPhotoTagRequest,
  AlbumPhotosResponse,
  ListMembersResponse,
  PersonPhotosResponse,
  PhotoDto,
} from '@memora/shared';
import { QueryClient, QueryClientProvider, type InfiniteData } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { AUTH_TEST_API_BASE } from '../../../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../../test/auth-server';
import { makePhoto } from '../../../test/fixtures/photos-fixtures';
import { lauraMember, lucasMember, ownerMember } from '../../members/members-fixtures';

import { tagKeys, useSavePhotoTagsMutation } from './queries';

const server = createAuthTestServer();
const CSRF_URL = `${AUTH_TEST_API_BASE}/auth/csrf`;
const TAG_URL = `${AUTH_TEST_API_BASE}/photos/pho_playa/tags`;
const ALBUM_KEY = ['album', 'alb_verano', 'photos', 'all'] as const;
const PERSON_KEY = ['circle', 'cir_familia', 'person', 'usr_lucas', 'photos'] as const;
const MEMBERS_KEY = tagKeys.members('cir_familia');
const DETAIL_KEY = tagKeys.detail('pho_playa');

const basePhoto = makePhoto({
  id: 'pho_playa',
  tags: [lucasMember.user],
});

const albumPage: AlbumPhotosResponse = { items: [basePhoto], nextCursor: null };
const personPage: PersonPhotosResponse = { items: [basePhoto], nextCursor: null };
const membersPage: ListMembersResponse = {
  items: [lucasMember, lauraMember],
  nextCursor: null,
};

interface Deferred {
  readonly promise: Promise<void>;
  readonly resolve: () => void;
}

function deferred(): Deferred {
  let resolve!: () => void;
  const promise = new Promise<void>((complete) => {
    resolve = complete;
  });

  return { promise, resolve };
}

function createClient(): QueryClient {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  client.setQueryData(DETAIL_KEY, basePhoto);
  client.setQueryData<InfiniteData<AlbumPhotosResponse>>(ALBUM_KEY, {
    pages: [albumPage],
    pageParams: [null],
  });
  client.setQueryData<InfiniteData<PersonPhotosResponse>>(PERSON_KEY, {
    pages: [personPage],
    pageParams: [null],
  });
  client.setQueryData<InfiniteData<ListMembersResponse>>(MEMBERS_KEY, {
    pages: [membersPage],
    pageParams: [null],
  });

  return client;
}

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function detailTagIds(client: QueryClient): readonly string[] {
  return client.getQueryData<PhotoDto>(DETAIL_KEY)?.tags.map((tag) => tag.id) ?? [];
}

function pageTagIds(
  client: QueryClient,
  key: typeof ALBUM_KEY | typeof PERSON_KEY,
): readonly string[] {
  const data = client.getQueryData<InfiniteData<AlbumPhotosResponse>>(key);

  return data?.pages[0]?.items[0]?.tags.map((tag) => tag.id) ?? [];
}

function memberPhotosCount(client: QueryClient, userId: string): number | undefined {
  const data = client.getQueryData<InfiniteData<ListMembersResponse>>(MEMBERS_KEY);

  return data?.pages[0]?.items.find((member) => member.user.id === userId)?.photosCount;
}

beforeAll(() => {
  startAuthTestServer(server);
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

describe('useSavePhotoTagsMutation · añadir', () => {
  it('pinta la etiqueta y el contador antes de que responda el servidor', async () => {
    const client = createClient();
    const post = deferred();
    let captured: AddPhotoTagRequest | null = null;
    let csrf: string | null = null;

    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-token' })),
      http.post(TAG_URL, async ({ request }) => {
        captured = (await request.json()) as AddPhotoTagRequest;
        csrf = request.headers.get('x-csrf-token');
        await post.promise;

        return HttpResponse.json(
          {
            id: 'tag_laura',
            photoId: 'pho_playa',
            user: lauraMember.user,
            createdAt: '2026-11-07T10:00:00.000Z',
          },
          { status: 201 },
        );
      }),
    );

    const { result } = renderHook(
      () =>
        useSavePhotoTagsMutation({
          photoId: 'pho_playa',
          circleId: 'cir_familia',
          albumId: 'alb_verano',
        }),
      { wrapper: wrapper(client) },
    );

    let save!: Promise<void>;

    act(() => {
      save = result.current.mutateAsync({ added: [lauraMember.user], removed: [] });
    });

    await waitFor(() => {
      expect(detailTagIds(client)).toEqual(['usr_lucas', 'usr_laura']);
    });

    expect(pageTagIds(client, ALBUM_KEY)).toEqual(['usr_lucas', 'usr_laura']);
    expect(pageTagIds(client, PERSON_KEY)).toEqual(['usr_lucas', 'usr_laura']);
    expect(memberPhotosCount(client, 'usr_laura')).toBe(1);
    expect(captured).toEqual({ userId: 'usr_laura' });
    expect(csrf).toBe('csrf-token');

    post.resolve();

    await act(async () => {
      await save;
    });

    await waitFor(() => {
      expect(client.getQueryState(MEMBERS_KEY)?.isInvalidated).toBe(true);
    });
    expect(client.getQueryState(ALBUM_KEY)?.isInvalidated).toBe(true);
    expect(client.getQueryState(PERSON_KEY)?.isInvalidated).toBe(true);
    // El detalle conserva el estado optimista y no se invalida en éxito.
    expect(detailTagIds(client)).toEqual(['usr_lucas', 'usr_laura']);
    expect(client.getQueryState(DETAIL_KEY)?.isInvalidated).toBe(false);
  });

  it('espera a que todo el lote termine antes de restaurar si una parte falla', async () => {
    const client = createClient();
    const failGate = deferred();
    const successGate = deferred();
    const started: string[] = [];
    let settled = 0;

    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-token' })),
      http.post(TAG_URL, async ({ request }) => {
        const { userId } = (await request.json()) as AddPhotoTagRequest;

        started.push(userId);

        if (userId === lauraMember.user.id) {
          await successGate.promise;
          settled += 1;

          return HttpResponse.json(
            {
              id: 'tag_laura',
              photoId: 'pho_playa',
              user: lauraMember.user,
              createdAt: '2026-11-07T10:00:00.000Z',
            },
            { status: 201 },
          );
        }

        await failGate.promise;
        settled += 1;

        return HttpResponse.json(
          { code: 'FORBIDDEN', message: 'No tienes permiso.' },
          { status: 403 },
        );
      }),
    );

    const { result } = renderHook(
      () =>
        useSavePhotoTagsMutation({
          photoId: 'pho_playa',
          circleId: 'cir_familia',
          albumId: 'alb_verano',
        }),
      { wrapper: wrapper(client) },
    );

    let save!: Promise<void>;

    act(() => {
      save = result.current.mutateAsync({
        added: [lauraMember.user, ownerMember.user],
        removed: [],
      });
    });

    await waitFor(() => {
      expect(started).toHaveLength(2);
    });

    failGate.resolve();

    await waitFor(() => {
      expect(settled).toBe(1);
    });

    // La petición correcta sigue en vuelo: el rollback no debe haber corrido.
    expect(detailTagIds(client)).toEqual(['usr_lucas', 'usr_laura', 'usr_test_1']);

    successGate.resolve();

    let rejected = false;

    await act(async () => {
      try {
        await save;
      } catch {
        rejected = true;
      }
    });

    expect(rejected).toBe(true);
    expect(settled).toBe(2);
    expect(detailTagIds(client)).toEqual(['usr_lucas']);
    expect(client.getQueryState(DETAIL_KEY)?.isInvalidated).toBe(true);
    expect(client.getQueryState(ALBUM_KEY)?.isInvalidated).toBe(true);
    expect(client.getQueryState(PERSON_KEY)?.isInvalidated).toBe(true);
    expect(client.getQueryState(MEMBERS_KEY)?.isInvalidated).toBe(true);
  });

  it('restaura los snapshots y reconcilia claves si falla', async () => {
    const client = createClient();

    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-token' })),
      http.post(TAG_URL, () =>
        HttpResponse.json({ code: 'FORBIDDEN', message: 'No tienes permiso.' }, { status: 403 }),
      ),
    );

    const { result } = renderHook(
      () =>
        useSavePhotoTagsMutation({
          photoId: 'pho_playa',
          circleId: 'cir_familia',
          albumId: 'alb_verano',
        }),
      { wrapper: wrapper(client) },
    );

    let rejected = false;

    await act(async () => {
      try {
        await result.current.mutateAsync({ added: [lauraMember.user], removed: [] });
      } catch {
        rejected = true;
      }
    });

    expect(rejected).toBe(true);
    expect(detailTagIds(client)).toEqual(['usr_lucas']);
    expect(pageTagIds(client, ALBUM_KEY)).toEqual(['usr_lucas']);
    expect(pageTagIds(client, PERSON_KEY)).toEqual(['usr_lucas']);
    expect(memberPhotosCount(client, 'usr_laura')).toBe(0);
    expect(client.getQueryState(DETAIL_KEY)?.isInvalidated).toBe(true);
    expect(client.getQueryState(ALBUM_KEY)?.isInvalidated).toBe(true);
    expect(client.getQueryState(PERSON_KEY)?.isInvalidated).toBe(true);
    expect(client.getQueryState(MEMBERS_KEY)?.isInvalidated).toBe(true);
  });
});

describe('useSavePhotoTagsMutation · quitar', () => {
  it('quita la etiqueta y baja el contador de forma optimista', async () => {
    const client = createClient();
    const remove = deferred();
    const deleted: string[] = [];

    client.setQueryData(DETAIL_KEY, { ...basePhoto, tags: [lucasMember.user, lauraMember.user] });

    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-token' })),
      http.delete(`${TAG_URL}/:userId`, async ({ params }) => {
        deleted.push(String(params.userId));
        await remove.promise;

        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { result } = renderHook(
      () =>
        useSavePhotoTagsMutation({
          photoId: 'pho_playa',
          circleId: 'cir_familia',
          albumId: 'alb_verano',
        }),
      { wrapper: wrapper(client) },
    );

    let save!: Promise<void>;

    act(() => {
      save = result.current.mutateAsync({ added: [], removed: ['usr_lucas'] });
    });

    await waitFor(() => {
      expect(detailTagIds(client)).toEqual(['usr_laura']);
    });
    expect(memberPhotosCount(client, 'usr_lucas')).toBe(141);

    remove.resolve();

    await act(async () => {
      await save;
    });

    expect(deleted).toEqual(['usr_lucas']);
  });

  it('restaura los snapshots si el DELETE falla', async () => {
    const client = createClient();

    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-token' })),
      http.delete(`${TAG_URL}/:userId`, () =>
        HttpResponse.json(
          { code: 'INTERNAL', message: 'No se pudo quitar la etiqueta.' },
          { status: 500 },
        ),
      ),
    );

    const { result } = renderHook(
      () =>
        useSavePhotoTagsMutation({
          photoId: 'pho_playa',
          circleId: 'cir_familia',
          albumId: 'alb_verano',
        }),
      { wrapper: wrapper(client) },
    );

    let rejected = false;

    await act(async () => {
      try {
        await result.current.mutateAsync({ added: [], removed: ['usr_lucas'] });
      } catch {
        rejected = true;
      }
    });

    expect(rejected).toBe(true);
    expect(detailTagIds(client)).toEqual(['usr_lucas']);
    expect(memberPhotosCount(client, 'usr_lucas')).toBe(142);
    expect(client.getQueryState(DETAIL_KEY)?.isInvalidated).toBe(true);
    expect(client.getQueryState(MEMBERS_KEY)?.isInvalidated).toBe(true);
  });
});
