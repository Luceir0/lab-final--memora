import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PAGE_LIMIT,
  MAX_CURSOR_LENGTH,
  MY_UPLOADS_PREVIEW_LIMIT,
  myUploadsPhotosQuerySchema,
  myUploadsPhotosResponseSchema,
  myUploadsSummarySchema,
} from '../index.js';

const ISO = '2026-11-06T10:00:00.000Z';

const photo = {
  id: 'clxphoto00000000000000001',
  thumbUrl: '/api/photos/clxphoto00000000000000001/image?size=thumb',
  width: 1600,
  height: 1200,
};

function previews(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    ...photo,
    id: `clxphoto0000000000000000${index}`,
  }));
}

describe('my uploads schemas', () => {
  it('applies the shared limit default and requires albumId', () => {
    expect(myUploadsPhotosQuerySchema.parse({ albumId: 'album-1' })).toEqual({
      albumId: 'album-1',
      limit: DEFAULT_PAGE_LIMIT,
    });

    expect(myUploadsPhotosQuerySchema.safeParse({}).success).toBe(false);
    expect(myUploadsPhotosQuerySchema.safeParse({ albumId: 'album-1', limit: '0' }).success).toBe(
      false,
    );
    expect(myUploadsPhotosQuerySchema.safeParse({ albumId: 'album-1', limit: '101' }).success).toBe(
      false,
    );
    expect(
      myUploadsPhotosQuerySchema.safeParse({
        albumId: 'album-1',
        cursor: 'x'.repeat(MAX_CURSOR_LENGTH + 1),
      }).success,
    ).toBe(false);
  });

  it('caps album previews at four photos', () => {
    const summary = {
      total: 5,
      circles: [
        {
          circle: { id: 'circle-1', name: 'Familia' },
          photosCount: 5,
          albums: [
            {
              album: { id: 'album-1', title: 'Costa Brava' },
              photosCount: 5,
              lastUploadAt: ISO,
              preview: previews(MY_UPLOADS_PREVIEW_LIMIT),
            },
          ],
        },
      ],
    };

    expect(myUploadsSummarySchema.safeParse(summary).success).toBe(true);
    expect(
      myUploadsSummarySchema.safeParse({
        ...summary,
        circles: [
          {
            ...summary.circles[0],
            albums: [
              {
                ...summary.circles[0]?.albums[0],
                preview: previews(MY_UPLOADS_PREVIEW_LIMIT + 1),
              },
            ],
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('accepts a page of PhotoDto with total and a nullable cursor', () => {
    const response = {
      items: [
        {
          id: photo.id,
          circleId: 'circle-1',
          albumId: 'album-1',
          uploader: { id: 'user-1', name: 'Lucía', avatarUrl: null },
          clientUploadId: null,
          description: null,
          takenAt: null,
          placeName: null,
          mimeType: 'image/jpeg',
          size: 1024,
          width: 1600,
          height: 1200,
          thumbUrl: photo.thumbUrl,
          displayUrl: '/api/photos/clxphoto00000000000000001/image?size=display',
          tags: [],
          createdAt: ISO,
          updatedAt: ISO,
        },
      ],
      nextCursor: null,
      total: 1,
    };

    expect(myUploadsPhotosResponseSchema.safeParse(response).success).toBe(true);
    expect(myUploadsPhotosResponseSchema.safeParse({ ...response, total: -1 }).success).toBe(false);
  });
});
