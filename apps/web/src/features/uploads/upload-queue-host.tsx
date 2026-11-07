import { useCallback, useEffect, useId, useRef } from 'react';

import { MAIN_CONTENT_ID } from '../../components/layout/skip-link';
import { COMPLETED_DISMISS_DELAY_MS } from './completed-dismiss';
import { UploadQueue } from './upload-queue';
import { UploadQueueBar } from './upload-queue-bar';
import { useUploadQueue } from './upload-queue-context';
import { useMediaQuery } from './use-media-query';

/**
 * Host único de la UI de la cola de subida.
 *
 * Se monta una sola vez en `_app`, fuera de las páginas, para que la barra y
 * el panel sobrevivan a la navegación interna. El estado de apertura vive en
 * el provider porque `enqueue` debe abrir el panel; aquí viven el id del
 * panel y la referencia de la barra, que son de esta instancia.
 *
 * Abrir desde la barra mueve el foco al panel de escritorio. El autoabrir tras
 * encolar no lo mueve. Al cerrar, el foco vuelve a la barra; si la cola quedó
 * vacía y la barra ya no existe, vuelve a `<main>` para no dejarlo en `body`.
 *
 * Cuando la cola queda inactiva y sin errores, los items terminados se limpian
 * solos a los 10 s para que la barra «Subidas terminadas» no sea permanente.
 */
export function UploadQueueHost() {
  const { items, summary, isPanelOpen, focusOnOpen, openPanel, closePanel, clearCompleted } =
    useUploadQueue();
  const panelId = useId();
  const barRef = useRef<HTMLButtonElement>(null);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // El panel de escritorio es no modal y flota: reservamos su altura en
  // `app.css` mientras está abierto para que el foco no quede tapado. En
  // móvil la hoja es modal y no lo necesita.
  useEffect(() => {
    if (!isDesktop || !isPanelOpen || typeof document === 'undefined') {
      return;
    }

    document.documentElement.dataset.uploadPanel = 'open';

    return () => {
      delete document.documentElement.dataset.uploadPanel;
    };
  }, [isDesktop, isPanelOpen]);

  const handleOpen = useCallback((): void => {
    openPanel({ focus: true });
  }, [openPanel]);

  const handleClose = useCallback((): void => {
    closePanel();

    window.requestAnimationFrame(() => {
      if (barRef.current !== null) {
        barRef.current.focus();
        return;
      }

      document.getElementById(MAIN_CONTENT_ID)?.focus();
    });
  }, [closePanel]);

  const focusMainContent = useCallback((): void => {
    document.getElementById(MAIN_CONTENT_ID)?.focus();
  }, []);

  const handleDismissCompleted = useCallback((): void => {
    clearCompleted();
    focusMainContent();
  }, [clearCompleted, focusMainContent]);

  // Auto-cierre: la cola lleva 10 s inactiva y sin errores.
  useEffect(() => {
    const isInactive = summary.pending === 0 && summary.active === 0;

    if (!isInactive || summary.failed > 0 || items.length === 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      clearCompleted();

      if (isPanelOpen) {
        handleClose();
        return;
      }

      focusMainContent();
    }, COMPLETED_DISMISS_DELAY_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    summary.pending,
    summary.active,
    summary.failed,
    items.length,
    isPanelOpen,
    clearCompleted,
    handleClose,
    focusMainContent,
  ]);

  return (
    <>
      <UploadQueueBar
        open={isPanelOpen}
        onOpen={handleOpen}
        panelId={panelId}
        buttonRef={barRef}
        onDismissCompleted={handleDismissCompleted}
      />
      <UploadQueue
        open={isPanelOpen}
        onClose={handleClose}
        panelId={panelId}
        focusOnOpen={focusOnOpen}
      />
    </>
  );
}
