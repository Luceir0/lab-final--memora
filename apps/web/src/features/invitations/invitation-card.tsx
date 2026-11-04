import type { InvitationPreviewDto } from '@memora/shared';
import { Avatar, Button, LinkButton } from '@memora/ui';
import { Link } from '@tanstack/react-router';
import { Clock, Images, Lock, LogOut } from 'lucide-react';
import type { ReactNode } from 'react';

import { firstName, formatInvitationExpiry } from './format';
import { InvitationHero } from './invitation-hero';
import type { InvitationViewer } from './page-data';

export interface InvitationCardProps {
  readonly preview: InvitationPreviewDto;
  readonly viewer: InvitationViewer | null;
  /** Login con `redirect` al token, para visitantes y para cambiar de cuenta. */
  readonly loginHref: string;
  readonly accepting: boolean;
  readonly error?: ReactNode;
  readonly onAccept: () => void;
}

function Feature({ icon, children }: { readonly icon: ReactNode; readonly children: ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-left">
      <span aria-hidden="true" className="mt-0.5 shrink-0 text-primary-text [&>svg]:size-5">
        {icon}
      </span>
      <span className="text-body-sm text-muted">{children}</span>
    </li>
  );
}

/**
 * Tarjeta de una invitación válida.
 *
 * Móvil: héroe, explicación en tres puntos, caducidad y CTA al final del
 * flujo. La barra ya no es `fixed`: reserva su altura y nunca se superpone al
 * contenido, tampoco con viewports cortos o zoom de texto al 200 %.
 * Escritorio: el mismo contenido en una tarjeta centrada, explicación en
 * párrafo, acciones en fila y pie con caducidad y cambio de cuenta. No duplica
 * el árbol: solo cambia el CSS.
 */
export function InvitationCard({
  preview,
  viewer,
  loginHref,
  accepting,
  error,
  onAccept,
}: InvitationCardProps) {
  const expiry = formatInvitationExpiry(preview.expiresAt);
  const viewerFirstName = viewer === null ? null : firstName(viewer.name);

  const primaryAction =
    viewer === null ? (
      <LinkButton href={loginHref} fullWidth className="h-auto min-h-11 lg:w-auto">
        Entrar para aceptar
      </LinkButton>
    ) : (
      <Button
        fullWidth
        loading={accepting}
        className="h-auto min-h-11 lg:w-auto"
        onClick={onAccept}
        aria-live="polite"
      >
        {accepting ? 'Aceptando…' : 'Aceptar invitación'}
      </Button>
    );

  return (
    /*
     * En móvil el wrapper es `display: contents`: la tarjeta, la caducidad y
     * la barra son hijos directos de la columna de página. Así `mt-auto` puede
     * anclar la barra al fondo sin sacarla del flujo.
     * En escritorio el wrapper vuelve a ser la tarjeta y contiene la barra y
     * el pie, como en el mockup.
     */
    <div className="contents lg:block lg:w-full lg:max-w-[32rem] lg:rounded-xl lg:border lg:border-border lg:bg-surface lg:shadow-md">
      <article className="relative w-full max-w-[32rem] overflow-hidden rounded-xl border border-border bg-surface shadow-md lg:max-w-none lg:rounded-b-none lg:rounded-t-xl lg:border-0 lg:bg-transparent lg:shadow-none">
        <InvitationHero circleName={preview.circleName} />

        <div className="px-5 pb-6 pt-5 text-center lg:px-10 lg:pb-0 lg:pt-7">
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-body-sm text-muted">
            <Avatar name={preview.inviterName} size={28} decorative />
            <span>
              <span className="font-semibold text-text">{preview.inviterName}</span>{' '}
              <span className="lg:hidden">te invita a</span>
              <span className="hidden lg:inline">te invita a unirte a</span>
            </span>
          </p>

          <h1 className="mt-4 text-h1 font-extrabold text-text lg:mt-3">{preview.circleName}</h1>

          <ul className="mt-5 space-y-3 lg:hidden">
            <Feature icon={<Lock />}>
              Es un círculo privado: solo lo ven las personas invitadas.
            </Feature>
            <Feature icon={<Images />}>
              Al unirte podrás ver sus álbumes y aportar tus fotos.
            </Feature>
            <Feature icon={<LogOut />}>Puedes salir del círculo cuando quieras.</Feature>
          </ul>

          <p className="mx-auto mt-4 hidden max-w-[25rem] text-body text-muted lg:block">
            Un círculo es un espacio privado: solo lo ven las personas invitadas. Al unirte podrás
            ver sus álbumes, aportar tus fotos y salir cuando quieras.
          </p>
        </div>
      </article>

      <p className="mt-4 flex items-center justify-center gap-2 px-5 text-center text-caption text-muted lg:hidden">
        <Clock aria-hidden="true" className="size-4 shrink-0" />
        La invitación caduca el {expiry}
      </p>

      {/*
       * Fuera del `<article>`: no lo recorta el `overflow-hidden` de la
       * tarjeta. En móvil es un hijo directo de la columna de página, justo
       * antes de la barra de acciones.
       */}
      {error ? <div className="mt-4 w-full max-w-[32rem] break-words lg:px-10">{error}</div> : null}

      {/*
       * Barra anclada sin `fixed` ni `sticky`: `mt-auto` la empuja al fondo
       * cuando sobra altura y la deja al final del flujo cuando el contenido
       * es más alto que el viewport. Así se conserva el anclaje del diseño y
       * el solape medido es 0 px en viewports cortos y zoom 200 %.
       */}
      <div
        data-invitation-actions=""
        className="mt-auto w-full max-w-[32rem] bg-bg px-2 pb-[max(1rem,env(safe-area-inset-bottom))] pt-5 lg:mt-7 lg:max-w-none lg:bg-transparent lg:px-10 lg:pb-6 lg:pt-0"
      >
        <div className="mx-auto w-full lg:flex lg:items-center lg:justify-center lg:gap-6">
          {viewer === null ? null : (
            <Link
              to="/circles"
              className="hidden min-h-11 items-center rounded-md px-3 text-body-sm font-semibold text-text hover:bg-surface-2 lg:inline-flex"
            >
              Ahora no
            </Link>
          )}

          <div className="w-full lg:w-auto">{primaryAction}</div>
        </div>

        {viewer === null ? null : (
          <p className="mt-3 break-words text-center text-caption text-muted lg:hidden">
            Entrarás como {viewer.email} ·{' '}
            <a href={loginHref} className="font-semibold text-primary-text hover:underline">
              No soy yo
            </a>
          </p>
        )}
      </div>

      <footer className="hidden items-center justify-center gap-2 border-t border-border px-6 py-4 text-caption text-muted lg:flex lg:rounded-b-xl">
        <Clock aria-hidden="true" className="size-4 shrink-0" />
        <span>Caduca el {expiry}</span>
        {viewerFirstName === null ? null : (
          <>
            <span aria-hidden="true">·</span>
            <a href={loginHref} className="font-semibold text-primary-text hover:underline">
              ¿No eres {viewerFirstName}? Cambia de cuenta
            </a>
          </>
        )}
      </footer>
    </div>
  );
}
