/**
 * Resultado tipado de compartir o copiar un enlace.
 *
 * - `shared`: el usuario completó la hoja nativa de compartir.
 * - `copied`: no había hoja nativa (o falló) y el enlace quedó en el portapapeles.
 * - `cancelled`: el usuario cerró la hoja nativa sin compartir.
 * - `unsupported`: el navegador no ofrece ni `share` ni `clipboard`.
 */
export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'unsupported';

export interface ShareInvitationInput {
  readonly url: string;
  /** Título de la hoja de compartir; no se muestra en la página de invitación. */
  readonly title?: string;
  /** Texto adicional de la hoja de compartir. */
  readonly text?: string;
}

/**
 * Superficie mínima del navegador que usa el helper.
 *
 * Se inyecta en tests para probar los cuatro caminos sin tocar `navigator`.
 */
export interface ShareEnvironment {
  readonly share?: ((data: ShareData) => Promise<void>) | undefined;
  readonly writeText?: ((text: string) => Promise<void>) | undefined;
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError'
  );
}

/** Lee `navigator` sin romper en SSR. */
export function resolveShareEnvironment(): ShareEnvironment {
  if (typeof navigator === 'undefined') {
    return {};
  }

  return {
    share: typeof navigator.share === 'function' ? (data) => navigator.share(data) : undefined,
    writeText:
      navigator.clipboard === undefined ? undefined : (text) => navigator.clipboard.writeText(text),
  };
}

/**
 * Comparte una invitación con la hoja nativa y cae al portapapeles.
 *
 * No pinta nada ni depende de React: la acción de la UI (F22) decide qué
 * mensaje mostrar con el resultado. Si `share` falla por un motivo distinto de
 * una cancelación (permisos, gesto ausente), se intenta copiar. Nunca lanza:
 * un fallo de portapapeles se traduce en `unsupported`.
 */
export async function shareInvitation(
  input: ShareInvitationInput,
  environment: ShareEnvironment = resolveShareEnvironment(),
): Promise<ShareResult> {
  const shareData: ShareData = {
    url: input.url,
    ...(input.title === undefined ? {} : { title: input.title }),
    ...(input.text === undefined ? {} : { text: input.text }),
  };

  if (environment.share !== undefined) {
    try {
      await environment.share(shareData);
      return 'shared';
    } catch (error) {
      if (isAbortError(error)) {
        return 'cancelled';
      }
      // Sin permiso o sin gesto de usuario: probamos el portapapeles.
    }
  }

  if (environment.writeText === undefined) {
    return 'unsupported';
  }

  try {
    await environment.writeText(input.url);
    return 'copied';
  } catch {
    return 'unsupported';
  }
}
