import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { getUploadErrorCopy } from './errors';
import { formatUploadItemName } from './format';
import type { UploadItem, UploadItemStatus } from './types';

/** Tiempo que el mensaje permanece para permitir reanunciar textos idénticos. */
export const UPLOAD_ANNOUNCEMENT_CLEAR_MS = 6000;

/**
 * Mensajes de transición de la cola.
 *
 * Solo cambios de estado relevantes: añadida, completada, error y cancelada.
 * El progreso nunca entra aquí; si lo hiciera, el lector de pantalla leería
 * cada porcentaje.
 */
export function buildUploadAnnouncements(
  items: readonly UploadItem[],
  previous: ReadonlyMap<string, UploadItemStatus> | null,
): string[] {
  const messages: string[] = [];

  for (const item of items) {
    if (previous === null) {
      continue;
    }

    const name = formatUploadItemName(item);
    const previousStatus = previous.get(item.id);

    if (previousStatus === undefined) {
      messages.push(
        item.status === 'error'
          ? `No se pudo añadir ${name}. ${getUploadErrorCopy(item.error)}`
          : `Se ha añadido ${name} a la cola.`,
      );
      continue;
    }

    if (previousStatus === item.status) {
      continue;
    }

    switch (item.status) {
      case 'done':
        messages.push(`${name} se ha subido.`);
        break;
      case 'error':
        messages.push(`No se pudo subir ${name}. ${getUploadErrorCopy(item.error)}`);
        break;
      case 'cancelled':
        messages.push(`Se ha cancelado ${name}.`);
        break;
      case 'pending':
      case 'uploading':
        break;
    }
  }

  return messages;
}

export interface UploadAnnouncerProps {
  readonly items: readonly UploadItem[];
}

/**
 * Región viva única de la cola.
 *
 * Vive en el provider, así que sigue existiendo con la hoja cerrada o al
 * navegar dentro de la app. No anuncia porcentajes.
 */
export function UploadAnnouncer({ items }: UploadAnnouncerProps) {
  const previousStatusesRef = useRef<Map<string, UploadItemStatus> | null>(null);
  const clearTimerRef = useRef<number | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [overlayRoot, setOverlayRoot] = useState<HTMLElement | null>(null);

  // El overlay superior marca `inert` todo el resto de `body`; la región viva
  // se porta a su root para seguir anunciando con la hoja abierta.
  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const updateOverlayRoot = () => {
      const roots = document.querySelectorAll<HTMLElement>('[data-memora-overlay-root]');
      const next = roots.length > 0 ? (roots[roots.length - 1] ?? null) : null;

      setOverlayRoot((current) => (current === next ? current : next));
    };

    updateOverlayRoot();

    const observer = new MutationObserver(updateOverlayRoot);
    observer.observe(document.body, { childList: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const previous = previousStatusesRef.current;
    const next = new Map<string, UploadItemStatus>();

    for (const item of items) {
      next.set(item.id, item.status);
    }

    const messages = buildUploadAnnouncements(items, previous);
    previousStatusesRef.current = next;

    if (messages.length === 0) {
      return;
    }

    if (clearTimerRef.current !== null) {
      window.clearTimeout(clearTimerRef.current);
    }

    setAnnouncement(messages.join(' '));
    clearTimerRef.current = window.setTimeout(() => {
      setAnnouncement('');
      clearTimerRef.current = null;
    }, UPLOAD_ANNOUNCEMENT_CLEAR_MS);
  }, [items]);

  useEffect(
    () => () => {
      if (clearTimerRef.current !== null) {
        window.clearTimeout(clearTimerRef.current);
      }
    },
    [],
  );

  const region = (
    <p data-memora-live-region="" className="sr-only" aria-live="polite" aria-atomic="true">
      {announcement}
    </p>
  );

  return overlayRoot === null ? region : createPortal(region, overlayRoot);
}
