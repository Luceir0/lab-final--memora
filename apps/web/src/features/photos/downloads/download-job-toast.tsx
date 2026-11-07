import { Button, Toast, type ToastTone } from '@memora/ui';

import { getDownloadJobErrorCopy } from './errors';
import type { DownloadJobController } from './use-download-job';

export interface DownloadJobToastProps {
  readonly controller: DownloadJobController;
}

interface DownloadToastCopy {
  readonly tone: ToastTone;
  readonly title: string;
  readonly description: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
}

function toastCopy(controller: DownloadJobController): DownloadToastCopy | null {
  switch (controller.status) {
    case 'idle':
      return null;
    case 'creating':
    case 'pending':
    case 'processing':
      return {
        tone: 'neutral',
        title: 'Generando el ZIP…',
        description: 'Puede tardar unos minutos. Te avisaremos cuando esté listo.',
      };
    case 'ready':
      return {
        tone: 'success',
        title: 'ZIP listo, descarga iniciada',
        description: 'Si la descarga no empieza sola, vuelve a descargarla.',
        actionLabel: 'Volver a descargar',
        onAction: controller.downloadAgain,
      };
    case 'error': {
      const copy = getDownloadJobErrorCopy(controller.job, controller.error);

      return {
        tone: 'danger',
        title: copy.title,
        description: copy.description,
        actionLabel: 'Reintentar',
        onAction: controller.retry,
      };
    }
    case 'expired':
      return {
        tone: 'warning',
        title: 'El enlace ha caducado',
        description: 'El ZIP ya no está disponible. Genera otro para volver a descargar.',
        actionLabel: 'Generar otro',
        onAction: controller.retry,
      };
  }
}

/**
 * Estado del job en un aviso flotante.
 *
 * La región viva la aporta `Toast` (`status` o `alert`): solo se anuncian los
 * estados, nunca el porcentaje de `progress`. No se cierra solo: la descarga
 * puede terminar mientras el usuario sigue en otra parte de la página.
 */
export function DownloadJobToast({ controller }: DownloadJobToastProps) {
  const copy = toastCopy(controller);

  if (copy === null) {
    return null;
  }

  return (
    <Toast
      tone={copy.tone}
      title={copy.title}
      description={copy.description}
      onClose={controller.reset}
      action={
        copy.actionLabel === undefined || copy.onAction === undefined ? undefined : (
          <Button variant="secondary" size="sm" onClick={copy.onAction}>
            {copy.actionLabel}
          </Button>
        )
      }
    />
  );
}
