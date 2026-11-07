import { useEffect, useRef } from 'react';

const STORAGE_PREFIX = 'memora:gallery-scroll:';

function readScroll(key: string): number {
  try {
    const raw = window.sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
    const value = raw === null ? 0 : Number(raw);

    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function writeScroll(key: string, value: number): void {
  try {
    if (value <= 0) {
      window.sessionStorage.removeItem(`${STORAGE_PREFIX}${key}`);
      return;
    }

    window.sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, String(Math.round(value)));
  } catch {
    // `sessionStorage` puede estar bloqueado; la galería sigue funcionando.
  }
}

/**
 * Restaura la posición de scroll de una galería al volver a ella.
 *
 * La clave incluye álbum y filtro (o círculo, persona y álbum) para que cada
 * vista tenga su propia posición. Al cambiar de clave se guarda la anterior y
 * se restaura la nueva; si no había posición guardada, se vuelve arriba.
 *
 * `enabled` debe ser `true` cuando la rejilla ya tiene contenido: restaurar
 * antes de que existan las fotos dejaría el scroll a cero.
 */
export function useRestoredScroll(key: string, enabled: boolean): void {
  const previousKeyRef = useRef(key);
  const restoredKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const previousKey = previousKeyRef.current;

    if (previousKey !== key) {
      writeScroll(previousKey, window.scrollY);
      previousKeyRef.current = key;
    }

    if (!enabled || restoredKeyRef.current === key) {
      return;
    }

    restoredKeyRef.current = key;
    const saved = readScroll(key);

    if (saved <= 0) {
      window.scrollTo({ top: 0 });
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: saved });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [enabled, key]);

  useEffect(() => {
    let frame = 0;

    const onScroll = () => {
      if (frame !== 0) {
        return;
      }

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        writeScroll(key, window.scrollY);
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);

      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }

      writeScroll(key, window.scrollY);
    };
  }, [key]);
}
