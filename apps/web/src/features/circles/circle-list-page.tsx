import { Avatar, Button, EmptyState, InlineAlert, Skeleton } from '@memora/ui';
import { Link, useRouter } from '@tanstack/react-router';
import { Plus, TriangleAlert, UsersRound } from 'lucide-react';

import { PageContainer } from '../../components/layout/page-container';
import { CircleCard } from './circle-card';
import { CircleFeatured } from './circle-featured';
import { formatCircleErrorCode, getCirclesErrorCopy } from './errors';
import { formatCount, formatLongDate, getFirstName } from './format';
import { NEW_CIRCLE_PATH } from './paths';
import { flattenCirclePages, useCircleListQuery, useCircleStats, useMeQuery } from './queries';
import { isUnauthorizedError, useUnauthorizedRedirect } from './session';

export interface CircleListPageProps {
  /** Fecha de referencia inyectable en tests. */
  readonly now?: Date | undefined;
}

/**
 * `/circles`: saludo, destacado, lista y estados.
 *
 * El guard de `_app` ya ha resuelto `/me`; esta página solo pinta. Los stats
 * llegan por el N+1 acordado y comparten clave de caché con el futuro detalle.
 */
export function CircleListPage({ now: nowProp }: CircleListPageProps = {}) {
  const now = nowProp ?? new Date();
  const router = useRouter();
  const meQuery = useMeQuery();
  const listQuery = useCircleListQuery();
  const { circles } = flattenCirclePages(listQuery.data?.pages ?? []);
  const { statsById, error: statsError } = useCircleStats(circles.map((circle) => circle.id));

  useUnauthorizedRedirect(meQuery.error);
  useUnauthorizedRedirect(listQuery.error);
  useUnauthorizedRedirect(statsError);

  const unauthorized = isUnauthorizedError(listQuery.error) || isUnauthorizedError(statsError);
  const failed = listQuery.isError && !unauthorized && listQuery.data === undefined;
  const staleError = listQuery.isError && !unauthorized && listQuery.data !== undefined;
  const loading = listQuery.isPending || unauthorized;
  const empty = !loading && !failed && circles.length === 0;

  const featured = circles.find((circle) => circle.coverPhoto !== null) ?? circles[0];
  const rest = featured ? circles.filter((circle) => circle.id !== featured.id) : [];
  const statsFailed = statsError !== null && !unauthorized;
  const hasNextPage =
    listQuery.data?.pages.at(-1)?.nextCursor !== null &&
    listQuery.data?.pages.at(-1)?.nextCursor !== undefined;
  const countLabel = hasNextPage ? `${formatCount(circles.length)}+` : formatCount(circles.length);
  const countNoun = circles.length === 1 && !hasNextPage ? 'círculo' : 'círculos';
  const userName = meQuery.data?.user.name;
  const firstName = userName === undefined ? '' : getFirstName(userName);
  const greeting = firstName === '' ? 'Hola' : `Hola, ${firstName}`;

  const goToNewCircle = () => {
    void router.navigate({ to: NEW_CIRCLE_PATH });
  };

  return (
    <PageContainer className="pb-32 pt-6 lg:py-10">
      <header className="mb-6 flex items-start justify-between gap-4 lg:mb-8">
        <div className="min-w-0">
          <p className="text-caption text-muted">
            {empty ? 'Te damos la bienvenida' : formatLongDate(now)}
          </p>
          <h1 className="mt-1 text-h1 font-extrabold text-text">{greeting}</h1>
        </div>

        {!loading ? (
          <div className="hidden shrink-0 lg:block">
            <Button icon={<Plus />} onClick={goToNewCircle}>
              Crear círculo
            </Button>
          </div>
        ) : null}

        {meQuery.data ? (
          <div className="shrink-0 lg:hidden">
            {/* El avatar es decorativo: el nombre ya está en el saludo. */}
            <Avatar
              name={meQuery.data.user.name}
              size={40}
              decorative
              {...(meQuery.data.user.avatarUrl === null
                ? {}
                : { src: meQuery.data.user.avatarUrl })}
            />
          </div>
        ) : null}
      </header>

      {staleError ? (
        <InlineAlert
          tone="warning"
          title="No hemos podido actualizar la lista"
          description="Sigues viendo los datos de la última carga."
          className="mb-6"
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void listQuery.refetch();
              }}
            >
              Reintentar
            </Button>
          }
        />
      ) : null}

      {loading ? <CircleListLoading /> : null}

      {failed ? (
        <CircleListError
          error={listQuery.error}
          onRetry={() => {
            void listQuery.refetch();
          }}
        />
      ) : null}

      {empty ? <CircleListEmpty onCreate={goToNewCircle} /> : null}

      {!loading && !failed && circles.length > 0 ? (
        <>
          {featured ? (
            <CircleFeatured circle={featured} stats={statsById.get(featured.id)} />
          ) : null}

          <section aria-labelledby="circles-list-title">
            <div className="mb-3 flex items-baseline justify-between gap-4">
              <h2 id="circles-list-title" className="text-h2 font-extrabold text-text">
                Tus círculos
              </h2>
              <p className="text-body-sm text-muted">
                {countLabel} {countNoun}
              </p>
            </div>

            <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((circle) => (
                <CircleCard
                  key={circle.id}
                  circle={circle}
                  stats={statsById.get(circle.id)}
                  statsFailed={statsFailed}
                  now={now}
                />
              ))}
              <CreateCircleCard onCreate={goToNewCircle} />
            </ul>

            {listQuery.hasNextPage ? (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="secondary"
                  loading={listQuery.isFetchingNextPage}
                  onClick={() => {
                    void listQuery.fetchNextPage();
                  }}
                >
                  Cargar más
                </Button>
              </div>
            ) : null}
          </section>

          <Link
            to={NEW_CIRCLE_PATH}
            className="fixed bottom-[calc(var(--app-bottom-nav-height)+1rem)] right-[max(1.5rem,env(safe-area-inset-right))] z-nav inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 py-3 text-body-sm font-semibold text-on-primary shadow-lg transition-colors duration-(--memora-duration-fast) ease-standard hover:bg-primary-hover active:bg-primary-active lg:hidden"
          >
            <Plus aria-hidden="true" className="size-5" />
            Crear círculo
          </Link>
        </>
      ) : null}
    </PageContainer>
  );
}

interface CircleListEmptyProps {
  readonly onCreate: () => void;
}

function CircleListEmpty({ onCreate }: CircleListEmptyProps) {
  return (
    <section className="rounded-xl border border-dashed border-border-strong bg-surface p-6 shadow-sm lg:p-10">
      <EmptyState
        icon={<UsersRound />}
        iconShape="square"
        title="Todavía no tienes círculos"
        description="Crea uno para tu familia, tus amistades o un viaje e invita a quien quieras. Si te han invitado, abre el enlace que te enviaron."
        action={
          <Button icon={<Plus />} onClick={onCreate} className="w-full sm:w-auto">
            Crear mi primer círculo
          </Button>
        }
      />
    </section>
  );
}

interface CircleListErrorProps {
  readonly error: unknown;
  readonly onRetry: () => void;
}

function CircleListError({ error, onRetry }: CircleListErrorProps) {
  const copy = getCirclesErrorCopy(error, 'list');

  return (
    <section
      role="alert"
      aria-labelledby="circles-error-title"
      className="mx-auto max-w-xl rounded-xl border border-border bg-surface p-6 shadow-sm lg:p-10"
    >
      <div className="flex flex-col items-center text-center">
        <span
          aria-hidden="true"
          className="flex size-14 items-center justify-center rounded-lg bg-warning-soft text-warning-text"
        >
          <TriangleAlert className="size-6" />
        </span>
        <h2 id="circles-error-title" className="mt-4 text-h3 font-bold text-text">
          {copy.title}
        </h2>
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
    </section>
  );
}

interface CreateCircleCardProps {
  readonly onCreate: () => void;
}

/** Tarjeta punteada de escritorio. En móvil la acción es el FAB. */
function CreateCircleCard({ onCreate }: CreateCircleCardProps) {
  return (
    <li className="hidden lg:block">
      <button
        type="button"
        onClick={onCreate}
        className="flex h-full min-h-64 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-strong bg-surface p-6 text-center transition-colors duration-(--memora-duration-fast) ease-standard hover:bg-surface-2 active:bg-surface-active"
      >
        <span
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary-text"
        >
          <Plus className="size-6" />
        </span>
        <span className="text-body font-semibold text-text">Crear un círculo</span>
      </button>
    </li>
  );
}

function CircleListLoading() {
  return (
    <div aria-busy="true">
      <p role="status" className="sr-only">
        Cargando tus círculos…
      </p>
      <div aria-hidden="true" className="flex flex-col gap-3">
        <Skeleton shape="rect" className="aspect-[16/10] w-full rounded-xl lg:aspect-[16/6]" />
        <div className="mt-2 flex flex-col gap-3">
          <Skeleton shape="text" size="sm" className="w-28" />
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 lg:block lg:overflow-hidden lg:p-0"
              >
                <div className="size-16 shrink-0 overflow-hidden rounded-lg lg:aspect-[4/3] lg:h-auto lg:w-full lg:rounded-none">
                  <Skeleton shape="rect" className="size-full rounded-lg lg:rounded-none" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2 lg:p-4">
                  <Skeleton shape="text" size="md" className="w-2/3" />
                  <Skeleton shape="text" size="sm" className="w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
