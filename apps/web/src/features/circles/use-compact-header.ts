import { useCallback, useEffect, useState } from 'react';

/**
 * Detecta cuándo el héroe del detalle ha salido por arriba.
 *
 * Usa `IntersectionObserver` y cae a un listener de scroll si el navegador no
 * lo soporta (por ejemplo, algunos entornos de test muy limitados). La
 * decisión depende de que el borde superior sea negativo, no solo de que el
 * observer deje de intersectar: un héroe todavía por debajo del viewport
 * tampoco intersecta y no debe activar la cabecera compacta.
 */
export function useCompactHeader<T extends HTMLElement>() {
  const [node, setNode] = useState<T | null>(null);
  const [compact, setCompact] = useState(false);
  const ref = useCallback((element: T | null) => {
    setNode(element);
  }, []);

  // Al cambiar de círculo o remontar el héroe, la cabecera vuelve a su estado
  // normal hasta que el observer confirme que el héroe ya está fuera.
  useEffect(() => {
    setCompact(false);
  }, [node]);

  useEffect(() => {
    if (!node) {
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      const update = () => {
        setCompact(node.getBoundingClientRect().bottom <= 0);
      };

      update();
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);

      return () => {
        window.removeEventListener('scroll', update);
        window.removeEventListener('resize', update);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (!entry) {
          return;
        }

        setCompact(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [node]);

  return { ref, compact };
}
