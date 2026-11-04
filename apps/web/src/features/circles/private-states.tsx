import { Button, InlineAlert, Skeleton } from '@memora/ui';

import { PageContainer } from '../../components/layout/page-container';

/**
 * Esqueleto de la zona privada.
 *
 * No pinta ningún dato de la sesión ni de los círculos: solo reserva el layout
 * del listado mientras se resuelve `GET /me`. `aria-busy` describe el estado y
 * el texto oculto es el único anuncio para lectores de pantalla.
 */
export function PrivateLoadingState({
  label = 'Cargando tu sesión…',
}: {
  readonly label?: string;
}) {
  return (
    <PageContainer className="pt-6 lg:py-10">
      <div aria-busy="true">
        <p role="status" className="sr-only">
          {label}
        </p>
        <div aria-hidden="true" className="flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex w-full max-w-xs flex-col gap-2">
              <Skeleton shape="text" size="sm" className="w-2/5" />
              <Skeleton shape="text" size="lg" className="w-3/5" />
            </div>
            <Skeleton shape="circle" size="md" />
          </div>
          <Skeleton shape="rect" className="h-48 w-full rounded-xl lg:h-72" />
          <div className="flex flex-col gap-2">
            <Skeleton shape="text" size="sm" className="w-28" />
            <div className="grid gap-3 lg:grid-cols-3">
              <Skeleton shape="rect" className="h-24 rounded-xl" />
              <Skeleton shape="rect" className="h-24 rounded-xl" />
              <Skeleton shape="rect" className="h-24 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

export interface PrivateSessionErrorProps {
  readonly message: string;
  readonly onRetry: () => void;
}

/** Fallo de red al comprobar la sesión, sin pintar el contenido privado. */
export function PrivateSessionError({ message, onRetry }: PrivateSessionErrorProps) {
  return (
    <PageContainer className="pt-6 lg:py-10">
      <div className="mx-auto max-w-xl">
        <InlineAlert
          tone="danger"
          title="No hemos podido comprobar tu sesión"
          description={message}
          action={
            <Button variant="secondary" onClick={onRetry}>
              Reintentar
            </Button>
          }
        />
      </div>
    </PageContainer>
  );
}
