import type { CurrentUserDto } from '@memora/shared';

import { createBrowserApiClient } from '../lib/api-client';

/** Origen simulado por MSW en los tests de autenticación. */
export const AUTH_TEST_ORIGIN = 'http://localhost:3000';

/** El `POST` real sale a `${AUTH_TEST_ORIGIN}/api/...`. */
export const AUTH_TEST_API_BASE = `${AUTH_TEST_ORIGIN}/api`;

export const testAuthClient = createBrowserApiClient({ basePath: AUTH_TEST_API_BASE });

export const testUser: CurrentUserDto = {
  id: 'usr_test_1',
  name: 'Sofía Martín',
  email: 'sofia@example.com',
  avatarUrl: null,
  themePreference: 'system',
  createdAt: '2026-11-03T10:00:00.000Z',
};

export const AUTH_LOGIN_URL = `${AUTH_TEST_ORIGIN}/api/auth/login`;
export const AUTH_REGISTER_URL = `${AUTH_TEST_ORIGIN}/api/auth/register`;
