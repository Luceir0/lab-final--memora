import { useEffect, useRef } from 'react';

export interface InfiniteScrollOptions {
  readonly hasNextPage: boolean;
  readonly isFetchingNextPage: boolean;
  readonly fetchNextPage: () => unknown;
  readonly enabled?: boolean;
}

/**
 * Carga la página siguiente cuando el centinela entra en pantalla.
 *
 * `rootMargin` adelanta la carga 400 px para que la rejilla no llegue a
 * quedarse vacía al hacer scroll rápido. Si el navegador no implementa
 * `IntersectionObserver` (o el test no lo simula), el consumidor conserva el
 * botón «Cargar más fotos», que también cubre el recorrido con teclado.
 */
export function useInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  enabled = true,
}: InfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;

    if (!node || !enabled || !hasNextPage || isFetchingNextPage) {
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void fetchNextPage();
        }
      },
      { rootMargin: '400px 0px' },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [enabled, fetchNextPage, hasNextPage, isFetchingNextPage]);

  return sentinelRef;
}
