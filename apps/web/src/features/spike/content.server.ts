import path from 'node:path';

import { createClient } from '@content-island/api-client';

import type { FaqItem, HelpArticle, HelpContentData } from './content';

const HELP_CONTENT_TYPE = 'helpArticle';
const FAQ_CONTENT_TYPE = 'faqItem';
const CONTENT_LANGUAGE = 'es';
const DEFAULT_SNAPSHOT_RELATIVE_PATH = '../../content-island-snapshot.json';

/**
 * Ruta del snapshot. Por defecto se resuelve desde `apps/web` (cwd del dev y
 * del build) hacia la raíz del repo; `CONTENT_ISLAND_SNAPSHOT_PATH` permite
 * apuntar a otra copia sin tocar código.
 */
export function resolveSnapshotPath(snapshotPath?: string): string {
  if (snapshotPath) {
    return path.resolve(snapshotPath);
  }

  const fromEnv = process.env.CONTENT_ISLAND_SNAPSHOT_PATH;
  if (fromEnv) {
    return path.resolve(fromEnv);
  }

  return path.resolve(process.cwd(), DEFAULT_SNAPSHOT_RELATIVE_PATH);
}

export function sortByOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}

/**
 * Lee el contenido editorial desde el snapshot local, sin red y sin token.
 *
 * El cliente oficial exige `accessToken` por contrato, pero en modo `snapshot`
 * no lo usa: pasamos cadena vacía para que el build funcione sin secretos.
 */
export async function readHelpContent(snapshotPath?: string): Promise<HelpContentData> {
  const resolvedPath = resolveSnapshotPath(snapshotPath);

  const client = createClient({
    accessToken: '',
    mode: 'snapshot',
    snapshotPath: resolvedPath,
  });

  try {
    const snapshot = await client.getSnapshotInfo();
    if (snapshot.view !== 'published') {
      throw new Error(`El snapshot de Content Island no está publicado (view: ${snapshot.view}).`);
    }

    const [articles, faqs] = await Promise.all([
      client.getContentList<HelpArticle>({
        contentType: HELP_CONTENT_TYPE,
        language: CONTENT_LANGUAGE,
      }),
      client.getContentList<FaqItem>({
        contentType: FAQ_CONTENT_TYPE,
        language: CONTENT_LANGUAGE,
      }),
    ]);

    return {
      articles: sortByOrder(articles),
      faqs: sortByOrder(faqs),
    };
  } catch (error) {
    // Log solo de servidor: el mensaje que cruza la server function es genérico.
    // eslint-disable-next-line no-console
    console.error(
      `[spike/content] No se pudo leer el snapshot de Content Island. Ruta: ${resolvedPath}`,
      error,
    );

    throw new Error(
      'No se pudo leer el snapshot de Content Island. Revisa CONTENT_ISLAND_SNAPSHOT_PATH o regenera el snapshot.',
    );
  }
}
