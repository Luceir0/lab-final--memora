import { createApiClient, type FetchLike } from '@memora/api-client';
import type { CurrentUserDto, InvitationPreviewDto } from '@memora/shared';
import { describe, expect, it } from 'vitest';

import { readInvitationPageData } from './preview.server';
import { testInvitationToken, testViewer, validPreview } from './test-fixtures';

const API_BASE = 'http://localhost:3000/api';

const currentUser: CurrentUserDto = {
  id: 'usr_sofia',
  name: testViewer.name,
  email: testViewer.email,
  avatarUrl: null,
  themePreference: 'system',
  createdAt: '2026-01-01T00:00:00.000Z',
};

interface RecordedRequest {
  readonly path: string;
  readonly cookie: string | null;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function notFoundResponse(): Response {
  return jsonResponse({ code: 'NOT_FOUND', message: 'No encontrado.', details: null }, 404);
}

function clientWith(handler: (request: RecordedRequest) => Response, recorded: RecordedRequest[]) {
  const fetchStub: FetchLike = async (input, init) => {
    const url = new URL(input);
    const request = {
      path: url.pathname,
      cookie: new Headers(init?.headers).get('cookie'),
    };
    recorded.push(request);
    return handler(request);
  };

  return createApiClient({ basePath: API_BASE, fetch: fetchStub });
}

describe('lectura SSR de la invitación', () => {
  it('reenvía la cookie de la petición a la preview y a /me', async () => {
    const recorded: RecordedRequest[] = [];
    const preview: InvitationPreviewDto = { ...validPreview };
    const client = clientWith((request) => {
      if (request.path.endsWith('/me')) {
        return jsonResponse({ user: currentUser });
      }
      return jsonResponse(preview);
    }, recorded);

    const data = await readInvitationPageData(
      {
        token: testInvitationToken,
        cookie: 'memora_session=abc123',
        origin: 'https://memora.test',
      },
      client,
    );

    expect(data).toEqual({
      kind: 'preview',
      token: testInvitationToken,
      origin: 'https://memora.test',
      preview,
      viewer: { name: testViewer.name, email: testViewer.email },
    });
    expect(recorded.map((request) => request.path)).toEqual([
      `/api/invitations/${testInvitationToken}`,
      '/api/me',
    ]);
    expect(recorded.every((request) => request.cookie === 'memora_session=abc123')).toBe(true);
  });

  it('sin sesión solo pide la preview y no inventa un visor', async () => {
    const recorded: RecordedRequest[] = [];
    const client = clientWith(() => jsonResponse(validPreview), recorded);

    const data = await readInvitationPageData(
      {
        token: testInvitationToken,
        cookie: undefined,
        origin: 'https://memora.test',
      },
      client,
    );

    expect(data.kind).toBe('preview');
    if (data.kind === 'preview') {
      expect(data.viewer).toBeNull();
    }
    expect(recorded).toHaveLength(1);
    expect(recorded[0]?.cookie).toBeNull();
  });

  it('una cookie caducada degrada a visitante sin romper la preview', async () => {
    const client = clientWith(
      (request) =>
        request.path.endsWith('/me')
          ? jsonResponse({ code: 'UNAUTHORIZED', message: 'Sesión caducada.', details: null }, 401)
          : jsonResponse(validPreview),
      [],
    );

    const data = await readInvitationPageData(
      {
        token: testInvitationToken,
        cookie: 'memora_session=caducada',
        origin: 'https://memora.test',
      },
      client,
    );

    expect(data.kind).toBe('preview');
    if (data.kind === 'preview') {
      expect(data.viewer).toBeNull();
    }
  });

  it('un token desconocido se resuelve como inválido, no como error', async () => {
    const client = clientWith(() => notFoundResponse(), []);

    const data = await readInvitationPageData(
      {
        token: 'tok_desconocido',
        cookie: undefined,
        origin: 'https://memora.test',
      },
      client,
    );

    expect(data).toEqual({
      kind: 'invalid',
      token: 'tok_desconocido',
      origin: 'https://memora.test',
    });
  });

  it('un fallo de red de la preview se resuelve como error reintentable', async () => {
    const fetchStub: FetchLike = () => Promise.reject(new Error('offline'));
    const client = createApiClient({ basePath: API_BASE, fetch: fetchStub });

    const data = await readInvitationPageData(
      {
        token: testInvitationToken,
        cookie: undefined,
        origin: 'https://memora.test',
      },
      client,
    );

    expect(data).toEqual({
      kind: 'error',
      token: testInvitationToken,
      origin: 'https://memora.test',
    });
  });

  it('un token fuera de contrato no toca la red', async () => {
    const recorded: RecordedRequest[] = [];
    const client = clientWith(() => jsonResponse(validPreview), recorded);

    const data = await readInvitationPageData(
      {
        token: 'x'.repeat(257),
        cookie: undefined,
        origin: 'https://memora.test',
      },
      client,
    );

    expect(data.kind).toBe('invalid');
    expect(recorded).toHaveLength(0);
  });
});
