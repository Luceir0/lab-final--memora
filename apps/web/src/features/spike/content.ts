import { createServerFn } from '@tanstack/react-start';

import { readHelpContent, readLegalPage } from './content.server';

/** Artículo de ayuda tal y como lo devuelve el snapshot de Content Island. */
export interface HelpArticle {
  id: string;
  language: string;
  lastUpdate: string;
  title: string;
  slug: string;
  body: string;
  order: number;
}

/** Pregunta frecuente tal y como la devuelve el snapshot de Content Island. */
export interface FaqItem {
  id: string;
  language: string;
  lastUpdate: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

/** Contenido editorial de `/help`, ya ordenado por `order`. */
export interface HelpContentData {
  articles: HelpArticle[];
  faqs: FaqItem[];
}

/** Página legal tal y como la devuelve el snapshot de Content Island. */
export interface LegalPage {
  id: string;
  language: string;
  lastUpdate: string;
  title: string;
  slug: string;
  body: string;
  updatedAt: string;
}

/**
 * Único punto de entrada que usa la ruta.
 *
 * Es una server function para que el loader funcione también en navegación
 * cliente: el navegador pide el contenido por RPC y `readHelpContent` (con
 * `node:fs` y el snapshot) no entra en el bundle cliente.
 */
export const loadHelpContent = createServerFn({ method: 'GET' }).handler(
  async (): Promise<HelpContentData> => readHelpContent(),
);

/**
 * Carga la página legal de privacidad (slug `privacidad`) desde el snapshot.
 *
 * Comparte el patrón de `loadHelpContent`: el loader funciona en navegación
 * cliente y la lectura del sistema de archivos queda en el servidor. Si la
 * página no existe, la promesa se rechaza para que el build falle en el
 * prerender y la navegación cliente muestre el estado de error de la ruta.
 */
export const loadLegalPage = createServerFn({ method: 'GET' }).handler(
  async (): Promise<LegalPage> => readLegalPage(),
);
