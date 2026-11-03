import { useEffect, useState } from 'react';

/** A partir de 24 px de raíz se considera texto ampliado al 150 % o más. */
export const LARGE_TEXT_ROOT_FONT_PX = 24;

/** Interpreta el `font-size` computado de la raíz (`16px`, `32px`…). */
export function isLargeRootFont(fontSize: string | number): boolean {
  const value = typeof fontSize === 'number' ? fontSize : Number.parseFloat(fontSize);

  return Number.isFinite(value) && value >= LARGE_TEXT_ROOT_FONT_PX;
}

/**
 * Detecta texto ampliado (zoom de texto del navegador o `html{font-size}`).
 *
 * No hay media query estándar para el zoom de texto; se mide la raíz y se
 * reacciona a cambios de tamaño. El primer render es `false` para no leer el
 * DOM durante SSR.
 */
export function useLargeRootFont(): boolean {
  const [large, setLarge] = useState(false);

  useEffect(() => {
    const check = () => {
      setLarge(isLargeRootFont(getComputedStyle(document.documentElement).fontSize));
    };

    check();
    window.addEventListener('resize', check);

    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(check) : null;
    observer?.observe(document.documentElement);

    return () => {
      window.removeEventListener('resize', check);
      observer?.disconnect();
    };
  }, []);

  return large;
}
