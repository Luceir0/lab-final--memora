import type { ErrorDetail } from '@memora/shared';
import { describe, expect, it } from 'vitest';

import { ApiError, errorResponse, mapError } from './errors.ts';

describe('errorResponse', () => {
  it('defaults details to null', () => {
    expect(errorResponse('NOT_FOUND').details).toBeNull();
  });

  it('normalizes an empty array to null', () => {
    expect(errorResponse('NOT_FOUND', { details: [] }).details).toBeNull();
  });

  it('keeps valid details', () => {
    const body = errorResponse('VALIDATION_ERROR', {
      details: [{ field: 'email', message: 'Introduce un email válido.' }],
    });

    expect(body.details).toHaveLength(1);
  });

  it('rejects empty detail objects from the shared schema', () => {
    const invalid = [{}] as unknown as ErrorDetail[];

    expect(() => errorResponse('VALIDATION_ERROR', { details: invalid })).toThrow(TypeError);
  });

  it('rejects empty detail messages from the shared schema', () => {
    const invalid = [{ message: '' }] as unknown as ErrorDetail[];

    expect(() => errorResponse('VALIDATION_ERROR', { details: invalid })).toThrow(TypeError);
  });
});

describe('ApiError', () => {
  it('uses the canonical status and message', () => {
    const error = new ApiError('ALBUM_NOT_EMPTY');

    expect(error.statusCode).toBe(409);
    expect(error.toResponse()).toEqual({
      code: 'ALBUM_NOT_EMPTY',
      message: 'El álbum todavía tiene fotos.',
      details: null,
    });
  });

  it('rejects invalid details at construction time', () => {
    expect(
      () => new ApiError('VALIDATION_ERROR', { details: [{}] as unknown as ErrorDetail[] }),
    ).toThrow(TypeError);
  });
});

describe('mapError', () => {
  it('maps the multipart invalid content type (406) to 415', () => {
    const mapped = mapError({
      code: 'FST_INVALID_MULTIPART_CONTENT_TYPE',
      statusCode: 406,
    });

    expect(mapped.statusCode).toBe(415);
    expect(mapped.body.code).toBe('UNSUPPORTED_MEDIA_TYPE');
    expect(mapped.isServerError).toBe(false);
  });

  it('maps an invalid JSON form field (406) to 400 VALIDATION_ERROR', () => {
    const mapped = mapError({
      code: 'FST_INVALID_JSON_FIELD_ERROR',
      statusCode: 406,
    });

    expect(mapped.statusCode).toBe(400);
    expect(mapped.body.code).toBe('VALIDATION_ERROR');
    expect(mapped.isServerError).toBe(false);
  });

  it('does not map every 406 to 415', () => {
    const mapped = mapError({ statusCode: 406 });

    expect(mapped.statusCode).toBe(400);
    expect(mapped.body.code).toBe('VALIDATION_ERROR');
  });

  it('keeps FILE_TOO_LARGE for a multipart file limit', () => {
    const mapped = mapError({ code: 'FST_REQ_FILE_TOO_LARGE', statusCode: 413 });

    expect(mapped.statusCode).toBe(413);
    expect(mapped.body.code).toBe('FILE_TOO_LARGE');
  });

  it('maps multipart part limits to PAYLOAD_TOO_LARGE', () => {
    for (const code of ['FST_FILES_LIMIT', 'FST_FIELDS_LIMIT', 'FST_PARTS_LIMIT']) {
      const mapped = mapError({ code, statusCode: 413 });

      expect(mapped.statusCode).toBe(413);
      expect(mapped.body.code).toBe('PAYLOAD_TOO_LARGE');
    }
  });

  it('maps a busboy malformed-body Error without status to 400', () => {
    for (const message of [
      'Unexpected end of multipart data',
      'file terminated early due to unexpected end of multipart data',
      'Multipart: Boundary not found',
      'Boundary required',
    ]) {
      const mapped = mapError(new Error(message));

      expect(mapped.statusCode).toBe(400);
      expect(mapped.body.code).toBe('VALIDATION_ERROR');
      expect(mapped.isServerError).toBe(false);
    }
  });

  it('maps a premature close to 400 only inside a multipart request', () => {
    const error = Object.assign(new Error('Premature close'), {
      code: 'ERR_STREAM_PREMATURE_CLOSE',
    });

    expect(mapError(error).statusCode).toBe(500);
    expect(mapError(error, { isMultipartRequest: true }).statusCode).toBe(400);
    expect(mapError(error, { isMultipartRequest: true }).body.code).toBe('VALIDATION_ERROR');
  });

  it('does not normalize unknown FST_ codes by prefix', () => {
    const mapped = mapError({ code: 'FST_UNKNOWN_PARSER_ERROR' });

    expect(mapped.statusCode).toBe(500);
    expect(mapped.body.code).toBe('INTERNAL_ERROR');
  });

  it('keeps server errors whose message mentions multipart as 500', () => {
    const mapped = mapError(new Error('Invalid multipart state in storage adapter'));

    expect(mapped.statusCode).toBe(500);
    expect(mapped.body.code).toBe('INTERNAL_ERROR');
    expect(mapped.isServerError).toBe(true);
  });

  it('maps a generic 413 to PAYLOAD_TOO_LARGE', () => {
    const mapped = mapError({ statusCode: 413 });

    expect(mapped.statusCode).toBe(413);
    expect(mapped.body.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('maps an unknown error to INTERNAL_ERROR without leaking it', () => {
    const mapped = mapError(new Error('secret internal detail'));

    expect(mapped.statusCode).toBe(500);
    expect(mapped.body.code).toBe('INTERNAL_ERROR');
    expect(mapped.body.message).not.toContain('secret internal detail');
    expect(mapped.body.details).toBeNull();
  });
});
