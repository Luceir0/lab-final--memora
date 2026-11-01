import type { ErrorCode, ErrorResponse, HealthResponse } from '@memora/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildApp } from './app.ts';
import { loadConfig } from './config.ts';
import { startServer } from './server.ts';
import { createFakeServices } from './test/fakes.ts';
import { createTestApp, TEST_SESSION_SECRET, type TestApp } from './test/harness.ts';

function expectUniformError(body: ErrorResponse, code: ErrorCode): void {
  expect(body.code).toBe(code);
  expect(body.message.length).toBeGreaterThan(0);
  // Contract invariant: an array is never empty; "no details" is always null.
  expect(body.details === null || body.details.length > 0).toBe(true);
}

describe('GET /api/health', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('returns only status, version and timestamp (AC-01)', async () => {
    const response = await testApp.app.inject({ method: 'GET', url: '/api/health' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');

    const body = response.json<HealthResponse>();
    expect(Object.keys(body).sort()).toEqual(['status', 'timestamp', 'version']);
    expect(body.status).toBe('ok');
    expect(body.version).toBe('0.0.0');
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
  });

  it('does not set a session cookie or leak configuration', async () => {
    const response = await testApp.app.inject({ method: 'GET', url: '/api/health' });

    expect(response.headers['set-cookie']).toBeUndefined();
    expect(response.body).not.toContain('SESSION_SECRET');
    expect(response.body).not.toContain(TEST_SESSION_SECRET);
    expect(response.body).not.toContain('postgresql');
  });

  it('sends the security headers', async () => {
    const response = await testApp.app.inject({ method: 'GET', url: '/api/health' });

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  it('relaxes only the development style CSP for Swagger UI', async () => {
    const response = await testApp.app.inject({ method: 'GET', url: '/api/health' });
    const csp = String(response.headers['content-security-policy']);
    const scriptDirective = csp.split(';').find((part) => part.trim().startsWith('script-src'));
    const styleDirective = csp.split(';').find((part) => part.trim().startsWith('style-src'));

    expect(scriptDirective).toBe("script-src 'self'");
    expect(scriptDirective).not.toContain('unsafe-inline');
    expect(styleDirective).toContain('unsafe-inline');
    expect(csp).not.toContain('upgrade-insecure-requests');
  });
});

describe('uniform errors', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp({ testRoutes: true });
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('returns 404 for unknown routes with details null', async () => {
    const response = await testApp.app.inject({ method: 'GET', url: '/api/does-not-exist' });

    expect(response.statusCode).toBe(404);

    const body = response.json<ErrorResponse>();
    expectUniformError(body, 'NOT_FOUND');
    expect(body.details).toBeNull();
  });

  it('returns 400 with non-empty details for a schema validation error (AC-02)', async () => {
    const response = await testApp.app.inject({
      method: 'POST',
      url: '/api/__test__/validate',
      payload: {},
    });

    expect(response.statusCode).toBe(400);

    const body = response.json<ErrorResponse>();
    expectUniformError(body, 'VALIDATION_ERROR');
    expect(body.details).not.toBeNull();
    expect(body.details).not.toEqual([]);
    expect(body.details?.[0]?.field).toBe('message');
    expect(body.details?.[0]?.message).toMatch(/se esperaba texto/i);
  });

  it('returns 400 with a field detail for a wrong type', async () => {
    const response = await testApp.app.inject({
      method: 'POST',
      url: '/api/__test__/validate',
      payload: { message: 42 },
    });

    expect(response.statusCode).toBe(400);

    const body = response.json<ErrorResponse>();
    expectUniformError(body, 'VALIDATION_ERROR');
    expect(body.details?.[0]?.field).toBe('message');
  });

  it('returns 400 with details null for malformed JSON', async () => {
    const response = await testApp.app.inject({
      method: 'POST',
      url: '/api/__test__/validate',
      headers: { 'content-type': 'application/json' },
      payload: '{"message":',
    });

    expect(response.statusCode).toBe(400);

    const body = response.json<ErrorResponse>();
    expectUniformError(body, 'VALIDATION_ERROR');
    expect(body.details).toBeNull();
  });

  it('maps oversized JSON bodies to 413 PAYLOAD_TOO_LARGE with details null', async () => {
    const response = await testApp.app.inject({
      method: 'POST',
      url: '/api/__test__/validate',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ message: 'x'.repeat(1_100_000) }),
    });

    expect(response.statusCode).toBe(413);

    const body = response.json<ErrorResponse>();
    expectUniformError(body, 'PAYLOAD_TOO_LARGE');
    expect(body.details).toBeNull();
  });

  it('maps unsupported content types to 415', async () => {
    const response = await testApp.app.inject({
      method: 'POST',
      url: '/api/__test__/validate',
      headers: { 'content-type': 'application/xml' },
      payload: '<message>hola</message>',
    });

    expect(response.statusCode).toBe(415);
    expectUniformError(response.json<ErrorResponse>(), 'UNSUPPORTED_MEDIA_TYPE');
  });

  it('does not leak an internal error message or stack (AC-03)', async () => {
    const response = await testApp.app.inject({ method: 'GET', url: '/api/__test__/boom' });

    expect(response.statusCode).toBe(500);

    const body = response.json<ErrorResponse>();
    expectUniformError(body, 'INTERNAL_ERROR');
    expect(body.details).toBeNull();
    expect(response.body).not.toContain('boom');
    expect(response.body).not.toContain('at ');
  });
});

describe('production error handling', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp({
      env: { NODE_ENV: 'production' },
      testRoutes: true,
      markServicesReal: true,
    });
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('returns a canonical 500 without stack traces', async () => {
    const response = await testApp.app.inject({ method: 'GET', url: '/api/__test__/boom' });

    expect(response.statusCode).toBe(500);

    const body = response.json<ErrorResponse>();
    expectUniformError(body, 'INTERNAL_ERROR');
    expect(body.message).toBe('Ha ocurrido un error inesperado.');
    expect(body.details).toBeNull();
    expect(response.body).not.toContain('boom');
    expect(response.body).not.toContain('stack');
    expect(response.body).not.toContain('.ts');
  });

  it('keeps the strict production CSP', async () => {
    const response = await testApp.app.inject({ method: 'GET', url: '/api/health' });
    const csp = String(response.headers['content-security-policy']);
    const scriptDirective = csp.split(';').find((part) => part.trim().startsWith('script-src'));

    expect(csp).toContain('upgrade-insecure-requests');
    expect(scriptDirective).toBeDefined();
    expect(scriptDirective).not.toContain('unsafe-inline');
  });
});

describe('startup', () => {
  it('fails closed in production without injected services', async () => {
    const config = loadConfig({
      NODE_ENV: 'production',
      SESSION_SECRET: TEST_SESSION_SECRET,
      DATABASE_URL: 'postgresql://memora:memora@127.0.0.1:5432/memora',
    });

    await expect(startServer(config)).rejects.toThrow(/adaptadores reales/);
  });

  it('rejects fake adapters in production from buildApp itself', async () => {
    const config = loadConfig({
      NODE_ENV: 'production',
      SESSION_SECRET: TEST_SESSION_SECRET,
      DATABASE_URL: 'postgresql://memora:memora@127.0.0.1:5432/memora',
    });

    await expect(
      buildApp({ config, logger: false, services: createFakeServices() }),
    ).rejects.toThrow(/adaptadores reales/);

    await expect(startServer(config, { services: createFakeServices() })).rejects.toThrow(
      /adaptadores reales/,
    );
  });
});

describe('rate limiting', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp({ rateLimitMax: 2, testRoutes: true });
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('returns 429 RATE_LIMITED with details null after the ceiling', async () => {
    const request = () =>
      testApp.app.inject({
        method: 'POST',
        url: '/api/__test__/validate',
        payload: { message: 'hola' },
      });

    expect((await request()).statusCode).toBe(200);
    expect((await request()).statusCode).toBe(200);

    const limited = await request();
    expect(limited.statusCode).toBe(429);

    const body = limited.json<ErrorResponse>();
    expectUniformError(body, 'RATE_LIMITED');
    expect(body.details).toBeNull();
  });
});

async function injectMalformedMultipart(payload: string): Promise<{
  statusCode: number;
  body: ErrorResponse;
  logs: string;
}> {
  const lines: string[] = [];
  const appWithLogs = await createTestApp({
    env: { LOG_LEVEL: 'info' },
    loggerStream: {
      write: (message: string) => {
        lines.push(message);
      },
    },
    testRoutes: true,
  });

  try {
    const response = await appWithLogs.app.inject({
      method: 'POST',
      url: '/api/__test__/upload',
      headers: { 'content-type': 'multipart/form-data; boundary=abc' },
      payload,
    });

    return {
      statusCode: response.statusCode,
      body: response.json<ErrorResponse>(),
      logs: lines.join('\n'),
    };
  } finally {
    await appWithLogs.close();
  }
}

describe('multipart errors', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp({ testRoutes: true });
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('maps a non-multipart content type (406) to 415 UNSUPPORTED_MEDIA_TYPE', async () => {
    const response = await testApp.app.inject({
      method: 'POST',
      url: '/api/__test__/upload',
      headers: { 'content-type': 'application/json' },
      payload: { clientUploadId: 'abc' },
    });

    expect(response.statusCode).toBe(415);

    const body = response.json<ErrorResponse>();
    expectUniformError(body, 'UNSUPPORTED_MEDIA_TYPE');
    expect(body.details).toBeNull();
  });

  it('rejects multipart without boundary as a client error, not a 500', async () => {
    const lines: string[] = [];
    const appWithLogs = await createTestApp({
      env: { LOG_LEVEL: 'info' },
      loggerStream: {
        write: (message: string) => {
          lines.push(message);
        },
      },
      testRoutes: true,
    });

    try {
      const response = await appWithLogs.app.inject({
        method: 'POST',
        url: '/api/__test__/upload',
        headers: { 'content-type': 'multipart/form-data' },
        payload: 'sin boundary',
      });

      expect(response.statusCode).toBe(415);

      const body = response.json<ErrorResponse>();
      expectUniformError(body, 'UNSUPPORTED_MEDIA_TYPE');
      expect(body.details).toBeNull();
      expect(lines.join('\n')).not.toContain('"level":50');
    } finally {
      await appWithLogs.close();
    }
  });

  it('rejects a declared boundary with garbage body as 400, not 500', async () => {
    const result = await injectMalformedMultipart('garbage-no-delimiters');

    expect(result.statusCode).toBe(400);
    expectUniformError(result.body, 'VALIDATION_ERROR');
    expect(result.body.details).toBeNull();
    expect(result.logs).not.toContain('"level":50');
  });

  it('rejects a truncated multipart body as 400, not 500', async () => {
    const result = await injectMalformedMultipart(
      [
        '--abc',
        'Content-Disposition: form-data; name="file"; filename="truncated.jpg"',
        'Content-Type: image/jpeg',
        '',
        'partial-bytes-without-closing-delimiter',
      ].join('\r\n'),
    );

    expect(result.statusCode).toBe(400);
    expectUniformError(result.body, 'VALIDATION_ERROR');
    expect(result.body.details).toBeNull();
    expect(result.logs).not.toContain('"level":50');
  });

  it('accepts a well-formed multipart upload', async () => {
    const boundary = '----memoraTestBoundary';
    const payload = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="clientUploadId"',
      '',
      'client-upload-1',
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="test.jpg"',
      'Content-Type: image/jpeg',
      '',
      'binary-image-bytes',
      `--${boundary}--`,
      '',
    ].join('\r\n');

    const response = await testApp.app.inject({
      method: 'POST',
      url: '/api/__test__/upload',
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json<{ filename: string; size: number }>()).toMatchObject({
      filename: 'test.jpg',
      size: 'binary-image-bytes'.length,
    });
  });
});

describe('test harness', () => {
  it('works with inject and never opens a port (AC-05)', async () => {
    const testApp = await createTestApp();

    try {
      expect(testApp.app.server.listening).toBe(false);

      const response = await testApp.app.inject({ method: 'GET', url: '/api/health' });
      expect(response.statusCode).toBe(200);
    } finally {
      await testApp.close();
    }
  });

  it('injects in-memory service fakes', async () => {
    const testApp = await createTestApp();

    try {
      await testApp.app.services.storage.put('photos/one.webp', Buffer.from('image'), 'image/webp');
      const stored = await testApp.app.services.storage.get('photos/one.webp');

      expect(stored?.contentType).toBe('image/webp');
      expect(stored?.body.toString()).toBe('image');

      await testApp.app.services.email.send({
        to: 'lucia@example.test',
        subject: 'Invitación',
        text: 'Hola',
      });
      expect(testApp.services.email.messages).toHaveLength(1);

      const place = await testApp.app.services.geocoding.reverse({
        latitude: 39.57,
        longitude: 2.65,
      });
      expect(place).toBe('Palma, Mallorca');
      expect(testApp.services.geocoding.requests).toEqual([
        { latitude: 39.57, longitude: 2.65 },
      ]);

      await testApp.app.services.storage.delete('photos/one.webp');
      expect(await testApp.app.services.storage.get('photos/one.webp')).toBeNull();
    } finally {
      await testApp.close();
    }
  });

  it('fails closed when services are not configured', async () => {
    const app = await buildApp({
      config: loadConfig({
        NODE_ENV: 'test',
        SESSION_SECRET: TEST_SESSION_SECRET,
        LOG_LEVEL: 'silent',
      }),
      logger: false,
    });

    try {
      await app.ready();
      await expect(app.services.storage.get('missing')).rejects.toThrow(/no está configurado/);
    } finally {
      await app.close();
    }
  });
});

describe('CSRF helpers', () => {
  it('creates and verifies double-submit tokens', async () => {
    const testApp = await createTestApp();

    try {
      const sessionSecret = 'session-token-for-csrf';
      const token = testApp.app.csrf.create(sessionSecret);

      expect(token.length).toBeGreaterThan(0);
      expect(testApp.app.csrf.verify(sessionSecret, token)).toBe(true);
      expect(testApp.app.csrf.verify(`${sessionSecret}-other`, token)).toBe(false);
      expect(testApp.app.csrf.verify(sessionSecret, 'garbage')).toBe(false);
    } finally {
      await testApp.close();
    }
  });
});
