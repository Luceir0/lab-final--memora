import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Prisma integration tests connect to a real Postgres when DATABASE_URL is set.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
