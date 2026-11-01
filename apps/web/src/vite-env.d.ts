/// <reference types="vite/client" />

/**
 * Variables de entorno expuestas al navegador.
 *
 * Solo las que empiezan por `VITE_` llegan al bundle cliente. La base interna
 * de SSR (`API_INTERNAL_URL`) no se declara aquí a propósito: se lee solo en
 * `src/lib/api-client.server.ts`.
 */
interface ImportMetaEnv {
  /**
   * Ruta o URL pública de la API para el navegador.
   * Por defecto `/api`, que usa el proxy de Vite.
   */
  readonly VITE_API_BASE_URL?: string;
}
