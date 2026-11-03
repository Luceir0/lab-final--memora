import { setupServer, type SetupServer } from 'msw/node';

/**
 * Servidor MSW de los tests de autenticación.
 *
 * `onUnhandledFrame: 'error'` es la opción de MSW 3.0.3 que corta la prueba si
 * una petición no tiene handler. Se centraliza aquí para que los cuatro
 * archivos de test compartan la misma guarda.
 */
export function createAuthTestServer(): SetupServer {
  return setupServer();
}

/** Arranca el servidor con las peticiones no manejadas convertidas en error. */
export function startAuthTestServer(server: SetupServer): void {
  server.listen({ onUnhandledFrame: 'error' });
}
