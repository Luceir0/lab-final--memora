import type { InvitationPreviewDto } from '@memora/shared';

/**
 * Persona autenticada que está viendo la invitación.
 *
 * La API de preview no la devuelve: se pide `/me` en servidor con la misma
 * cookie y se usa solo para el saludo y para decidir el CTA. Nunca se expone
 * nada más de la cuenta.
 */
export interface InvitationViewer {
  readonly email: string;
  readonly name: string;
}

/**
 * Datos mínimos que necesita la página SSR.
 *
 * `origin` se resuelve en servidor a partir del `Host` de la petición y se usa
 * para construir `og:url`, `og:image` y el enlace de vuelta al login. El token
 * va decodificado; los enlaces lo vuelven a codificar.
 */
export type InvitationPageData =
  | {
      readonly kind: 'preview';
      readonly token: string;
      readonly origin: string;
      readonly preview: InvitationPreviewDto;
      readonly viewer: InvitationViewer | null;
    }
  | { readonly kind: 'invalid'; readonly token: string; readonly origin: string }
  | { readonly kind: 'error'; readonly token: string; readonly origin: string };

export interface InvitationMeta {
  readonly title?: string;
  readonly name?: string;
  readonly property?: string;
  readonly content?: string;
}

export interface InvitationHead {
  readonly meta: InvitationMeta[];
}

export interface InvitationHeadCopy {
  readonly title: string;
  readonly description: string;
}

const FALLBACK_COPY: InvitationHeadCopy = {
  title: 'Invitación · Memora',
  description: 'Un lugar íntimo para compartir recuerdos con las personas que quieres.',
};

const PRIVATE_CIRCLE_DESCRIPTION =
  'Un círculo privado de Memora donde compartir recuerdos. Solo lo ven las personas invitadas.';

/** Textos de Open Graph y `<title>` para cada estado de la invitación. */
export function invitationHeadCopy(data: InvitationPageData | undefined): InvitationHeadCopy {
  if (data === undefined) {
    return FALLBACK_COPY;
  }

  if (data.kind === 'invalid') {
    return {
      title: 'Enlace de invitación no válido · Memora',
      description: 'Este enlace no es válido o la invitación ya no está disponible.',
    };
  }

  if (data.kind === 'error') {
    return {
      title: 'Invitación · Memora',
      description: 'No hemos podido cargar la invitación. Vuelve a intentarlo en unos instantes.',
    };
  }

  const { preview } = data;

  if (preview.state === 'valid') {
    return {
      title: `${preview.inviterName} te invita a ${preview.circleName}`,
      description: PRIVATE_CIRCLE_DESCRIPTION,
    };
  }

  const reason =
    preview.state === 'expired'
      ? 'La invitación ha caducado.'
      : preview.state === 'revoked'
        ? 'La invitación ha sido retirada.'
        : 'Ya formas parte de este círculo.';

  return {
    title: `Invitación a ${preview.circleName} · Memora`,
    description: `${reason} Abre el enlace para ver los detalles en Memora.`,
  };
}

/** URL absoluta de una invitación a partir del origen de la petición. */
export function invitationPageUrl(data: InvitationPageData): string {
  return `${data.origin.replace(/\/+$/, '')}/invite/${encodeURIComponent(data.token)}`;
}

/**
 * Metadatos de la ruta.
 *
 * Se calculan solo con el `loaderData`: no tocan `window` ni el servidor, así
 * que funcionan igual en SSR y en una navegación de cliente. `og:image` es la
 * imagen genérica versionada, nunca la portada del círculo (D2).
 */
export function buildInvitationHead(data: InvitationPageData | undefined): InvitationHead {
  const copy = invitationHeadCopy(data);

  if (data === undefined) {
    return {
      meta: [
        { title: copy.title },
        { name: 'description', content: copy.description },
        { name: 'robots', content: 'noindex' },
      ],
    };
  }

  const origin = data.origin.replace(/\/+$/, '');
  const url = invitationPageUrl(data);
  const image = `${origin}/og/invite.png`;

  return {
    meta: [
      { title: copy.title },
      { name: 'description', content: copy.description },
      { name: 'robots', content: 'noindex' },
      { property: 'og:title', content: copy.title },
      { property: 'og:description', content: copy.description },
      { property: 'og:image', content: image },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:url', content: url },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'Memora' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: copy.title },
      { name: 'twitter:description', content: copy.description },
      { name: 'twitter:image', content: image },
    ],
  };
}

/** Ruta de login que conserva el token en `redirect` (AC-04). */
export function invitationLoginHref(data: InvitationPageData): string {
  return `/login?redirect=${encodeURIComponent(`/invite/${encodeURIComponent(data.token)}`)}`;
}
