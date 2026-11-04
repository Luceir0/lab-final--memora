import { Button, Skeleton } from '@memora/ui';
import { Link } from '@tanstack/react-router';
import { TriangleAlert } from 'lucide-react';

import { DetailMobileBack } from './detail-mobile-back';
import { formatCircleErrorCode, getCirclesErrorCopy } from './errors';

/** Esqueleto del detalle con la forma del héroe y las pestañas. */
export function CircleDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl lg:px-8 lg:py-10">
      <DetailMobileBack />

      <div aria-busy="true">
        <h1 className="sr-only">Cargando el círculo</h1>
        <p role="status" className="sr-only">
          Cargando el círculo…
        </p>

        <div aria-hidden="true">
          <Skeleton
            shape="rect"
            className="aspect-[2/1] w-full rounded-none lg:aspect-[16/5] lg:rounded-xl"
          />
          <div className="relative mx-3 -mt-8 rounded-t-2xl bg-surface p-5 lg:mx-0 lg:mt-4 lg:rounded-xl lg:p-8">
            <Skeleton shape="text" size="lg" className="w-2/3" />
            <Skeleton shape="text" size="sm" className="mt-3 w-full" />
            <Skeleton shape="text" size="sm" className="mt-2 w-4/5" />
            <div className="mt-4 flex gap-2">
              <Skeleton shape="rect" className="h-11 w-28 rounded-md" />
              <Skeleton shape="rect" className="h-11 w-32 rounded-md" />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Skeleton shape="rect" className="h-11 w-24 rounded-full" />
            <Skeleton shape="rect" className="h-11 w-24 rounded-full" />
            <Skeleton shape="rect" className="h-11 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export interface CircleDetailErrorProps {
  readonly error: unknown;
  readonly onRetry: () => void;
}

/** Fallo de carga del detalle que no es 401 ni 404. */
export function CircleDetailError({ error, onRetry }: CircleDetailErrorProps) {
  const copy = getCirclesErrorCopy(error, 'detail');

  return (
    <div className="mx-auto w-full max-w-7xl lg:px-8 lg:py-10">
      <DetailMobileBack />

      <div
        role="alert"
        className="mx-auto max-w-xl rounded-xl border border-border bg-surface p-6 shadow-sm lg:p-10"
      >
        <div className="flex flex-col items-center text-center">
          <span
            aria-hidden="true"
            className="flex size-14 items-center justify-center rounded-lg bg-warning-soft text-warning-text"
          >
            <TriangleAlert className="size-6" />
          </span>

          <h1 className="mt-4 text-h3 font-bold text-text">{copy.title}</h1>
          <p className="mt-2 max-w-prose text-body text-muted">{copy.description}</p>

          <div className="mt-4 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button onClick={onRetry}>Reintentar</Button>
            <Link
              to="/help"
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary-soft px-4 text-body-sm font-semibold text-on-primary-soft transition-colors duration-(--memora-duration-fast) ease-standard hover:bg-primary-soft-hover active:bg-primary-soft-active"
            >
              Ver la ayuda
            </Link>
          </div>

          <p className="mt-4 text-caption text-muted">
            Código del error: {formatCircleErrorCode(error)}
          </p>
        </div>
      </div>
    </div>
  );
}
