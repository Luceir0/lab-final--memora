import path from 'node:path';

import { createClient } from '@content-island/api-client';

import type { FaqItem, HelpArticle, HelpContentData, LegalPage } from './content';

const HELP_CONTENT_TYPE = 'helpArticle';
const FAQ_CONTENT_TYPE = 'faqItem';
const LEGAL_CONTENT_TYPE = 'legalPage';
const CONTENT_LANGUAGE = 'es';
const DEFAULT_SNAPSHOT_RELATIVE_PATH = '../../content-island-snapshot.json';

/** Slug de la página legal de privacidad en Content Island. */
export const LEGAL_PAGE_SLUG = 'privacidad';

/** Error público cuando el snapshot no contiene la página legal de privacidad. */
export const LEGAL_PAGE_MISSING_ERROR =
  'El snapshot de Content Island no contiene la página legal «privacidad».';

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

/**
 * Lee la página legal de privacidad desde el snapshot local.
 *
 * La ausencia de la página es un error explícito, no un contenido vacío: el
 * prerender de `/privacy` falla y, en navegación cliente, la ruta muestra su
 * estado de error.
 */
export async function readLegalPage(snapshotPath?: string): Promise<LegalPage> {
  const resolvedPath = resolveSnapshotPath(snapshotPath);

  const client = createClient({
    accessToken: '',
    mode: 'snapshot',
    snapshotPath: resolvedPath,
  });

  let pages: LegalPage[];

  try {
    const snapshot = await client.getSnapshotInfo();
    if (snapshot.view !== 'published') {
      throw new Error(`El snapshot de Content Island no está publicado (view: ${snapshot.view}).`);
    }

    pages = await client.getContentList<LegalPage>({
      contentType: LEGAL_CONTENT_TYPE,
      language: CONTENT_LANGUAGE,
    });
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

  const page = pages.find((item) => item.slug === LEGAL_PAGE_SLUG);

  if (page === undefined) {
    // eslint-disable-next-line no-console
    console.error(
      `[spike/content] El snapshot no contiene la página legal "${LEGAL_PAGE_SLUG}". Ruta: ${resolvedPath}`,
    );

    throw new Error(LEGAL_PAGE_MISSING_ERROR);
  }

  return page;
}
