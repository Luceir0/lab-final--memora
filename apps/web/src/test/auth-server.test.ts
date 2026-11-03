import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createAuthTestServer, startAuthTestServer } from './auth-server';

const server = createAuthTestServer();

beforeAll(() => {
  startAuthTestServer(server);
});

afterAll(() => {
  server.close();
});

describe('guardia de MSW', () => {
  it('una petición sin handler falla y no sale a la red real', async () => {
    await expect(fetch('http://localhost:3000/api/auth/sin-handler')).rejects.toThrow();
  });
});
