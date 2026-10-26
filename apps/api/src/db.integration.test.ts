import { afterAll, describe, expect, it } from 'vitest';

import { disconnectPrisma, getPrismaClient } from './db.ts';

const databaseUrl = process.env.DATABASE_URL;
const hasDatabase = databaseUrl !== undefined && databaseUrl.trim() !== '';

/**
 * Runs only when `DATABASE_URL` points to a migrated database.
 * CI without Postgres skips it instead of failing the whole suite.
 */
describe.skipIf(!hasDatabase)('Prisma integration', () => {
  afterAll(async () => {
    await disconnectPrisma();
  });

  it('creates, reads and deletes a SpikeNote', async () => {
    const prisma = getPrismaClient();
    const message = `spike-${Date.now()}`;

    const created = await prisma.spikeNote.create({ data: { message } });

    try {
      const found = await prisma.spikeNote.findUnique({ where: { id: created.id } });

      expect(found).not.toBeNull();
      expect(found?.message).toBe(message);
      expect(found?.createdAt).toBeInstanceOf(Date);
    } finally {
      await prisma.spikeNote.delete({ where: { id: created.id } });
    }

    const deleted = await prisma.spikeNote.findUnique({ where: { id: created.id } });
    expect(deleted).toBeNull();
  });
});
