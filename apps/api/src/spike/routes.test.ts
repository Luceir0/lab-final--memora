import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildServer, type MemoraServer } from '../build-server.ts';

describe('spike routes', () => {
  let server: MemoraServer;

  beforeAll(async () => {
    server = buildServer({ logger: false });

    // Test-only route: exercises the 500 branch without shipping it in production.
    server.get('/api/spike/boom', async () => {
      throw new Error('boom');
    });

    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  it('GET /api/health returns the agreed contract', async () => {
    const response = await server.inject({ method: 'GET', url: '/api/health' });

    expect(response.statusCode).toBe(200);

    const body = response.json<{ status: string; version: string; timestamp: string }>();
    expect(body.status).toBe('ok');
    expect(body.version).toBe('0.0.0');
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
  });

  it('POST /api/spike/echo returns the typed response', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/spike/echo',
      payload: { message: '  hola memoria  ' },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json<{ message: string; receivedAt: string }>();
    expect(body.message).toBe('hola memoria');
    expect(Number.isNaN(Date.parse(body.receivedAt))).toBe(false);
  });

  it('POST /api/spike/echo rejects a body without message', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/spike/echo',
      payload: {},
    });

    expect(response.statusCode).toBe(400);

    const body = response.json<{
      code: string;
      message: string;
      details: Array<{ field: string; message: string }>;
    }>();
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.details.length).toBeGreaterThan(0);
    expect(body.details[0]?.field).toBe('message');
    expect(body.details[0]?.message.length).toBeGreaterThan(0);
  });

  it('POST /api/spike/echo rejects a wrong type', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/spike/echo',
      payload: { message: 42 },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json<{ code: string }>().code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/spike/echo rejects whitespace-only messages', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/spike/echo',
      payload: { message: '   ' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json<{ code: string }>().code).toBe('VALIDATION_ERROR');
  });

  it('rejects malformed JSON with a uniform validation error', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/spike/echo',
      headers: { 'content-type': 'application/json' },
      payload: '{"message":',
    });

    expect(response.statusCode).toBe(400);

    const body = response.json<{ code: string; message: string; details: unknown[] }>();
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.details).toEqual([]);
  });

  it('rejects bodies above the 1 MB limit with 413', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/spike/echo',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ message: 'x'.repeat(1_100_000) }),
    });

    expect(response.statusCode).toBe(413);

    const body = response.json<{ code: string; message: string; details: unknown[] }>();
    expect(body).toEqual({
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Request payload is too large',
      details: [],
    });
  });

  it('maps unexpected errors to 500 without leaking the error message', async () => {
    const response = await server.inject({ method: 'GET', url: '/api/spike/boom' });

    expect(response.statusCode).toBe(500);

    const body = response.json<{ code: string; message: string; details: unknown[] }>();
    expect(body).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: [],
    });
    expect(response.body).not.toContain('boom');
  });

  it('unknown routes return a uniform NOT_FOUND error', async () => {
    const response = await server.inject({ method: 'GET', url: '/api/does-not-exist' });

    expect(response.statusCode).toBe(404);

    const body = response.json<{ code: string; message: string; details: unknown[] }>();
    expect(body).toEqual({
      code: 'NOT_FOUND',
      message: 'Route not found',
      details: [],
    });
  });
});
