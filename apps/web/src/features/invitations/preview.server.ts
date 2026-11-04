import { isApiError, type ApiClient } from '@memora/api-client';
import {
  invitationPreviewResponseSchema,
  invitationTokenParamsSchema,
  meResponseSchema,
  type CurrentUserDto,
  type InvitationPreviewDto,
} from '@memora/shared';

import type { InvitationPageData, InvitationViewer } from './page-data';

export interface InvitationPageInput {
  /** Token ya decodificado por el router. */
  readonly token: string;
  /** Cabecera `Cookie` de la petición original; se reenvía tal cual a la API. */
  readonly cookie: string | undefined;
  /** Origen público de la petición, sin barra final. */
  readonly origin: string;
}

function headersWithCookie(cookie: string | undefined): HeadersInit | undefined {
  return cookie === undefined || cookie.length === 0 ? undefined : { cookie };
}

function isNotFound(error: unknown): boolean {
  return isApiError(error) && error.status === 404;
}

function viewerOf(user: CurrentUserDto): InvitationViewer {
  return { email: user.email, name: user.name };
}

/**
 * Resuelve la preview pública y, si hay sesión, la cuenta que la está viendo.
 *
 * - Reenvía la cookie de la petición a la API en ambas llamadas. Sin cookie no
 *   se pide `/me`: la API respondería `401` y no aporta nada.
 * - Token ausente o fuera del contrato → estado `invalid` sin llamar a la API.
 * - `404` de la preview → enlace desconocido → estado `invalid` (no es un
 *   error de red).
 * - Cualquier otro fallo de la preview → estado `error`, que la página pinta
 *   con reintento. Un fallo de `/me` no rompe la invitación: se degrada a
 *   visitante sin sesión.
 *
 * Es una función pura respecto al transporte: recibe el `ApiClient`, así que
 * se prueba con `fetch` sustituido y sin red real.
 */
export async function readInvitationPageData(
  input: InvitationPageInput,
  client: ApiClient,
): Promise<InvitationPageData> {
  const { cookie, origin } = input;
  const tokenParams = invitationTokenParamsSchema.safeParse({ token: input.token });

  if (!tokenParams.success) {
    return { kind: 'invalid', token: input.token, origin };
  }

  const { token } = tokenParams.data;

  const headers = headersWithCookie(cookie);
  const previewPath = `/invitations/${encodeURIComponent(token)}`;

  let preview: InvitationPreviewDto;

  try {
    preview = await client.get(previewPath, {
      schema: invitationPreviewResponseSchema,
      ...(headers === undefined ? {} : { headers }),
    });
  } catch (error) {
    if (isNotFound(error)) {
      return { kind: 'invalid', token, origin };
    }

    return { kind: 'error', token, origin };
  }

  let viewer: InvitationViewer | null = null;

  if (headers !== undefined) {
    try {
      const me = await client.get('/me', { schema: meResponseSchema, headers });
      viewer = viewerOf(me.user);
    } catch {
      // Invitación pública con una cookie caducada: se muestra como visitante.
    }
  }

  return { kind: 'preview', token, origin, preview, viewer };
}
