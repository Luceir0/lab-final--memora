import type { CookieSerializeOptions } from '@fastify/cookie';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { createHash, randomBytes } from 'node:crypto';

import type { AppConfig } from '../../config.ts';
import { ApiError } from '../../errors.ts';
import type { Prisma, PrismaClient, Session, User } from '../../generated/prisma/client.ts';
import { CSRF_COOKIE_NAME, SESSION_COOKIE_NAME } from './constants.ts';

export { CSRF_COOKIE_NAME, SESSION_COOKIE_NAME };

/** 30 days, as fixed by `docs/03-architecture/auth.md`. */
export const SESSION_DURATION_SECONDS = 30 * 24 * 60 * 60;

/** `lastUsedAt` is refreshed lazily once this much time has elapsed. */
export const SESSION_LAST_USED_REFRESH_MS = 5 * 60 * 1000;

export interface CreatedSession {
  readonly token: string;
  readonly sessionId: string;
}

export type SessionWithUser = Session & { readonly user: User };

export interface ResolvedSession {
  /** Raw session token; never logged nor persisted. */
  readonly token: string;
  readonly session: Session;
  readonly user: User;
}

/** 32 random bytes encoded as base64url. */
export function createSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

/** `SHA-256(token)` as lowercase hex: the only form stored in the database. */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function sessionExpiresAt(now: Date): Date {
  return new Date(now.getTime() + SESSION_DURATION_SECONDS * 1000);
}

/** Prisma create input for a new session; used inside auth transactions. */
export function buildSessionCreateData(
  userId: string,
  token: string,
  now: Date,
): Prisma.SessionUncheckedCreateInput {
  return {
    userId,
    tokenHash: hashSessionToken(token),
    expiresAt: sessionExpiresAt(now),
    lastUsedAt: now,
  };
}

/** Creates a fresh session for `userId`. */
export async function createSession(
  prisma: PrismaClient,
  userId: string,
  now: Date = new Date(),
): Promise<CreatedSession> {
  const token = createSessionToken();
  const session = await prisma.session.create({
    data: buildSessionCreateData(userId, token, now),
  });

  return { token, sessionId: session.id };
}

/** Cookie options shared by the session and CSRF cookies. */
function baseCookieOptions(config: AppConfig): CookieSerializeOptions {
  return {
    path: '/',
    sameSite: 'lax',
    secure: config.isProduction,
    ...(config.cookieDomain === undefined ? {} : { domain: config.cookieDomain }),
  };
}

export function sessionCookieOptions(config: AppConfig): CookieSerializeOptions {
  return {
    ...baseCookieOptions(config),
    httpOnly: true,
    maxAge: SESSION_DURATION_SECONDS,
  };
}

export function csrfCookieOptions(config: AppConfig): CookieSerializeOptions {
  return {
    ...baseCookieOptions(config),
    httpOnly: false,
    maxAge: SESSION_DURATION_SECONDS,
  };
}

export function setSessionCookie(reply: FastifyReply, config: AppConfig, token: string): void {
  reply.setCookie(SESSION_COOKIE_NAME, token, sessionCookieOptions(config));
}

export function setCsrfCookie(reply: FastifyReply, config: AppConfig, token: string): void {
  reply.setCookie(CSRF_COOKIE_NAME, token, csrfCookieOptions(config));
}

/**
 * Removes a stale CSRF cookie.
 *
 * Login and registration start a new session, so the previous CSRF token no
 * longer verifies; the client must request a fresh one from `GET /auth/csrf`.
 */
export function clearCsrfCookie(reply: FastifyReply, config: AppConfig): void {
  reply.clearCookie(CSRF_COOKIE_NAME, baseCookieOptions(config));
}

/** Removes both auth cookies from the browser. */
export function clearAuthCookies(reply: FastifyReply, config: AppConfig): void {
  const options = baseCookieOptions(config);

  reply.clearCookie(SESSION_COOKIE_NAME, options);
  reply.clearCookie(CSRF_COOKIE_NAME, options);
}

/**
 * Resolves the session cookie into a live session.
 *
 * Expiry is checked lazily: a stale row is deleted on read and the response is
 * 401 (AC-07). `lastUsedAt` is refreshed at most every five minutes.
 */
export async function resolveSession(
  prisma: PrismaClient,
  config: AppConfig,
  request: FastifyRequest,
  reply: FastifyReply,
  now: Date = new Date(),
): Promise<ResolvedSession> {
  const token = request.cookies[SESSION_COOKIE_NAME];

  if (typeof token !== 'string' || token.length === 0) {
    throw new ApiError('UNAUTHENTICATED');
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: true },
  });

  if (session === null) {
    clearAuthCookies(reply, config);
    throw new ApiError('UNAUTHENTICATED');
  }

  if (session.expiresAt.getTime() <= now.getTime()) {
    // Lazy cleanup: the scheduled purge is deferred to F42.
    await prisma.session.deleteMany({ where: { id: session.id } });
    clearAuthCookies(reply, config);
    throw new ApiError('UNAUTHENTICATED');
  }

  if (now.getTime() - session.lastUsedAt.getTime() >= SESSION_LAST_USED_REFRESH_MS) {
    await prisma.session.updateMany({ where: { id: session.id }, data: { lastUsedAt: now } });
    session.lastUsedAt = now;
  }

  return { token, session, user: session.user };
}

/** Deletes the session that a previous cookie pointed at, if it still exists. */
export async function revokeSessionToken(
  prisma: PrismaClient,
  token: string | undefined,
): Promise<void> {
  if (typeof token !== 'string' || token.length === 0) {
    return;
  }

  await prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
}
