import {
  INVALID_CREDENTIALS_MESSAGE,
  type CsrfResponse,
  type ErrorResponse,
  type SessionUserResponse,
} from '@memora/shared';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  CSRF_COOKIE_NAME,
  hashSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
} from '../modules/auth/session.ts';
import { LOGIN_IP_RATE_LIMIT_MAX } from '../modules/auth/routes.ts';
import { closeTestPrismaClient, getTestPrismaClient, hasDatabaseUrl, resetDb } from './db.ts';
import { makeSession, makeUser } from './factories.ts';
import { createTestApp, TEST_APP_URL, type TestApp } from './harness.ts';

const hasDatabase = hasDatabaseUrl();

const ORIGIN = TEST_APP_URL;
const PASSWORD = 'correct-horse-battery-staple';
const EMAIL = 'lucia@example.test';

interface SetCookieHeaders {
  readonly 'set-cookie'?: string | string[] | undefined;
}

function readSetCookies(headers: SetCookieHeaders): string[] {
  const raw = headers['set-cookie'];

  if (typeof raw === 'string') {
    return [raw];
  }

  return Array.isArray(raw) ? raw : [];
}

function cookieLine(headers: SetCookieHeaders, name: string): string | undefined {
  return readSetCookies(headers).find((line) => line.startsWith(`${name}=`));
}

function cookieValue(headers: SetCookieHeaders, name: string): string | undefined {
  const line = cookieLine(headers, name);

  if (line === undefined) {
    return undefined;
  }

  const [pair = ''] = line.split(';');

  return pair.slice(name.length + 1);
}

function trustedHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return { origin: ORIGIN, ...extra };
}

function sessionCookie(token: string): Record<string, string> {
  return { cookie: `${SESSION_COOKIE_NAME}=${token}` };
}

/**
 * Auth integration suite.
 *
 * Every test gets a fresh app (fresh rate-limit stores) over the shared test
 * Prisma client, so the real limits are exercised without relaxing them.
 */
describe.skipIf(!hasDatabase)('auth API', () => {
  let testApp: TestApp;

  beforeEach(async () => {
    await resetDb();
    testApp = await createTestApp({ prisma: getTestPrismaClient() });
  });

  afterEach(async () => {
    await testApp.close();
  });

  afterAll(async () => {
    await closeTestPrismaClient();
  });

  function register(overrides: Partial<{ name: string; email: string; password: string }> = {}) {
    return testApp.app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: trustedHeaders(),
      payload: { name: 'Lucía', email: EMAIL, password: PASSWORD, ...overrides },
    });
  }

  async function registerAndGetSession(
    overrides: Partial<{ name: string; email: string; password: string }> = {},
  ): Promise<{ token: string; user: SessionUserResponse['user'] }> {
    const response = await register(overrides);
    expect(response.statusCode).toBe(201);

    const token = cookieValue(response.headers, SESSION_COOKIE_NAME);

    if (token === undefined) {
      throw new Error('register did not set a session cookie');
    }

    return { token, user: response.json<SessionUserResponse>().user };
  }

  async function issueCsrf(sessionToken: string): Promise<string> {
    const response = await testApp.app.inject({
      method: 'GET',
      url: '/api/auth/csrf',
      headers: sessionCookie(sessionToken),
    });

    expect(response.statusCode).toBe(200);

    return response.json<CsrfResponse>().csrfToken;
  }

  describe('POST /api/auth/register', () => {
    it('creates the user and a session, and never returns the password hash (AC-01)', async () => {
      const response = await register();
      const prisma = getTestPrismaClient();

      expect(response.statusCode).toBe(201);

      const body = response.json<SessionUserResponse>();
      expect(body.user).toMatchObject({
        name: 'Lucía',
        email: EMAIL,
        themePreference: 'system',
        avatarUrl: null,
      });
      expect(Object.keys(body.user).sort()).toEqual([
        'avatarUrl',
        'createdAt',
        'email',
        'id',
        'name',
        'themePreference',
      ]);
      expect(response.body).not.toContain('passwordHash');

      const user = await prisma.user.findUnique({ where: { email: EMAIL } });
      expect(user).not.toBeNull();
      expect(user?.passwordHash).not.toBe(PASSWORD);
      // Real Argon2id, not a placeholder.
      expect(user?.passwordHash.startsWith('$argon2id$')).toBe(true);

      const token = cookieValue(response.headers, SESSION_COOKIE_NAME);
      expect(token).toBeDefined();

      const session = await prisma.session.findUnique({
        where: { tokenHash: hashSessionToken(token ?? '') },
      });
      expect(session).not.toBeNull();
      expect(session?.userId).toBe(user?.id);
      expect(session?.tokenHash).toBe(hashSessionToken(token ?? ''));
      // Only the hash is stored: the raw token is never persisted.
      expect(session?.tokenHash).not.toBe(token);
    });

    it('rejects a duplicated email with 409 CONFLICT and a field detail', async () => {
      await register();
      const response = await register({ name: 'Otra Lucía' });
      const body = response.json<ErrorResponse>();

      expect(response.statusCode).toBe(409);
      expect(body.code).toBe('CONFLICT');
      expect(body.details).toEqual([
        { field: 'email', message: 'Ya existe una cuenta con ese email.' },
      ]);
      await expect(getTestPrismaClient().user.count()).resolves.toBe(1);
    });

    it('treats emails case-insensitively when detecting duplicates', async () => {
      await register({ email: 'Lucia@Example.test' });
      const response = await register({ email: 'lucia@example.test' });

      expect(response.statusCode).toBe(409);
      expect(response.json<ErrorResponse>().code).toBe('CONFLICT');
      await expect(getTestPrismaClient().user.count()).resolves.toBe(1);
    });
  });

  describe('POST /api/auth/login', () => {
    it('rotates the session: the old cookie stops working and only one row remains', async () => {
      const first = await registerAndGetSession();
      const response = await testApp.app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: trustedHeaders(sessionCookie(first.token)),
        payload: { email: EMAIL, password: PASSWORD },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json<SessionUserResponse>().user.id).toBe(first.user.id);

      const secondToken = cookieValue(response.headers, SESSION_COOKIE_NAME);
      if (secondToken === undefined) {
        throw new Error('login did not set a session cookie');
      }
      expect(secondToken).not.toBe(first.token);

      const oldSession = await testApp.app.inject({
        method: 'GET',
        url: '/api/me',
        headers: sessionCookie(first.token),
      });
      const newSession = await testApp.app.inject({
        method: 'GET',
        url: '/api/me',
        headers: sessionCookie(secondToken),
      });

      expect(oldSession.statusCode).toBe(401);
      expect(newSession.statusCode).toBe(200);
      expect(newSession.json<SessionUserResponse>().user.id).toBe(first.user.id);
      await expect(getTestPrismaClient().session.count()).resolves.toBe(1);
    });

    it('answers identically for an unknown email and a wrong password (AC-02)', async () => {
      await registerAndGetSession();

      const unknown = await testApp.app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: trustedHeaders(),
        payload: { email: 'nobody@example.test', password: PASSWORD },
      });
      const wrongPassword = await testApp.app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: trustedHeaders(),
        payload: { email: EMAIL, password: 'wrong-password' },
      });

      expect(unknown.statusCode).toBe(401);
      expect(wrongPassword.statusCode).toBe(401);
      expect(unknown.json<ErrorResponse>()).toEqual(wrongPassword.json<ErrorResponse>());

      const body = unknown.json<ErrorResponse>();
      expect(body.code).toBe('UNAUTHENTICATED');
      expect(body.message).toBe(INVALID_CREDENTIALS_MESSAGE);
      expect(body.details).toBeNull();
      // Neither failure creates a session.
      await expect(getTestPrismaClient().session.count()).resolves.toBe(1);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('invalidates the session and clears the cookies (AC-03)', async () => {
      const { token } = await registerAndGetSession();
      const csrfToken = await issueCsrf(token);

      const logout = await testApp.app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: trustedHeaders({
          ...sessionCookie(token),
          'x-csrf-token': csrfToken,
        }),
      });

      expect(logout.statusCode).toBe(204);
      expect(logout.body).toBe('');

      const cleared = readSetCookies(logout.headers);
      expect(cleared.some((line) => line.startsWith(`${SESSION_COOKIE_NAME}=;`))).toBe(true);

      const me = await testApp.app.inject({
        method: 'GET',
        url: '/api/me',
        headers: sessionCookie(token),
      });

      expect(me.statusCode).toBe(401);
      expect(me.json<ErrorResponse>().code).toBe('UNAUTHENTICATED');
      await expect(getTestPrismaClient().session.count()).resolves.toBe(0);
    });

    it('requires a session', async () => {
      const response = await testApp.app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: trustedHeaders(),
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('session cookie', () => {
    it('uses HttpOnly, SameSite=Lax, Path=/ and 30 days, without Secure outside production (AC-04)', async () => {
      const response = await register();
      const line = cookieLine(response.headers, SESSION_COOKIE_NAME);

      expect(line).toBeDefined();
      expect(line).toContain('HttpOnly');
      expect(line).toContain('SameSite=Lax');
      expect(line).toContain('Path=/');
      expect(line).toContain(`Max-Age=${SESSION_DURATION_SECONDS}`);
      expect(line).not.toContain('Secure');
    });

    it('adds Secure only in production', async () => {
      const productionApp = await createTestApp({
        env: { NODE_ENV: 'production' },
        markServicesReal: true,
        prisma: getTestPrismaClient(),
      });

      try {
        const response = await productionApp.app.inject({
          method: 'POST',
          url: '/api/auth/register',
          headers: { origin: productionApp.config.appUrl },
          payload: { name: 'Lucía', email: EMAIL, password: PASSWORD },
        });

        expect(response.statusCode).toBe(201);
        expect(cookieLine(response.headers, SESSION_COOKIE_NAME)).toContain('Secure');
      } finally {
        await productionApp.close();
      }
    });

    it('exposes a readable CSRF cookie with the same lifetime', async () => {
      const { token } = await registerAndGetSession();
      const response = await testApp.app.inject({
        method: 'GET',
        url: '/api/auth/csrf',
        headers: sessionCookie(token),
      });

      const line = cookieLine(response.headers, CSRF_COOKIE_NAME);
      expect(line).toBeDefined();
      expect(line).not.toContain('HttpOnly');
      expect(line).toContain('SameSite=Lax');
      expect(line).toContain('Path=/');
      expect(line).toContain(`Max-Age=${SESSION_DURATION_SECONDS}`);
    });
  });

  describe('CSRF', () => {
    it('requires a session on GET /api/auth/csrf', async () => {
      const response = await testApp.app.inject({ method: 'GET', url: '/api/auth/csrf' });

      expect(response.statusCode).toBe(401);
    });

    it('rejects a missing or invalid token on authenticated mutations (AC-05)', async () => {
      const { token } = await registerAndGetSession();

      const missing = await testApp.app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: trustedHeaders(sessionCookie(token)),
      });
      const invalid = await testApp.app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: trustedHeaders({
          ...sessionCookie(token),
          'x-csrf-token': 'not-a-real-token',
        }),
      });

      expect(missing.statusCode).toBe(403);
      expect(missing.json<ErrorResponse>().code).toBe('FORBIDDEN');
      expect(invalid.statusCode).toBe(403);
      expect(invalid.json<ErrorResponse>().code).toBe('FORBIDDEN');
      await expect(getTestPrismaClient().session.count()).resolves.toBe(1);
    });

    it('clears the previous CSRF cookie on login', async () => {
      const { token } = await registerAndGetSession();
      const staleCsrf = await issueCsrf(token);

      const login = await testApp.app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: trustedHeaders({
          cookie: `${SESSION_COOKIE_NAME}=${token}; ${CSRF_COOKIE_NAME}=${staleCsrf}`,
        }),
        payload: { email: EMAIL, password: PASSWORD },
      });

      expect(login.statusCode).toBe(200);

      const line = cookieLine(login.headers, CSRF_COOKIE_NAME);
      expect(line).toBeDefined();
      expect(line?.startsWith(`${CSRF_COOKIE_NAME}=;`)).toBe(true);
    });

    it('rejects a token bound to another session', async () => {
      const first = await registerAndGetSession();
      const second = await registerAndGetSession({
        name: 'Mario',
        email: 'mario@example.test',
      });
      const firstCsrf = await issueCsrf(first.token);

      const response = await testApp.app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: trustedHeaders({
          ...sessionCookie(second.token),
          'x-csrf-token': firstCsrf,
        }),
      });

      expect(response.statusCode).toBe(403);
      expect(response.json<ErrorResponse>().code).toBe('FORBIDDEN');
      await expect(getTestPrismaClient().session.count()).resolves.toBe(2);
    });
  });

  describe('Origin / Referer', () => {
    it('rejects an untrusted or missing origin on register', async () => {
      const untrusted = await testApp.app.inject({
        method: 'POST',
        url: '/api/auth/register',
        headers: { origin: 'http://evil.example' },
        payload: { name: 'Lucía', email: EMAIL, password: PASSWORD },
      });
      const missing = await testApp.app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: { name: 'Lucía', email: EMAIL, password: PASSWORD },
      });

      expect(untrusted.statusCode).toBe(403);
      expect(untrusted.json<ErrorResponse>().code).toBe('FORBIDDEN');
      expect(missing.statusCode).toBe(403);
      expect(missing.json<ErrorResponse>().code).toBe('FORBIDDEN');
      await expect(getTestPrismaClient().user.count()).resolves.toBe(0);
    });

    it('rejects an untrusted or missing origin on login', async () => {
      const { user } = await registerAndGetSession();

      const untrusted = await testApp.app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: { origin: 'http://evil.example' },
        payload: { email: user.email, password: PASSWORD },
      });
      const missing = await testApp.app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: user.email, password: PASSWORD },
      });

      expect(untrusted.statusCode).toBe(403);
      expect(missing.statusCode).toBe(403);
    });

    it('rejects an untrusted origin on authenticated mutations and accepts Referer', async () => {
      const { token } = await registerAndGetSession();
      const csrfToken = await issueCsrf(token);

      const missingOrigin = await testApp.app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: { ...sessionCookie(token), 'x-csrf-token': csrfToken },
      });
      expect(missingOrigin.statusCode).toBe(403);
      await expect(getTestPrismaClient().session.count()).resolves.toBe(1);

      const withReferer = await testApp.app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: {
          ...sessionCookie(token),
          'x-csrf-token': csrfToken,
          referer: `${ORIGIN}/circles/one`,
        },
      });
      expect(withReferer.statusCode).toBe(204);
    });
  });

  describe('rate limits', () => {
    it('rejects the sixth login attempt in the window with 429 (AC-06)', async () => {
      await registerAndGetSession();

      const attempt = () =>
        testApp.app.inject({
          method: 'POST',
          url: '/api/auth/login',
          headers: trustedHeaders(),
          payload: { email: EMAIL, password: 'wrong-password' },
        });

      for (let index = 0; index < 5; index += 1) {
        expect((await attempt()).statusCode).toBe(401);
      }

      const limited = await attempt();
      expect(limited.statusCode).toBe(429);
      expect(limited.json<ErrorResponse>()).toMatchObject({
        code: 'RATE_LIMITED',
        details: null,
      });
    });

    it('aggregates login attempts per IP across different emails (M-01)', async () => {
      const attempt = (index: number) =>
        testApp.app.inject({
          method: 'POST',
          url: '/api/auth/login',
          headers: trustedHeaders(),
          payload: { email: `spray-${index}@example.test`, password: PASSWORD },
        });

      // The per-IP+email limiter never fires: every attempt uses a new email.
      for (let index = 0; index < LOGIN_IP_RATE_LIMIT_MAX; index += 1) {
        expect((await attempt(index)).statusCode).toBe(401);
      }

      const limited = await attempt(LOGIN_IP_RATE_LIMIT_MAX);
      expect(limited.statusCode).toBe(429);
      expect(limited.json<ErrorResponse>()).toMatchObject({
        code: 'RATE_LIMITED',
        details: null,
      });
    });

    it('rejects the fourth registration from the same IP with 429', async () => {
      for (let index = 0; index < 3; index += 1) {
        const allowed = await register({ email: `user-${index}@example.test` });
        expect(allowed.statusCode).toBe(201);
      }

      const limited = await register({ email: 'user-3@example.test' });
      expect(limited.statusCode).toBe(429);
      expect(limited.json<ErrorResponse>().code).toBe('RATE_LIMITED');
    });
  });

  describe('GET /api/me', () => {
    it('returns the current user with a valid session', async () => {
      const { token, user } = await registerAndGetSession();

      const response = await testApp.app.inject({
        method: 'GET',
        url: '/api/me',
        headers: sessionCookie(token),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json<SessionUserResponse>().user).toEqual(user);
    });

    it('returns 401 without a session or with an unknown cookie', async () => {
      const anonymous = await testApp.app.inject({ method: 'GET', url: '/api/me' });
      const unknown = await testApp.app.inject({
        method: 'GET',
        url: '/api/me',
        headers: sessionCookie('not-a-real-token'),
      });

      expect(anonymous.statusCode).toBe(401);
      expect(anonymous.json<ErrorResponse>().code).toBe('UNAUTHENTICATED');
      expect(unknown.statusCode).toBe(401);
    });

    it('marks GET /me and GET /auth/csrf as private and non-cacheable (M-05)', async () => {
      const { token } = await registerAndGetSession();

      const me = await testApp.app.inject({
        method: 'GET',
        url: '/api/me',
        headers: sessionCookie(token),
      });
      const csrf = await testApp.app.inject({
        method: 'GET',
        url: '/api/auth/csrf',
        headers: sessionCookie(token),
      });

      for (const response of [me, csrf]) {
        expect(response.statusCode).toBe(200);
        expect(response.headers['cache-control']).toBe('private, no-store');
        expect(response.headers.vary).toBe('Cookie');
      }
    });

    it('refreshes lastUsedAt lazily after five minutes of inactivity', async () => {
      const prisma = getTestPrismaClient();
      const user = await makeUser(prisma);
      const token = 'stale-usage-token';
      const staleLastUsedAt = new Date(Date.now() - 10 * 60 * 1000);

      const session = await makeSession(prisma, {
        userId: user.id,
        tokenHash: hashSessionToken(token),
        lastUsedAt: staleLastUsedAt,
      });

      const before = Date.now();
      const response = await testApp.app.inject({
        method: 'GET',
        url: '/api/me',
        headers: sessionCookie(token),
      });

      expect(response.statusCode).toBe(200);

      const stored = await prisma.session.findUnique({ where: { id: session.id } });
      expect(stored?.lastUsedAt.getTime()).toBeGreaterThanOrEqual(before - 1_000);
      expect(stored?.lastUsedAt.getTime()).toBeGreaterThan(staleLastUsedAt.getTime());
    });

    it('returns 401 and deletes the row for an expired session (AC-07)', async () => {
      const prisma = getTestPrismaClient();
      const user = await makeUser(prisma);
      const token = 'expired-session-token';

      await makeSession(prisma, {
        userId: user.id,
        tokenHash: hashSessionToken(token),
        expiresAt: new Date(Date.now() - 60_000),
      });

      const response = await testApp.app.inject({
        method: 'GET',
        url: '/api/me',
        headers: sessionCookie(token),
      });

      expect(response.statusCode).toBe(401);
      expect(response.json<ErrorResponse>().code).toBe('UNAUTHENTICATED');
      await expect(
        prisma.session.count({ where: { tokenHash: hashSessionToken(token) } }),
      ).resolves.toBe(0);
    });
  });

  describe('PATCH /api/me', () => {
    it('updates name and themePreference', async () => {
      const { token } = await registerAndGetSession();
      const csrfToken = await issueCsrf(token);

      const renamed = await testApp.app.inject({
        method: 'PATCH',
        url: '/api/me',
        headers: trustedHeaders({ ...sessionCookie(token), 'x-csrf-token': csrfToken }),
        payload: { name: 'Lucía Actualizada' },
      });
      expect(renamed.statusCode).toBe(200);
      expect(renamed.json<SessionUserResponse>().user.name).toBe('Lucía Actualizada');

      const themed = await testApp.app.inject({
        method: 'PATCH',
        url: '/api/me',
        headers: trustedHeaders({ ...sessionCookie(token), 'x-csrf-token': csrfToken }),
        payload: { themePreference: 'dark' },
      });
      expect(themed.statusCode).toBe(200);
      expect(themed.json<SessionUserResponse>().user.themePreference).toBe('dark');

      const stored = await getTestPrismaClient().user.findUnique({ where: { email: EMAIL } });
      expect(stored?.name).toBe('Lucía Actualizada');
      expect(stored?.themePreference).toBe('dark');
    });

    it('rejects an email field and an empty body', async () => {
      const { token } = await registerAndGetSession();
      const csrfToken = await issueCsrf(token);

      const withEmail = await testApp.app.inject({
        method: 'PATCH',
        url: '/api/me',
        headers: trustedHeaders({ ...sessionCookie(token), 'x-csrf-token': csrfToken }),
        payload: { email: 'other@example.test' },
      });
      const empty = await testApp.app.inject({
        method: 'PATCH',
        url: '/api/me',
        headers: trustedHeaders({ ...sessionCookie(token), 'x-csrf-token': csrfToken }),
        payload: {},
      });

      expect(withEmail.statusCode).toBe(400);
      const emailError = withEmail.json<ErrorResponse>();
      expect(emailError.code).toBe('VALIDATION_ERROR');
      expect(emailError.details).toEqual([
        { field: 'email', message: 'El email no se puede cambiar.' },
      ]);

      expect(empty.statusCode).toBe(400);
      expect(empty.json<ErrorResponse>().code).toBe('VALIDATION_ERROR');

      const stored = await getTestPrismaClient().user.findUnique({ where: { email: EMAIL } });
      expect(stored?.email).toBe(EMAIL);
    });

    it('requires a session and a CSRF token', async () => {
      const anonymous = await testApp.app.inject({
        method: 'PATCH',
        url: '/api/me',
        headers: trustedHeaders(),
        payload: { name: 'Nadie' },
      });
      expect(anonymous.statusCode).toBe(401);

      const { token } = await registerAndGetSession();
      const withoutCsrf = await testApp.app.inject({
        method: 'PATCH',
        url: '/api/me',
        headers: trustedHeaders(sessionCookie(token)),
        payload: { name: 'Sin CSRF' },
      });
      expect(withoutCsrf.statusCode).toBe(403);
    });

    it('acts only on the session user, never on an id from the client', async () => {
      const first = await registerAndGetSession();
      const second = await registerAndGetSession({
        name: 'Mario',
        email: 'mario@example.test',
      });
      const secondCsrf = await issueCsrf(second.token);

      const response = await testApp.app.inject({
        method: 'PATCH',
        url: '/api/me',
        headers: trustedHeaders({
          ...sessionCookie(second.token),
          'x-csrf-token': secondCsrf,
        }),
        payload: { name: 'Mario Actualizado', id: first.user.id },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json<SessionUserResponse>().user).toMatchObject({
        id: second.user.id,
        name: 'Mario Actualizado',
      });

      const prisma = getTestPrismaClient();
      const untouched = await prisma.user.findUnique({ where: { id: first.user.id } });
      expect(untouched?.name).toBe(first.user.name);
    });
  });
});
