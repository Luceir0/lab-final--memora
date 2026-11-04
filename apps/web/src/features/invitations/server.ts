import { createServerFn } from '@tanstack/react-start';
import { getRequestHeader, getRequestHost, getRequestProtocol } from '@tanstack/react-start/server';

import { serverApiClient } from '../../lib/api-client.server';
import { readInvitationPageData, type InvitationPageInput } from './preview.server';
import type { InvitationPageData } from './page-data';

function readToken(input: unknown): string {
  if (
    typeof input === 'object' &&
    input !== null &&
    'token' in input &&
    typeof input.token === 'string'
  ) {
    return input.token;
  }

  throw new Error('La invitación necesita un token.');
}

function requestOrigin(): string {
  const protocol = getRequestProtocol();
  const host = getRequestHost();
  return `${protocol}://${host}`;
}

/**
 * Server function del `loader` de `/invite/$token`.
 *
 * Extrae la cookie y el origen de la petición HTTP real y delega en
 * `readInvitationPageData`. El navegador nunca ve la cabecera `Cookie` ni
 * `API_INTERNAL_URL`: en una navegación de cliente, TanStack Start ejecuta
 * este handler por RPC en el servidor.
 */
export const loadInvitationPage = createServerFn({ method: 'GET' })
  .validator((input: unknown): { token: string } => ({ token: readToken(input) }))
  .handler(async ({ data }): Promise<InvitationPageData> => {
    const pageInput: InvitationPageInput = {
      token: data.token,
      cookie: getRequestHeader('cookie'),
      origin: requestOrigin(),
    };

    return readInvitationPageData(pageInput, serverApiClient);
  });
