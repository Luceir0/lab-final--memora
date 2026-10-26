import { createServerFn } from '@tanstack/react-start';

import { readHelpContent } from './content.server';

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
