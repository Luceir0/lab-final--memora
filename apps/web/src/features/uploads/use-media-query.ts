import { useCallback, useSyncExternalStore } from 'react';

function matchesQuery(query: string): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia(query).matches;
}

/**
 * Media query reactiva con snapshot de servidor `false`.
 *
 * El SSR y el primer render de cliente asumen móvil; el cambio a escritorio
 * ocurre después de montar. Solo se usa para elegir presentación, nunca para
 * duplicar dos árboles a la vez.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return () => {};
      }

      const media = window.matchMedia(query);
      media.addEventListener('change', onChange);

      return () => media.removeEventListener('change', onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => matchesQuery(query),
    () => false,
  );
}
