import { describe, expect, it } from 'vitest';
import type { z } from 'zod';

import {
  DEFAULT_PAGE_LIMIT,
  MAX_CURSOR_LENGTH,
  MAX_DOWNLOAD_BYTES,
  MAX_DOWNLOAD_PHOTOS,
  MAX_PAGE_LIMIT,
  acceptInvitationResponseSchema,
  activityItemDtoSchema,
  activityQuerySchema,
  activityResponseSchema,
  addPhotoTagRequestSchema,
  addPhotoTagResponseSchema,
  albumDtoSchema,
  albumParamsSchema,
  albumPhotosQuerySchema,
  albumPhotosResponseSchema,
  albumResponseSchema,
  circleAlbumsParamsSchema,
  circleActivityParamsSchema,
  circleDetailDtoSchema,
  circleDetailResponseSchema,
  circleDtoSchema,
  circleInvitationParamsSchema,
  circleMemberParamsSchema,
  circleParamsSchema,
  circleResponseSchema,
  circleSettingsSchema,
  createAlbumRequestSchema,
  createCircleRequestSchema,
  createDownloadParamsSchema,
  createDownloadRequestSchema,
  createDownloadResponseSchema,
  createInvitationParamsSchema,
  createInvitationRequestSchema,
  createInvitationResponseSchema,
  createdInvitationDtoSchema,
  csrfResponseSchema,
  currentUserDtoSchema,
  deleteAlbumResponseSchema,
  deleteCircleResponseSchema,
  deletePhotoResponseSchema,
  downloadJobDtoSchema,
  downloadJobParamsSchema,
  downloadJobResponseSchema,
  downloadPhotoParamsSchema,
  emptyAlbumResponseSchema,
  emptyResponseSchema,
  globalActivityResponseSchema,
  healthResponseSchema,
  idSchema,
  invitationDtoSchema,
  invitationPreviewDtoSchema,
  invitationPreviewResponseSchema,
  invitationTokenParamsSchema,
  leaveCircleResponseSchema,
  listAlbumsQuerySchema,
  listAlbumsResponseSchema,
  listCirclesQuerySchema,
  listCirclesResponseSchema,
  listInvitationsQuerySchema,
  listInvitationsResponseSchema,
  listMembersQuerySchema,
  listMembersResponseSchema,
  loginRequestSchema,
  loginResponseSchema,
  logoutResponseSchema,
  meResponseSchema,
  meUploadsQuerySchema,
  meUploadsResponseSchema,
  memberDtoSchema,
  pageQuerySchema,
  personPhotosParamsSchema,
  personPhotosQuerySchema,
  personPhotosResponseSchema,
  photoDtoSchema,
  photoImageQuerySchema,
  photoParamsSchema,
  photoResponseSchema,
  photoTagDtoSchema,
  photoTagParamsSchema,
  registerRequestSchema,
  registerResponseSchema,
  removeMemberResponseSchema,
  removePhotoTagResponseSchema,
  revokeInvitationResponseSchema,
  updateAlbumRequestSchema,
  updateCircleRequestSchema,
  updateMeRequestSchema,
  updatePhotoRequestSchema,
  uploadPhotoFieldsSchema,
  uploadPhotoParamsSchema,
  uploadPhotoResponseSchema,
  userDtoSchema,
} from '../index.js';

const ISO = '2026-10-25T10:00:00.000Z';

const ID = {
  user: 'clxuser000000000000000001',
  owner: 'clxuser000000000000000002',
  other: 'clxuser000000000000000003',
  circle: 'clxcircle00000000000000001',
  album: 'clxalbum00000000000000001',
  photo: 'clxphoto00000000000000001',
  invitation: 'clxinvite000000000000001',
  job: 'clxjob000000000000000001',
  tag: 'clxtag000000000000000001',
  activity: 'clxactivity0000000000001',
} as const;

const user = { id: ID.user, name: 'Lucas', avatarUrl: null };
const currentUser = {
  ...user,
  email: 'lucas@example.com',
  themePreference: 'system',
  createdAt: ISO,
};
const photoSummary = {
  id: ID.photo,
  thumbUrl: '/api/photos/1/image?size=thumb',
  width: 800,
  height: 600,
};
const photo = {
  id: ID.photo,
  circleId: ID.circle,
  albumId: ID.album,
  uploader: user,
  clientUploadId: 'upload-1',
  description: 'Playa al atardecer',
  takenAt: ISO,
  placeName: 'Lisboa, Portugal',
  mimeType: 'image/jpeg',
  size: 1024,
  width: 800,
  height: 600,
  thumbUrl: '/api/photos/1/image?size=thumb',
  displayUrl: '/api/photos/1/image?size=display',
  tags: [user],
  createdAt: ISO,
  updatedAt: ISO,
};
const album = {
  id: ID.album,
  circleId: ID.circle,
  title: 'Verano en Mallorca',
  description: null,
  date: ISO,
  coverPhoto: photoSummary,
  photosCount: 18,
  createdBy: user,
  createdAt: ISO,
  updatedAt: ISO,
};
const settings = {
  membersCanCreateAlbums: true,
  membersCanUpload: true,
  membersCanDownload: false,
  membersCanTag: true,
};
const circle = {
  id: ID.circle,
  name: 'Familia',
  description: 'Recuerdos de casa',
  settings,
  role: 'member',
  coverPhoto: photoSummary,
  createdAt: ISO,
  updatedAt: ISO,
};
const circleStats = {
  membersCount: 3,
  albumsCount: 2,
  photosCount: 18,
  storageBytes: 2048,
  lastUploadAt: ISO,
};
const invitation = {
  id: ID.invitation,
  circleId: ID.circle,
  invitedEmail: 'ana@example.com',
  expiresAt: ISO,
  revokedAt: null,
  acceptedAt: null,
  createdAt: ISO,
};
const downloadJob = {
  id: ID.job,
  kind: 'album',
  status: 'ready',
  albumId: ID.album,
  progress: 42,
  createdAt: ISO,
  expiresAt: ISO,
  completedAt: ISO,
  errorMessage: null,
};
const activityItem = {
  id: ID.activity,
  type: 'photo.uploaded',
  actor: { id: ID.user, name: 'Lucas' },
  album: { id: ID.album, title: 'Verano en Mallorca' },
  count: 18,
  createdAt: ISO,
};
const photoTag = {
  id: ID.tag,
  photoId: ID.photo,
  user,
  createdAt: ISO,
};

interface ContractPart {
  readonly schema: z.ZodType;
  readonly value: unknown;
}

type PartName = 'params' | 'query' | 'body' | 'response';

interface EndpointContract {
  readonly method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  readonly path: string;
  /** Parts the endpoint must declare; checked by `missingParts()`. */
  readonly requires: readonly PartName[];
  readonly params?: ContractPart;
  readonly query?: ContractPart;
  readonly body?: ContractPart;
  /** Omitted for binary responses (image, original download, ZIP file). */
  readonly response?: ContractPart;
  readonly binary?: true;
}

const CIRCLE_PARAMS = { schema: circleParamsSchema, value: { circleId: ID.circle } };
const ALBUM_PARAMS = { schema: albumParamsSchema, value: { albumId: ID.album } };
const PHOTO_PARAMS = { schema: photoParamsSchema, value: { photoId: ID.photo } };
const TOKEN_PARAMS = { schema: invitationTokenParamsSchema, value: { token: 'token-abc' } };

/**
 * Every endpoint of `docs/03-architecture/api-contract.md` with the shared
 * schema, a representative payload for each part and the parts that are
 * mandatory.
 *
 * The list is manual on purpose: the contract document mixes Markdown tables
 * with routes in prose (for example the activity route), so parsing it from the
 * test would be fragile. Any contract change must update this table, and
 * `EXPECTED_ENDPOINTS` below fails if an entry is added or dropped.
 */
const ENDPOINTS: readonly EndpointContract[] = [
  // Salud
  {
    method: 'GET',
    path: '/health',
    requires: ['response'],
    response: {
      schema: healthResponseSchema,
      value: { status: 'ok', version: '0.0.0', timestamp: ISO },
    },
  },
  // Auth
  {
    method: 'POST',
    path: '/auth/register',
    requires: ['body', 'response'],
    body: {
      schema: registerRequestSchema,
      value: { name: 'Lucas', email: 'Lucas@Example.com', password: '12345678' },
    },
    response: { schema: registerResponseSchema, value: { user: currentUser } },
  },
  {
    method: 'POST',
    path: '/auth/login',
    requires: ['body', 'response'],
    body: {
      schema: loginRequestSchema,
      value: { email: 'lucas@example.com', password: '12345678' },
    },
    response: { schema: loginResponseSchema, value: { user: currentUser } },
  },
  {
    method: 'POST',
    path: '/auth/logout',
    requires: ['response'],
    response: { schema: logoutResponseSchema, value: undefined },
  },
  {
    method: 'GET',
    path: '/auth/csrf',
    requires: ['response'],
    response: { schema: csrfResponseSchema, value: { csrfToken: 'token' } },
  },
  {
    method: 'GET',
    path: '/me',
    requires: ['response'],
    response: { schema: meResponseSchema, value: { user: currentUser } },
  },
  {
    method: 'PATCH',
    path: '/me',
    requires: ['body', 'response'],
    body: { schema: updateMeRequestSchema, value: { name: 'Lucas' } },
    response: { schema: meResponseSchema, value: { user: currentUser } },
  },
  {
    method: 'GET',
    path: '/me/uploads',
    requires: ['query', 'response'],
    query: { schema: meUploadsQuerySchema, value: { limit: '12' } },
    response: { schema: meUploadsResponseSchema, value: { items: [photo], nextCursor: null } },
  },
  // Círculos
  {
    method: 'GET',
    path: '/circles',
    requires: ['query', 'response'],
    query: { schema: listCirclesQuerySchema, value: {} },
    response: { schema: listCirclesResponseSchema, value: { items: [circle], nextCursor: null } },
  },
  {
    method: 'POST',
    path: '/circles',
    requires: ['body', 'response'],
    body: { schema: createCircleRequestSchema, value: { name: 'Familia', description: 'Casa' } },
    response: { schema: circleResponseSchema, value: circle },
  },
  {
    method: 'GET',
    path: '/circles/:circleId',
    requires: ['params', 'response'],
    params: CIRCLE_PARAMS,
    response: { schema: circleDetailResponseSchema, value: { ...circle, stats: circleStats } },
  },
  {
    method: 'PATCH',
    path: '/circles/:circleId',
    requires: ['params', 'body', 'response'],
    params: CIRCLE_PARAMS,
    body: { schema: updateCircleRequestSchema, value: { name: 'Familia' } },
    response: { schema: circleResponseSchema, value: circle },
  },
  {
    method: 'DELETE',
    path: '/circles/:circleId',
    requires: ['params', 'response'],
    params: CIRCLE_PARAMS,
    response: { schema: deleteCircleResponseSchema, value: undefined },
  },
  {
    method: 'GET',
    path: '/circles/:circleId/members',
    requires: ['params', 'query', 'response'],
    params: CIRCLE_PARAMS,
    query: { schema: listMembersQuerySchema, value: {} },
    response: {
      schema: listMembersResponseSchema,
      value: { items: [{ user, role: 'member', joinedAt: ISO }], nextCursor: null },
    },
  },
  {
    method: 'DELETE',
    path: '/circles/:circleId/members/:userId',
    requires: ['params', 'response'],
    params: {
      schema: circleMemberParamsSchema,
      value: { circleId: ID.circle, userId: ID.user },
    },
    response: { schema: removeMemberResponseSchema, value: undefined },
  },
  {
    method: 'POST',
    path: '/circles/:circleId/leave',
    requires: ['params', 'response'],
    params: CIRCLE_PARAMS,
    response: { schema: leaveCircleResponseSchema, value: undefined },
  },
  {
    method: 'GET',
    path: '/circles/:circleId/activity',
    requires: ['params', 'query', 'response'],
    params: { schema: circleActivityParamsSchema, value: { circleId: ID.circle } },
    query: { schema: activityQuerySchema, value: {} },
    response: {
      schema: activityResponseSchema,
      value: { items: [activityItem], nextCursor: null },
    },
  },
  {
    method: 'GET',
    path: '/activity',
    requires: ['query', 'response'],
    query: { schema: activityQuerySchema, value: {} },
    response: { schema: globalActivityResponseSchema, value: { items: [], nextCursor: null } },
  },
  // Invitaciones
  {
    method: 'POST',
    path: '/circles/:circleId/invitations',
    requires: ['params', 'body', 'response'],
    params: { schema: createInvitationParamsSchema, value: { circleId: ID.circle } },
    body: {
      schema: createInvitationRequestSchema,
      value: { invitedEmail: 'ana@example.com' },
    },
    response: {
      schema: createInvitationResponseSchema,
      value: { ...invitation, token: 'token-abc' },
    },
  },
  {
    method: 'GET',
    path: '/circles/:circleId/invitations',
    requires: ['params', 'query', 'response'],
    params: CIRCLE_PARAMS,
    query: { schema: listInvitationsQuerySchema, value: {} },
    response: {
      schema: listInvitationsResponseSchema,
      value: { items: [invitation], nextCursor: null },
    },
  },
  {
    method: 'DELETE',
    path: '/circles/:circleId/invitations/:invitationId',
    requires: ['params', 'response'],
    params: {
      schema: circleInvitationParamsSchema,
      value: { circleId: ID.circle, invitationId: ID.invitation },
    },
    response: { schema: revokeInvitationResponseSchema, value: undefined },
  },
  {
    method: 'GET',
    path: '/invitations/:token',
    requires: ['params', 'response'],
    params: TOKEN_PARAMS,
    response: {
      schema: invitationPreviewResponseSchema,
      value: {
        circleName: 'Familia',
        inviterName: 'Lucas',
        expiresAt: ISO,
        state: 'valid',
      },
    },
  },
  {
    method: 'POST',
    path: '/invitations/:token/accept',
    requires: ['params', 'response'],
    params: TOKEN_PARAMS,
    response: {
      schema: acceptInvitationResponseSchema,
      value: { circle, state: 'already_member' },
    },
  },
  // Álbumes
  {
    method: 'GET',
    path: '/circles/:circleId/albums',
    requires: ['params', 'query', 'response'],
    params: { schema: circleAlbumsParamsSchema, value: { circleId: ID.circle } },
    query: { schema: listAlbumsQuerySchema, value: {} },
    response: { schema: listAlbumsResponseSchema, value: { items: [album], nextCursor: null } },
  },
  {
    method: 'POST',
    path: '/circles/:circleId/albums',
    requires: ['params', 'body', 'response'],
    params: { schema: circleAlbumsParamsSchema, value: { circleId: ID.circle } },
    body: { schema: createAlbumRequestSchema, value: { title: 'Verano', date: ISO } },
    response: { schema: albumResponseSchema, value: album },
  },
  {
    method: 'GET',
    path: '/albums/:albumId',
    requires: ['params', 'response'],
    params: ALBUM_PARAMS,
    response: { schema: albumResponseSchema, value: album },
  },
  {
    method: 'PATCH',
    path: '/albums/:albumId',
    requires: ['params', 'body', 'response'],
    params: ALBUM_PARAMS,
    body: { schema: updateAlbumRequestSchema, value: { description: null } },
    response: { schema: albumResponseSchema, value: album },
  },
  {
    method: 'DELETE',
    path: '/albums/:albumId',
    requires: ['params', 'response'],
    params: ALBUM_PARAMS,
    response: { schema: deleteAlbumResponseSchema, value: undefined },
  },
  {
    method: 'DELETE',
    path: '/albums/:albumId/photos',
    requires: ['params', 'response'],
    params: ALBUM_PARAMS,
    response: { schema: emptyAlbumResponseSchema, value: { deletedCount: 18 } },
  },
  // Fotos
  {
    method: 'GET',
    path: '/albums/:albumId/photos',
    requires: ['params', 'query', 'response'],
    params: { schema: uploadPhotoParamsSchema, value: { albumId: ID.album } },
    query: { schema: albumPhotosQuerySchema, value: { personId: ID.user } },
    response: { schema: albumPhotosResponseSchema, value: { items: [photo], nextCursor: 'next' } },
  },
  {
    method: 'POST',
    path: '/albums/:albumId/photos',
    requires: ['params', 'body', 'response'],
    params: { schema: uploadPhotoParamsSchema, value: { albumId: ID.album } },
    // The binary `file` part is not modelled in Zod; F25 validates MIME/size.
    body: {
      schema: uploadPhotoFieldsSchema,
      value: { clientUploadId: 'upload-1', description: 'Playa' },
    },
    response: { schema: uploadPhotoResponseSchema, value: photo },
  },
  {
    method: 'GET',
    path: '/photos/:photoId',
    requires: ['params', 'response'],
    params: PHOTO_PARAMS,
    response: { schema: photoResponseSchema, value: photo },
  },
  {
    method: 'PATCH',
    path: '/photos/:photoId',
    requires: ['params', 'body', 'response'],
    params: PHOTO_PARAMS,
    body: {
      schema: updatePhotoRequestSchema,
      value: { description: null, placeName: 'Lisboa, Portugal' },
    },
    response: { schema: photoResponseSchema, value: photo },
  },
  {
    method: 'DELETE',
    path: '/photos/:photoId',
    requires: ['params', 'response'],
    params: PHOTO_PARAMS,
    response: { schema: deletePhotoResponseSchema, value: undefined },
  },
  {
    method: 'GET',
    path: '/photos/:photoId/image',
    requires: ['params', 'query'],
    params: PHOTO_PARAMS,
    query: { schema: photoImageQuerySchema, value: { size: 'thumb' } },
    binary: true,
  },
  {
    method: 'POST',
    path: '/photos/:photoId/tags',
    requires: ['params', 'body', 'response'],
    params: PHOTO_PARAMS,
    body: { schema: addPhotoTagRequestSchema, value: { userId: ID.user } },
    response: { schema: addPhotoTagResponseSchema, value: photoTag },
  },
  {
    method: 'DELETE',
    path: '/photos/:photoId/tags/:userId',
    requires: ['params', 'response'],
    params: { schema: photoTagParamsSchema, value: { photoId: ID.photo, userId: ID.user } },
    response: { schema: removePhotoTagResponseSchema, value: undefined },
  },
  {
    method: 'GET',
    path: '/circles/:circleId/members/:userId/photos',
    requires: ['params', 'query', 'response'],
    params: { schema: personPhotosParamsSchema, value: { circleId: ID.circle, userId: ID.user } },
    query: { schema: personPhotosQuerySchema, value: {} },
    response: { schema: personPhotosResponseSchema, value: { items: [photo], nextCursor: null } },
  },
  // Descargas
  {
    method: 'GET',
    path: '/photos/:photoId/download',
    requires: ['params'],
    params: { schema: downloadPhotoParamsSchema, value: { photoId: ID.photo } },
    binary: true,
  },
  {
    method: 'POST',
    path: '/albums/:albumId/downloads',
    requires: ['params', 'body', 'response'],
    params: { schema: createDownloadParamsSchema, value: { albumId: ID.album } },
    body: { schema: createDownloadRequestSchema, value: { photoIds: [ID.photo] } },
    response: { schema: createDownloadResponseSchema, value: downloadJob },
  },
  {
    method: 'GET',
    path: '/downloads/:jobId',
    requires: ['params', 'response'],
    params: { schema: downloadJobParamsSchema, value: { jobId: ID.job } },
    response: { schema: downloadJobResponseSchema, value: downloadJob },
  },
  {
    method: 'GET',
    path: '/downloads/:jobId/file',
    requires: ['params'],
    params: { schema: downloadJobParamsSchema, value: { jobId: ID.job } },
    binary: true,
  },
];

const EXPECTED_ENDPOINTS: readonly string[] = [
  'GET /health',
  'POST /auth/register',
  'POST /auth/login',
  'POST /auth/logout',
  'GET /auth/csrf',
  'GET /me',
  'PATCH /me',
  'GET /me/uploads',
  'GET /circles',
  'POST /circles',
  'GET /circles/:circleId',
  'PATCH /circles/:circleId',
  'DELETE /circles/:circleId',
  'GET /circles/:circleId/members',
  'DELETE /circles/:circleId/members/:userId',
  'POST /circles/:circleId/leave',
  'GET /circles/:circleId/activity',
  'GET /activity',
  'POST /circles/:circleId/invitations',
  'GET /circles/:circleId/invitations',
  'DELETE /circles/:circleId/invitations/:invitationId',
  'GET /invitations/:token',
  'POST /invitations/:token/accept',
  'GET /circles/:circleId/albums',
  'POST /circles/:circleId/albums',
  'GET /albums/:albumId',
  'PATCH /albums/:albumId',
  'DELETE /albums/:albumId',
  'DELETE /albums/:albumId/photos',
  'GET /albums/:albumId/photos',
  'POST /albums/:albumId/photos',
  'GET /photos/:photoId',
  'PATCH /photos/:photoId',
  'DELETE /photos/:photoId',
  'GET /photos/:photoId/image',
  'POST /photos/:photoId/tags',
  'DELETE /photos/:photoId/tags/:userId',
  'GET /circles/:circleId/members/:userId/photos',
  'GET /photos/:photoId/download',
  'POST /albums/:albumId/downloads',
  'GET /downloads/:jobId',
  'GET /downloads/:jobId/file',
];

const BINARY_ENDPOINTS = [
  'GET /photos/:photoId/image',
  'GET /photos/:photoId/download',
  'GET /downloads/:jobId/file',
];

function label(endpoint: EndpointContract): string {
  return `${endpoint.method} ${endpoint.path}`;
}

function missingParts(endpoint: EndpointContract): PartName[] {
  return endpoint.requires.filter((part) => endpoint[part] === undefined);
}

function expectValid(schema: z.ZodType, value: unknown, part: string): void {
  const result = schema.safeParse(value);

  expect(result.success ? null : result.error.issues, part).toBeNull();
}

describe('endpoint contract coverage', () => {
  it('declares every endpoint of api-contract.md, exactly once', () => {
    const declared = ENDPOINTS.map(label);

    expect(declared).toEqual(EXPECTED_ENDPOINTS);
    expect(new Set(declared).size).toBe(declared.length);
    expect(declared).toHaveLength(42);
  });

  it('declares every mandatory part of every endpoint', () => {
    for (const endpoint of ENDPOINTS) {
      expect(missingParts(endpoint), label(endpoint)).toEqual([]);
    }
  });

  it('fails when a required part is missing', () => {
    const incomplete: EndpointContract = {
      method: 'POST',
      path: '/example',
      requires: ['params', 'body', 'response'],
      response: { schema: emptyResponseSchema, value: undefined },
    };

    expect(missingParts(incomplete)).toEqual(['params', 'body']);
  });

  it('parses params, query, body and response for every endpoint', () => {
    for (const endpoint of ENDPOINTS) {
      const current = label(endpoint);

      if (endpoint.params) {
        expectValid(endpoint.params.schema, endpoint.params.value, `${current} params`);
      }

      if (endpoint.query) {
        expectValid(endpoint.query.schema, endpoint.query.value, `${current} query`);
      }

      if (endpoint.body) {
        expectValid(endpoint.body.schema, endpoint.body.value, `${current} body`);
      }

      if (endpoint.response) {
        expectValid(endpoint.response.schema, endpoint.response.value, `${current} response`);
      }
    }
  });

  it('only leaves the three binary endpoints without a JSON response schema', () => {
    const withoutResponse = ENDPOINTS.filter((endpoint) => endpoint.response === undefined);

    expect(withoutResponse.map(label)).toEqual(BINARY_ENDPOINTS);

    for (const endpoint of withoutResponse) {
      expect(endpoint.binary, `${label(endpoint)} must be flagged as binary`).toBe(true);
      expect(endpoint.requires, `${label(endpoint)} must not require a response`).not.toContain(
        'response',
      );
    }

    for (const endpoint of ENDPOINTS) {
      if (!endpoint.binary) {
        expect(endpoint.requires, `${label(endpoint)} must require a response`).toContain(
          'response',
        );
      }
    }
  });
});

describe('every endpoint part rejects malformed payloads', () => {
  it('does not accept empty params ids or tokens', () => {
    expect(circleParamsSchema.safeParse({ circleId: '' }).success).toBe(false);
    expect(circleMemberParamsSchema.safeParse({ circleId: ID.circle, userId: '' }).success).toBe(
      false,
    );
    expect(albumParamsSchema.safeParse({ albumId: '' }).success).toBe(false);
    expect(photoParamsSchema.safeParse({ photoId: '' }).success).toBe(false);
    expect(photoTagParamsSchema.safeParse({ photoId: ID.photo, userId: '' }).success).toBe(false);
    expect(downloadJobParamsSchema.safeParse({ jobId: '' }).success).toBe(false);
    expect(invitationTokenParamsSchema.safeParse({ token: '' }).success).toBe(false);
    expect(
      circleInvitationParamsSchema.safeParse({ circleId: ID.circle, invitationId: '' }).success,
    ).toBe(false);
    expect(personPhotosParamsSchema.safeParse({ circleId: ID.circle, userId: '' }).success).toBe(
      false,
    );
  });

  it('uses Spanish messages for shared input constraints', () => {
    const id = idSchema.safeParse('');
    const limit = pageQuerySchema.safeParse({ limit: '0' });

    expect(id.success ? null : id.error.issues[0]?.message).toBe(
      'El identificador es obligatorio.',
    );
    expect(limit.success ? null : limit.error.issues[0]?.message).toBe(
      'El límite debe estar entre 1 y 100.',
    );
  });
});

const INVALID_CASES: ReadonlyArray<readonly [string, z.ZodType, unknown]> = [
  [
    'register: 7-character password',
    registerRequestSchema,
    { name: 'Ana', email: 'a@b.co', password: '1234567' },
  ],
  [
    'register: 129-character password',
    registerRequestSchema,
    { name: 'Ana', email: 'a@b.co', password: 'x'.repeat(129) },
  ],
  [
    'register: malformed email',
    registerRequestSchema,
    { name: 'Ana', email: 'no-es-email', password: '12345678' },
  ],
  [
    'register: blank name',
    registerRequestSchema,
    { name: '   ', email: 'a@b.co', password: '12345678' },
  ],
  [
    'register: 81-character name',
    registerRequestSchema,
    { name: 'x'.repeat(81), email: 'a@b.co', password: '12345678' },
  ],
  ['login: empty password', loginRequestSchema, { email: 'a@b.co', password: '' }],
  ['updateMe: empty body', updateMeRequestSchema, {}],
  ['updateCircle: empty body', updateCircleRequestSchema, {}],
  [
    'updateCircle: 501-character description',
    updateCircleRequestSchema,
    { description: 'x'.repeat(501) },
  ],
  ['updateAlbum: empty body', updateAlbumRequestSchema, {}],
  ['createAlbum: 121-character title', createAlbumRequestSchema, { title: 'x'.repeat(121) }],
  [
    'createAlbum: 1001-character description',
    createAlbumRequestSchema,
    { title: 'Verano', description: 'x'.repeat(1001) },
  ],
  ['updatePhoto: empty body', updatePhotoRequestSchema, {}],
  ['updatePhoto: invalid date', updatePhotoRequestSchema, { takenAt: 'ayer' }],
  [
    'updatePhoto: 1001-character description',
    updatePhotoRequestSchema,
    { description: 'x'.repeat(1001) },
  ],
  ['updatePhoto: 201-character place', updatePhotoRequestSchema, { placeName: 'x'.repeat(201) }],
  ['photo image: unknown size', photoImageQuerySchema, { size: 'huge' }],
  ['upload: missing clientUploadId', uploadPhotoFieldsSchema, { description: 'Playa' }],
  [
    'upload: 129-character clientUploadId',
    uploadPhotoFieldsSchema,
    { clientUploadId: 'x'.repeat(129) },
  ],
  ['gallery: empty personId', albumPhotosQuerySchema, { personId: '' }],
  ['tag: empty userId', addPhotoTagRequestSchema, { userId: '' }],
  ['download: empty selection', createDownloadRequestSchema, { photoIds: [] }],
  [
    'download: 501 photos',
    createDownloadRequestSchema,
    {
      photoIds: Array.from(
        { length: MAX_DOWNLOAD_PHOTOS + 1 },
        (_value, index) => `photo-${index}`,
      ),
    },
  ],
  ['pagination: limit 0', pageQuerySchema, { limit: '0' }],
  ['pagination: limit 101', pageQuerySchema, { limit: '101' }],
  ['pagination: fractional limit', pageQuerySchema, { limit: '2.5' }],
  [
    'pagination: 513-character cursor',
    pageQuerySchema,
    { cursor: 'x'.repeat(MAX_CURSOR_LENGTH + 1) },
  ],
  [
    'activity: unknown type',
    activityResponseSchema,
    { items: [{ ...activityItem, type: 'photo.deleted' }], nextCursor: null },
  ],
  [
    'health: unknown status',
    healthResponseSchema,
    { status: 'degraded', version: '1', timestamp: ISO },
  ],
  [
    'invitation preview: unknown state',
    invitationPreviewDtoSchema,
    { circleName: 'Familia', inviterName: 'Lucas', expiresAt: ISO, state: 'pending' },
  ],
  ['circle settings: unknown flag', circleSettingsSchema, { ...settings, membersCanInvite: true }],
  ['circle settings: incomplete', circleSettingsSchema, { membersCanUpload: true }],
];

describe('negative cases', () => {
  it.each(INVALID_CASES)('%s', (_name, schema, value) => {
    expect(schema.safeParse(value).success).toBe(false);
  });
});

describe('exact boundaries', () => {
  it('accepts the largest allowed input values', () => {
    expect(
      registerRequestSchema.safeParse({
        name: 'x'.repeat(80),
        email: 'a@b.co',
        password: 'x'.repeat(128),
      }).success,
    ).toBe(true);
    expect(pageQuerySchema.parse({ limit: '1' })).toEqual({ limit: 1 });
    expect(pageQuerySchema.parse({ limit: String(MAX_PAGE_LIMIT) })).toEqual({
      limit: MAX_PAGE_LIMIT,
    });
    expect(pageQuerySchema.safeParse({ cursor: 'x'.repeat(MAX_CURSOR_LENGTH) }).success).toBe(true);
    expect(
      createCircleRequestSchema.safeParse({ name: 'x'.repeat(80), description: 'x'.repeat(500) })
        .success,
    ).toBe(true);
    expect(
      createAlbumRequestSchema.safeParse({
        title: 'x'.repeat(120),
        description: 'x'.repeat(1000),
      }).success,
    ).toBe(true);
    expect(updatePhotoRequestSchema.safeParse({ placeName: 'x'.repeat(200) }).success).toBe(true);
    expect(updatePhotoRequestSchema.safeParse({ description: 'x'.repeat(1000) }).success).toBe(
      true,
    );
    expect(uploadPhotoFieldsSchema.safeParse({ clientUploadId: 'x'.repeat(128) }).success).toBe(
      true,
    );
  });

  it('accepts any password of 8 characters without composition rules', () => {
    for (const password of ['abcdefgh', '12345678', '        ', 'contraseña']) {
      expect(
        registerRequestSchema.safeParse({ name: 'Ana', email: 'a@b.co', password }).success,
      ).toBe(true);
    }
  });

  it('normalises emails to lowercase and trims names on input', () => {
    const parsed = registerRequestSchema.parse({
      name: '  Lucas  ',
      email: '  Lucas@Example.COM ',
      password: '12345678',
    });

    expect(parsed.email).toBe('lucas@example.com');
    expect(parsed.name).toBe('Lucas');
  });

  it('rejects non-permitted image MIME types in the photo DTO', () => {
    expect(photoDtoSchema.safeParse({ ...photo, mimeType: 'image/gif' }).success).toBe(false);
    expect(photoDtoSchema.safeParse({ ...photo, mimeType: 'image/heic' }).success).toBe(false);
    expect(photoDtoSchema.safeParse({ ...photo, mimeType: 'image/webp' }).success).toBe(true);
  });
});

describe('204 responses have no body', () => {
  it('accepts undefined and rejects any object', () => {
    expect(emptyResponseSchema.safeParse(undefined).success).toBe(true);
    expect(emptyResponseSchema.safeParse({}).success).toBe(false);
    expect(emptyResponseSchema.safeParse(null).success).toBe(false);
  });
});

describe('pagination contracts', () => {
  it('applies the shared default to every list query', () => {
    expect(pageQuerySchema.parse({})).toEqual({ limit: DEFAULT_PAGE_LIMIT });
    expect(albumPhotosQuerySchema.parse({})).toEqual({ limit: DEFAULT_PAGE_LIMIT });
    expect(meUploadsQuerySchema.parse({})).toEqual({ limit: DEFAULT_PAGE_LIMIT });
    expect(listCirclesQuerySchema.parse({})).toEqual({ limit: DEFAULT_PAGE_LIMIT });
    expect(listAlbumsQuerySchema.parse({})).toEqual({ limit: DEFAULT_PAGE_LIMIT });
    expect(listMembersQuerySchema.parse({})).toEqual({ limit: DEFAULT_PAGE_LIMIT });
    expect(listInvitationsQuerySchema.parse({})).toEqual({ limit: DEFAULT_PAGE_LIMIT });
    expect(activityQuerySchema.parse({})).toEqual({ limit: DEFAULT_PAGE_LIMIT });
    expect(personPhotosQuerySchema.parse({})).toEqual({ limit: DEFAULT_PAGE_LIMIT });
  });

  it('defaults the image size to display', () => {
    expect(photoImageQuerySchema.parse({})).toEqual({ size: 'display' });
    expect(photoImageQuerySchema.parse({ size: 'original' })).toEqual({ size: 'original' });
  });
});

describe('download limits', () => {
  it('caps a selection at 500 photos', () => {
    expect(MAX_DOWNLOAD_BYTES).toBe(2 * 1024 * 1024 * 1024);
    expect(
      createDownloadRequestSchema.safeParse({
        photoIds: Array.from({ length: MAX_DOWNLOAD_PHOTOS }, (_value, index) => `photo-${index}`),
      }).success,
    ).toBe(true);
  });
});

describe('invitation acceptance', () => {
  it('returns the same state enum as the invitation preview', () => {
    expect(acceptInvitationResponseSchema.safeParse({ circle, state: 'valid' }).success).toBe(true);
    expect(
      acceptInvitationResponseSchema.safeParse({ circle, state: 'already_member' }).success,
    ).toBe(true);
  });

  it('has no parallel boolean and strips it if a client sends it', () => {
    expect(Object.keys(acceptInvitationResponseSchema.shape)).toEqual(['circle', 'state']);

    const parsed = acceptInvitationResponseSchema.parse({
      circle,
      state: 'valid',
      alreadyMember: true,
    });

    expect(parsed).toEqual({ circle, state: 'valid' });
    expect(parsed).not.toHaveProperty('alreadyMember');
  });
});

describe('download progress and upload correlation', () => {
  it('exposes clientUploadId on photos, nullable', () => {
    expect(photoDtoSchema.parse(photo).clientUploadId).toBe('upload-1');
    expect(photoDtoSchema.parse({ ...photo, clientUploadId: null }).clientUploadId).toBeNull();
    expect(photoDtoSchema.safeParse({ ...photo, clientUploadId: undefined }).success).toBe(false);
  });

  it('accepts progress between 0 and 100, or null', () => {
    expect(downloadJobDtoSchema.parse(downloadJob).progress).toBe(42);
    expect(downloadJobDtoSchema.safeParse({ ...downloadJob, progress: 0 }).success).toBe(true);
    expect(downloadJobDtoSchema.safeParse({ ...downloadJob, progress: 100 }).success).toBe(true);
    expect(downloadJobDtoSchema.safeParse({ ...downloadJob, progress: null }).success).toBe(true);
    expect(downloadJobDtoSchema.safeParse({ ...downloadJob, progress: -1 }).success).toBe(false);
    expect(downloadJobDtoSchema.safeParse({ ...downloadJob, progress: 101 }).success).toBe(false);
    expect(downloadJobDtoSchema.safeParse({ ...downloadJob, progress: 12.5 }).success).toBe(false);
  });
});

describe('DTO privacy', () => {
  const FORBIDDEN_KEYS = [
    'objectKey',
    'originalKey',
    'displayKey',
    'thumbKey',
    'tokenHash',
    'passwordHash',
    'latitude',
    'longitude',
    'coverPhotoId',
  ];

  const DTO_SCHEMAS: ReadonlyArray<readonly [string, z.ZodObject]> = [
    ['userDto', userDtoSchema],
    ['currentUserDto', currentUserDtoSchema],
    ['photoDto', photoDtoSchema],
    ['albumDto', albumDtoSchema],
    ['circleDto', circleDtoSchema],
    ['circleDetailDto', circleDetailDtoSchema],
    ['memberDto', memberDtoSchema],
    ['invitationDto', invitationDtoSchema],
    ['createdInvitationDto', createdInvitationDtoSchema],
    ['downloadJobDto', downloadJobDtoSchema],
    ['photoTagDto', photoTagDtoSchema],
    ['activityItemDto', activityItemDtoSchema],
  ];

  it.each(DTO_SCHEMAS)('%s exposes no internal keys', (_name, schema) => {
    for (const key of FORBIDDEN_KEYS) {
      expect(Object.keys(schema.shape)).not.toContain(key);
    }
  });

  it('strips storage keys and GPS coordinates from a photo payload', () => {
    const parsed = photoDtoSchema.parse({
      ...photo,
      objectKey: 'circles/x/photos/y/original.jpg',
      originalKey: 'circles/x/photos/y/original.jpg',
      tokenHash: 'hash',
      latitude: 39.5,
      longitude: 2.6,
    });

    expect(parsed).not.toHaveProperty('objectKey');
    expect(parsed).not.toHaveProperty('originalKey');
    expect(parsed).not.toHaveProperty('tokenHash');
    expect(parsed).not.toHaveProperty('latitude');
    expect(parsed).not.toHaveProperty('longitude');
  });

  it('keeps the invitation token out of the owner list DTO', () => {
    const parsed = invitationDtoSchema.parse({
      ...invitation,
      token: 'token-abc',
      tokenHash: 'hash',
    });

    expect(parsed).not.toHaveProperty('token');
    expect(parsed).not.toHaveProperty('tokenHash');
    expect(createdInvitationDtoSchema.parse({ ...invitation, token: 'token-abc' }).token).toBe(
      'token-abc',
    );
  });

  it('never exposes password hashes on the current user', () => {
    const parsed = currentUserDtoSchema.parse({ ...currentUser, passwordHash: '$argon2id$' });

    expect(parsed).not.toHaveProperty('passwordHash');
  });

  it('serialises persisted values longer than the input limits', () => {
    const parsed = photoDtoSchema.parse({
      ...photo,
      description: 'x'.repeat(2000),
      placeName: 'y'.repeat(500),
      clientUploadId: 'z'.repeat(200),
    });

    expect(parsed.description).toHaveLength(2000);
    expect(parsed.placeName).toHaveLength(500);
    expect(parsed.clientUploadId).toHaveLength(200);
    expect(albumDtoSchema.parse({ ...album, title: 'T'.repeat(200) }).title).toHaveLength(200);
    expect(
      circleDtoSchema.parse({ ...circle, description: 'D'.repeat(900) }).description,
    ).toHaveLength(900);
    expect(
      downloadJobDtoSchema.parse({ ...downloadJob, errorMessage: 'E'.repeat(900) }).errorMessage,
    ).toHaveLength(900);
  });
});

describe('activity contract', () => {
  it('matches the documented payload', () => {
    const payload = {
      items: [activityItem],
      nextCursor: null,
    };

    expect(activityResponseSchema.parse(payload)).toEqual(payload);
  });

  it('accepts events without an album', () => {
    expect(
      activityResponseSchema.safeParse({
        items: [{ ...activityItem, type: 'member.joined', album: null }],
        nextCursor: null,
      }).success,
    ).toBe(true);
  });
});

describe('multi-circle safety', () => {
  it('keeps circle ids on photos, albums and invitations', () => {
    expect(photoDtoSchema.parse(photo).circleId).toBe(ID.circle);
    expect(albumDtoSchema.parse(album).circleId).toBe(ID.circle);
    expect(invitationDtoSchema.parse(invitation).circleId).toBe(ID.circle);
  });
});
